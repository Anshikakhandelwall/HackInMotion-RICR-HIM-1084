"""
Tests for the openFDA Drug Label API integration.

All tests mock the external openFDA HTTP request so no real API key
or network access is required.

Test cases:
  1.  Valid medicine lookup returns normalized structure
  2.  Medicine not found returns found=False
  3.  Missing API key raises ValueError / view returns 503
  4.  openFDA timeout → OpenFDAUnavailableError / view returns 503
  5.  openFDA HTTP failure (non-404) → OpenFDAError / view returns 502
  6.  Malformed / partial openFDA response — missing fields default gracefully
  7.  API key is never present in the view response
  8.  Unauthenticated request → 401
  9.  Missing drug query parameter → 400
"""

import json
import time
import uuid
import urllib.error
from io import BytesIO
from unittest.mock import MagicMock, patch

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

# ── Shared JWT helpers (same pattern as authentication/patients tests) ────────

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


def _mock_jwks(mocker_target):
    """Patch JWKS client so tokens signed with _PRIVATE_KEY verify correctly."""
    mock_key = MagicMock()
    mock_key.key = _PUBLIC_KEY
    mock_key.algorithm_name = "RS256"
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = mock_key
    return patch(mocker_target, return_value=mock_client)


# ── Helpers for constructing fake openFDA HTTP responses ─────────────────────

def _fda_response(results: list) -> MagicMock:
    """Return a mock urllib response that yields the given results list."""
    body = json.dumps({"results": results}).encode()
    mock_resp = MagicMock()
    mock_resp.read.return_value = body
    mock_resp.status = 200
    mock_resp.__enter__ = lambda s: s
    mock_resp.__exit__ = MagicMock(return_value=False)
    return mock_resp


def _fda_404():
    """Simulate openFDA 404 (drug not found for this search field)."""
    exc = urllib.error.HTTPError(url=None, code=404, msg="Not Found", hdrs=None, fp=None)
    return exc


def _fda_http_error(code=500):
    return urllib.error.HTTPError(url=None, code=code, msg="Server Error", hdrs=None, fp=None)


def _fda_network_error():
    return urllib.error.URLError(reason="Connection refused")


# ── Service-level unit tests ──────────────────────────────────────────────────

class OpenFDAServiceTests(TestCase):
    """Tests for fetch_drug_label() in openfda_service.py"""

    @override_settings(OPENFDA_API_KEY="test-key-unit")
    @patch("urllib.request.urlopen")
    def test_valid_lookup_returns_normalized_structure(self, mock_urlopen):
        """1. Valid medicine lookup returns normalized result with expected keys."""
        mock_urlopen.return_value = _fda_response([
            {
                "openfda": {
                    "generic_name": ["warfarin"],
                    "brand_name": ["Coumadin"],
                    "rxcui": ["11289"],
                },
                "drug_interactions": ["Aspirin may increase bleeding risk."],
                "warnings": ["Monitor INR closely."],
                "precautions": ["Avoid NSAIDs."],
                "adverse_reactions": ["Bleeding."],
            }
        ])

        from apps.interactions.openfda_service import fetch_drug_label
        result = fetch_drug_label("warfarin")

        self.assertTrue(result["found"])
        self.assertEqual(result["drug_name"], "warfarin")
        self.assertEqual(result["generic_name"], "warfarin")
        self.assertEqual(result["brand_name"], "Coumadin")
        self.assertEqual(result["rxcui"], "11289")
        self.assertIn("Aspirin", result["drug_interactions"])
        self.assertEqual(result["source"], "openFDA")

    @override_settings(OPENFDA_API_KEY="test-key-unit")
    @patch("urllib.request.urlopen")
    def test_medicine_not_found_returns_found_false(self, mock_urlopen):
        """2. All search fields return 404 → found=False."""
        mock_urlopen.side_effect = _fda_404()

        from apps.interactions.openfda_service import fetch_drug_label
        result = fetch_drug_label("unknownxyz123")

        self.assertFalse(result["found"])
        self.assertEqual(result["drug_name"], "unknownxyz123")
        self.assertEqual(result["source"], "openFDA")

    @override_settings(OPENFDA_API_KEY=None)
    def test_missing_api_key_raises_value_error(self):
        """3. Missing API key raises ValueError before any network call."""
        from apps.interactions.openfda_service import fetch_drug_label
        with self.assertRaises(ValueError):
            fetch_drug_label("warfarin")

    @override_settings(OPENFDA_API_KEY="test-key-unit")
    @patch("urllib.request.urlopen")
    def test_timeout_raises_unavailable_error(self, mock_urlopen):
        """4. Network timeout raises OpenFDAUnavailableError."""
        mock_urlopen.side_effect = TimeoutError()

        from apps.interactions.openfda_service import fetch_drug_label, OpenFDAUnavailableError
        with self.assertRaises(OpenFDAUnavailableError):
            fetch_drug_label("warfarin")

    @override_settings(OPENFDA_API_KEY="test-key-unit")
    @patch("urllib.request.urlopen")
    def test_http_500_raises_openfda_error(self, mock_urlopen):
        """5. openFDA HTTP 500 raises OpenFDAError."""
        mock_urlopen.side_effect = _fda_http_error(500)

        from apps.interactions.openfda_service import fetch_drug_label, OpenFDAError
        with self.assertRaises(OpenFDAError):
            fetch_drug_label("warfarin")

    @override_settings(OPENFDA_API_KEY="test-key-unit")
    @patch("urllib.request.urlopen")
    def test_partial_response_defaults_gracefully(self, mock_urlopen):
        """6. Partial/minimal openFDA response — missing fields return empty strings/lists."""
        mock_urlopen.return_value = _fda_response([
            {
                "openfda": {},
                # No drug_interactions, warnings, etc.
            }
        ])

        from apps.interactions.openfda_service import fetch_drug_label
        result = fetch_drug_label("somedrugname")

        self.assertTrue(result["found"])
        self.assertEqual(result["generic_name"], "")
        self.assertEqual(result["brand_name"], "")
        self.assertEqual(result["rxcui"], "")
        self.assertEqual(result["drug_interactions"], [])
        self.assertEqual(result["warnings"], [])
        self.assertEqual(result["precautions"], [])
        self.assertEqual(result["adverse_reactions"], [])


