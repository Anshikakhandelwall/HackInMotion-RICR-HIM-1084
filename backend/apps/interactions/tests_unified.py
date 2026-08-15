"""
Tests for the unified interaction workflow:
    POST /api/interactions/check/
    Medicine input → DDInter/RxNorm → openFDA supporting evidence → combined response

Test cases (12 required):
  1.  Authenticated request with valid medicines → 200 with interactions + supporting_evidence
  2.  Unauthenticated request → 401
  3.  Missing medicines field → 400
  4.  Empty medicines list → 400
  5.  Successful RxNorm→DDInter→openFDA flow (medicine resolved, interaction found, FDA evidence attached)
  6.  DDInter interaction found → interactions list non-empty
  7.  DDInter no interaction → interactions list empty, supporting_evidence still returned
  8.  openFDA unavailable but DDInter succeeds → DDInter result returned, evidence marked unavailable
  9.  RxNorm failure / medicine not in DB → checked_medicines empty, graceful response
  10. DDInter failure (DB error) → 500 handled
  11. Malformed openFDA response → evidence defaults gracefully, DDInter result unaffected
  12. Duplicate medicine handling → deduplicated in checked_medicines

All external API calls are mocked. No live openFDA or Supabase required.
"""

import json
import time
import uuid
import urllib.error
from unittest.mock import MagicMock, patch

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.medicines.models import Medicine, DDInterDrugMapping
from apps.interactions.models import DrugInteraction

# ── JWT helpers ───────────────────────────────────────────────────────────────

ISSUER = "https://test-project.supabase.co/auth/v1"
SUPABASE_SETTINGS = {
    "SUPABASE_JWT_ISSUER": ISSUER,
    "SUPABASE_JWKS_URL": "https://test-project.supabase.co/auth/v1/.well-known/jwks.json",
}

_PRIVATE_KEY = rsa.generate_private_key(
    public_exponent=65537, key_size=2048, backend=default_backend()
)
_PUBLIC_KEY = _PRIVATE_KEY.public_key()


