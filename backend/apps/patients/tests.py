"""
Tests for the patient profile API.

Uses the same mock-JWT pattern as the authentication tests:
the SupabaseAuthentication JWKS boundary is patched so no live
Supabase project is required.

Tests cover:
  1.  Unauthenticated GET  → 401
  2.  Unauthenticated POST → 401
  3.  Authenticated user, no profile row yet → 404 with profile_exists: false
  4.  Authenticated user can POST to create profile
  5.  POST is idempotent (repeat POST does not create duplicate)
  6.  Authenticated user can GET own profile
  7.  Authenticated user can PATCH own profile
  8.  Profile belongs to the authenticated Django user
  9.  User A cannot read User B's profile
  10. Invalid age → 400
  11. Invalid regularMedicines type → 400
  12. Valid profile data → profile_completed becomes true
  13. Empty medicalConditions → profile_completed stays false after PATCH
"""

import time
import uuid
from unittest.mock import MagicMock, patch

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import jwt
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.authentication.models import UserProfile

# ── Shared test helpers ───────────────────────────────────────────────────────

ISSUER = "https://test-project.supabase.co/auth/v1"
AUDIENCE = "authenticated"

SUPABASE_SETTINGS = {
    "SUPABASE_JWT_ISSUER": ISSUER,
    "SUPABASE_JWKS_URL": "https://test-project.supabase.co/auth/v1/.well-known/jwks.json",
}


def _make_rsa_key_pair():
    private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=2048, backend=default_backend()
    )
    return private_key, private_key.public_key()


PRIVATE_KEY, PUBLIC_KEY = _make_rsa_key_pair()