# ── View-level integration tests ─────────────────────────────────────────────

@override_settings(**SUPABASE_SETTINGS)
class OpenFDAViewTests(TestCase):
    """Tests for GET /api/interactions/openfda/"""

    def setUp(self):
        self.client = APIClient()
        self.token = _make_token()
        self.url = "/api/interactions/openfda/"

    def _auth_get(self, params=""):
        with _mock_jwks("apps.authentication.supabase_auth._get_jwks_client"):
            return self.client.get(
                f"{self.url}{params}",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            )

    def test_unauthenticated_returns_401(self):
        """8. No token → 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_missing_drug_param_returns_400(self):
        """9. Missing ?drug= param → 400."""
        response = self._auth_get()
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["success"])

    @override_settings(OPENFDA_API_KEY="test-key-view")
    @patch("apps.interactions.openfda_service.urllib.request.urlopen")
    def test_valid_lookup_returns_200_and_no_api_key(self, mock_urlopen):
        """7 + valid. Successful lookup returns 200 and never exposes API key."""
        mock_urlopen.return_value = _fda_response([
            {
                "openfda": {
                    "generic_name": ["warfarin"],
                    "brand_name": ["Coumadin"],
                    "rxcui": ["11289"],
                },
                "drug_interactions": ["Aspirin increases bleeding risk."],
                "warnings": ["Monitor INR."],
                "precautions": ["Avoid NSAIDs."],
                "adverse_reactions": ["Bleeding."],
            }
        ])

        response = self._auth_get("?drug=warfarin")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["source"], "openFDA")
        self.assertIn("drug", data)
        self.assertIn("safety_information", data)

        # 7. API key must never appear anywhere in the response
        response_text = json.dumps(data)
        self.assertNotIn("test-key-view", response_text)
        self.assertNotIn("api_key", response_text)

    @override_settings(OPENFDA_API_KEY="test-key-view")
    @patch("apps.interactions.openfda_service.urllib.request.urlopen")
    def test_medicine_not_found_returns_404(self, mock_urlopen):
        """2 (view). Drug not found → 404."""
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url=None, code=404, msg="Not Found", hdrs=None, fp=None
        )

        response = self._auth_get("?drug=unknownxyz999")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertFalse(data["success"])

    @override_settings(OPENFDA_API_KEY=None)
    def test_missing_api_key_returns_503(self):
        """3 (view). Missing API key → 503."""
        response = self._auth_get("?drug=warfarin")
        self.assertEqual(response.status_code, 503)
        data = response.json()
        self.assertFalse(data["success"])

    @override_settings(OPENFDA_API_KEY="test-key-view")
    @patch("apps.interactions.openfda_service.urllib.request.urlopen")
    def test_timeout_returns_503(self, mock_urlopen):
        """4 (view). Timeout → 503."""
        mock_urlopen.side_effect = TimeoutError()
        response = self._auth_get("?drug=warfarin")
        self.assertEqual(response.status_code, 503)

    @override_settings(OPENFDA_API_KEY="test-key-view")
    @patch("apps.interactions.openfda_service.urllib.request.urlopen")
    def test_openfda_http_error_returns_502(self, mock_urlopen):
        """5 (view). openFDA HTTP 500 → 502."""
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url=None, code=500, msg="Server Error", hdrs=None, fp=None
        )
        response = self._auth_get("?drug=warfarin")
        self.assertEqual(response.status_code, 502)