def _make_token(sub=None):
    sub = sub or str(uuid.uuid4())
    return jwt.encode(
        {
            "sub": sub,
            "email": f"{sub[:8]}@example.com",
            "aud": "authenticated",
            "iss": ISSUER,
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
        _PRIVATE_KEY,
        algorithm="RS256",
    )


def _mock_jwks():
    mock_key = MagicMock()
    mock_key.key = _PUBLIC_KEY
    mock_key.algorithm_name = "RS256"
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = mock_key
    return patch(
        "apps.authentication.supabase_auth._get_jwks_client",
        return_value=mock_client,
    )


# ── openFDA mock helpers ──────────────────────────────────────────────────────

def _fda_label_response(drug_name):
    """Simulate a successful openFDA label hit."""
    return {
        "found": True,
        "drug_name": drug_name,
        "generic_name": drug_name,
        "brand_name": "",
        "rxcui": "",
        "drug_interactions": ["May interact with warfarin."],
        "warnings": ["Use with caution."],
        "precautions": [],
        "adverse_reactions": [],
        "source": "openFDA",
    }


def _fda_not_found(drug_name):
    return {"found": False, "drug_name": drug_name, "source": "openFDA"}


# ── Test class ────────────────────────────────────────────────────────────────

@override_settings(**SUPABASE_SETTINGS, OPENFDA_API_KEY="test-unified-key")
class UnifiedInteractionWorkflowTests(TestCase):
    """
    Tests for POST /api/interactions/check/ — unified DDInter + openFDA pipeline.
    """

    def setUp(self):
        self.client = APIClient()
        self.token = _make_token()
        self.url = "/api/interactions/check/"

        # Seed two medicines into the test DB
        self.med_a = Medicine.objects.create(
            rxcui="11289", rxnorm_name="warfarin", tty="IN"
        )
        self.med_b = Medicine.objects.create(
            rxcui="1191", rxnorm_name="aspirin", tty="IN"
        )
        self.med_c = Medicine.objects.create(
            rxcui="7052", rxnorm_name="morphine", tty="IN"
        )

        # Canonical pair: lower PK first
        a, b = sorted([self.med_a, self.med_b], key=lambda m: m.id)
        self.interaction = DrugInteraction.objects.create(
            medicine_a=a, medicine_b=b, level="Major"
        )

    def _post(self, payload, with_auth=True):
        """POST helper that patches JWKS and optionally attaches a token."""
        with _mock_jwks():
            headers = {}
            if with_auth:
                headers["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"
            return self.client.post(
                self.url,
                data=json.dumps(payload),
                content_type="application/json",
                **headers,
            )

    # ── 2. Unauthenticated → 401 ──────────────────────────────────────────────

    def test_unauthenticated_returns_401(self):
        """2. No Bearer token → 401."""
        response = self.client.post(
            self.url,
            data=json.dumps({"medicines": ["warfarin"]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    # ── 3. Missing medicines field → 400 ──────────────────────────────────────

    def test_missing_medicines_field_returns_400(self):
        """3. No 'medicines' key in body → 400."""
        response = self._post({})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])

    # ── 4. Empty medicines list → 400 ─────────────────────────────────────────

    def test_empty_medicines_list_returns_400(self):
        """4. medicines=[] → 400 (serializer rejects empty list)."""
        response = self._post({"medicines": []})
        self.assertEqual(response.status_code, 400)

    # ── 1 + 5 + 6. Authenticated, DDInter found, openFDA enriched ─────────────

    @patch("apps.interactions.views._fetch_openfda_evidence")
    def test_authenticated_valid_medicines_returns_200_with_evidence(self, mock_fda):
        """1 + 5 + 6. Valid authenticated request returns DDInter result + supporting_evidence."""
        # _fetch_openfda_evidence returns the full enriched list directly
        mock_fda.return_value = [
            {
                "drug": "warfarin",
                "source": "openFDA",
                "available": True,
                "generic_name": "warfarin",
                "brand_name": "",
                "rxcui": "11289",
                "drug_interactions": ["May increase bleeding with aspirin."],
                "warnings": ["Monitor INR."],
                "precautions": [],
                "adverse_reactions": [],
            },
            {
                "drug": "aspirin",
                "source": "openFDA",
                "available": True,
                "generic_name": "aspirin",
                "brand_name": "",
                "rxcui": "1191",
                "drug_interactions": [],
                "warnings": [],
                "precautions": [],
                "adverse_reactions": [],
            },
        ]

        response = self._post({"medicines": ["warfarin", "aspirin"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("interactions", data)
        self.assertIn("supporting_evidence", data)
        self.assertIn("checked_medicines", data)
        self.assertIn("summary", data)

        # 6. DDInter interaction found
        self.assertTrue(data["has_interactions"])
        self.assertEqual(len(data["interactions"]), 1)
        self.assertEqual(data["interactions"][0]["severity"], "Major")

        # supporting_evidence from openFDA
        self.assertEqual(len(data["supporting_evidence"]), 2)
        self.assertTrue(data["supporting_evidence"][0]["available"])

    # ── 7. DDInter no interaction, evidence still returned ────────────────────

    @patch("apps.interactions.views._fetch_openfda_evidence")
    def test_no_interaction_found_returns_empty_interactions(self, mock_fda):
        """7. Medicines with no DDInter pair → empty interactions, evidence still present."""
        mock_fda.return_value = [_fda_label_response("warfarin")]

        response = self._post({"medicines": ["warfarin", "morphine"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["has_interactions"])
        self.assertEqual(data["interactions"], [])
        self.assertIn("supporting_evidence", data)

    # ── 8. openFDA unavailable, DDInter result still returned ─────────────────

    @patch("apps.interactions.openfda_service.fetch_drug_label")
    def test_openfda_unavailable_ddinter_still_succeeds(self, mock_fetch):
        """8. openFDA raises unavailable error → DDInter result returned, evidence marked unavailable."""
        from apps.interactions.openfda_service import OpenFDAUnavailableError
        mock_fetch.side_effect = OpenFDAUnavailableError("Service down.")

        response = self._post({"medicines": ["warfarin", "aspirin"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        # DDInter interaction still returned
        self.assertTrue(data["has_interactions"])
        self.assertEqual(len(data["interactions"]), 1)
        # Evidence marked unavailable
        evidence = data["supporting_evidence"]
        self.assertTrue(len(evidence) > 0)
        self.assertFalse(evidence[0]["available"])

    # ── 9. Medicine not in DB → graceful empty result ─────────────────────────

    @patch("apps.interactions.views._fetch_openfda_evidence")
    def test_unknown_medicine_returns_empty_results(self, mock_fda):
        """9. Medicine not in RxNorm DB → checked_medicines empty, no crash."""
        mock_fda.return_value = []

        response = self._post({"medicines": ["unknowndrugxyz", "anotherfakedrugabc"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["checked_medicines"], [])
        self.assertFalse(data["has_interactions"])

    # ── 10. DDInter DB error → 500 (unhandled exception becomes 500) ──────────

    @patch("apps.interactions.services.InteractionEngine.check_interactions")
    def test_ddinter_failure_returns_500(self, mock_engine):
        """10. Unexpected DDInter engine failure → 500 (Django test client captures it)."""
        mock_engine.side_effect = Exception("DB connection lost")

        with self.assertRaises(Exception):
            self._post({"medicines": ["warfarin", "aspirin"]})

    # ── 11. Malformed openFDA response → defaults gracefully ──────────────────

    @patch("apps.interactions.views.fetch_drug_label")
    def test_malformed_openfda_response_does_not_crash(self, mock_fetch):
        """11. openFDA returns partial/empty label → evidence defaults, DDInter unaffected."""
        mock_fetch.return_value = {
            "found": True,
            "drug_name": "warfarin",
            "generic_name": "",
            "brand_name": "",
            "rxcui": "",
            "drug_interactions": [],
            "warnings": [],
            "precautions": [],
            "adverse_reactions": [],
            "source": "openFDA",
        }

        response = self._post({"medicines": ["warfarin", "aspirin"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["has_interactions"])
        # Evidence present but empty fields
        evidence = [e for e in data["supporting_evidence"] if e.get("available")]
        self.assertTrue(len(evidence) > 0)
        self.assertEqual(evidence[0]["warnings"], [])

    # ── 12. Duplicate medicine handling ───────────────────────────────────────

    @patch("apps.interactions.views._fetch_openfda_evidence")
    def test_duplicate_medicines_deduplicated(self, mock_fda):
        """12. Duplicate medicine inputs are deduplicated in checked_medicines."""
        mock_fda.return_value = [_fda_label_response("warfarin")]

        response = self._post({"medicines": ["warfarin", "warfarin", "aspirin"]})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        # warfarin should appear only once in checked_medicines
        names = [m["rxnorm_name"] for m in data["checked_medicines"]]
        self.assertEqual(names.count("warfarin"), 1)

    # ── Security: API key never in response ───────────────────────────────────

    @patch("apps.interactions.views._fetch_openfda_evidence")
    def test_api_key_never_in_response(self, mock_fda):
        """API key must never appear in the response body."""
        mock_fda.return_value = [_fda_label_response("warfarin")]

        response = self._post({"medicines": ["warfarin", "aspirin"]})
        response_text = response.content.decode()
        self.assertNotIn("test-unified-key", response_text)
        self.assertNotIn("api_key", response_text)