def _make_token(sub=None, private_key=None, overrides=None):
    sub = sub or str(uuid.uuid4())
    private_key = private_key or PRIVATE_KEY
    payload = {
        "sub": sub,
        "email": f"{sub[:8]}@example.com",
        "aud": AUDIENCE,
        "iss": ISSUER,
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    if overrides:
        payload.update(overrides)
    return jwt.encode(payload, private_key, algorithm="RS256"), sub, payload["email"]


def _mock_signing_key():
    signing_key = MagicMock()
    signing_key.key = PUBLIC_KEY
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = signing_key
    return mock_client


def _jwks_patch():
    return patch(
        "apps.authentication.supabase_auth._jwks_client",
        _mock_signing_key(),
    )


# ── Test suite ────────────────────────────────────────────────────────────────

@override_settings(**SUPABASE_SETTINGS)
class PatientProfileAPITests(TestCase):

    PROFILE_URL = "/api/profile/"

    def setUp(self):
        self.client = APIClient()

    # ── Helper ────────────────────────────────────────────────────────────────

    def _auth_client(self, sub=None):
        """Return an APIClient with a valid Bearer token for the given sub."""
        token, sub, email = _make_token(sub=sub)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client, sub, email

    # 1. Unauthenticated GET → 401
    def test_unauthenticated_get_returns_401(self):
        response = self.client.get(self.PROFILE_URL)
        self.assertEqual(response.status_code, 401)

    # 2. Unauthenticated POST → 401
    def test_unauthenticated_post_returns_401(self):
        response = self.client.post(self.PROFILE_URL, {}, format="json")
        self.assertEqual(response.status_code, 401)

    # 3. Authenticated, no profile row → 404 + profile_exists: false
    def test_authenticated_no_profile_returns_404(self):
        client, sub, _ = self._auth_client()
        # Delete the auto-created profile so we're testing the bare 404 path.
        with _jwks_patch():
            # First touch to create the Django user
            client.get(self.PROFILE_URL)
            user = User.objects.get(username=sub)
            UserProfile.objects.filter(user=user).delete()
            response = client.get(self.PROFILE_URL)
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data["profile_exists"])
        self.assertFalse(response.data["profile_completed"])

    # 4. Authenticated user can POST to create profile
    def test_authenticated_user_can_create_profile(self):
        client, sub, _ = self._auth_client()
        payload = {
            "age": 30,
            "medicalConditions": "Diabetes",
            "regularMedicines": ["Metformin"],
        }
        with _jwks_patch():
            response = client.post(self.PROFILE_URL, payload, format="json")
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(response.data["profile_exists"])
        self.assertEqual(response.data["profile"]["age"], 30)
        self.assertEqual(response.data["profile"]["medicalConditions"], "Diabetes")
        self.assertEqual(response.data["profile"]["regularMedicines"], ["Metformin"])

    # 5. POST is idempotent — no duplicate profiles
    def test_repeated_post_does_not_create_duplicate_profile(self):
        client, sub, _ = self._auth_client()
        payload = {"age": 25, "medicalConditions": "NONE", "regularMedicines": []}
        with _jwks_patch():
            client.post(self.PROFILE_URL, payload, format="json")
            client.post(self.PROFILE_URL, payload, format="json")
        user = User.objects.get(username=sub)
        self.assertEqual(UserProfile.objects.filter(user=user).count(), 1)

    # 6. Authenticated user can GET own profile
    def test_authenticated_user_can_get_own_profile(self):
        client, sub, _ = self._auth_client()
        payload = {"age": 28, "medicalConditions": "Asthma", "regularMedicines": []}
        with _jwks_patch():
            client.post(self.PROFILE_URL, payload, format="json")
            response = client.get(self.PROFILE_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["age"], 28)

    # 7. Authenticated user can PATCH own profile
    def test_authenticated_user_can_patch_profile(self):
        client, sub, _ = self._auth_client()
        with _jwks_patch():
            client.post(
                self.PROFILE_URL,
                {"age": 40, "medicalConditions": "Hypertension", "regularMedicines": []},
                format="json",
            )
            response = client.patch(
                self.PROFILE_URL,
                {"medicalConditions": "Hypertension, Diabetes"},
                format="json",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["profile"]["medicalConditions"], "Hypertension, Diabetes"
        )

    # 8. Profile is associated with the authenticated Django user
    def test_profile_belongs_to_authenticated_user(self):
        client, sub, _ = self._auth_client()
        with _jwks_patch():
            client.post(
                self.PROFILE_URL,
                {"age": 33, "medicalConditions": "None", "regularMedicines": []},
                format="json",
            )
        user = User.objects.get(username=sub)
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.user.username, sub)

    # 9. User A cannot access User B's profile
    def test_user_a_cannot_read_user_b_profile(self):
        client_a, sub_a, _ = self._auth_client()
        client_b, sub_b, _ = self._auth_client()

        with _jwks_patch():
            # User A creates a profile
            client_a.post(
                self.PROFILE_URL,
                {"age": 22, "medicalConditions": "Allergy", "regularMedicines": []},
                format="json",
            )
            # User B reads their own profile (not user A's)
            response_b = client_b.get(self.PROFILE_URL)

        # User B should get their own (empty) profile, not user A's data
        if response_b.status_code == 200:
            self.assertNotEqual(response_b.data["profile"].get("age"), 22)
        else:
            # 404 is also acceptable — user B has no profile yet
            self.assertEqual(response_b.status_code, 404)

    # 10. Invalid age → 400
    def test_invalid_age_returns_400(self):
        client, _, _ = self._auth_client()
        with _jwks_patch():
            response = client.post(
                self.PROFILE_URL,
                {"age": 999, "medicalConditions": "None", "regularMedicines": []},
                format="json",
            )
        self.assertEqual(response.status_code, 400)

    # 11. Invalid regularMedicines type → 400
    def test_invalid_medicines_type_returns_400(self):
        client, _, _ = self._auth_client()
        with _jwks_patch():
            response = client.post(
                self.PROFILE_URL,
                {"age": 30, "medicalConditions": "None", "regularMedicines": "not-a-list"},
                format="json",
            )
        self.assertEqual(response.status_code, 400)

    # 12. Valid complete profile → profile_completed = true
    def test_valid_profile_sets_profile_completed(self):
        client, sub, _ = self._auth_client()
        with _jwks_patch():
            client.post(
                self.PROFILE_URL,
                {"age": 35, "medicalConditions": "Diabetes", "regularMedicines": []},
                format="json",
            )
            response = client.get(self.PROFILE_URL)
        self.assertTrue(response.data["profile"]["profileCompleted"])

    # 13. Profile with empty medicalConditions → profile_completed stays false
    def test_empty_conditions_profile_not_completed(self):
        client, sub, _ = self._auth_client()
        with _jwks_patch():
            client.post(
                self.PROFILE_URL,
                {"age": 30, "medicalConditions": "", "regularMedicines": []},
                format="json",
            )
            response = client.get(self.PROFILE_URL)
        self.assertFalse(response.data["profile"]["profileCompleted"])
