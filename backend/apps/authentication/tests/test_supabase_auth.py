"""
Unit tests for SupabaseAuthentication.

All tests mock the JWKS boundary so no live Supabase project is needed.
The tests validate every specified rejection/acceptance path:

  1. Missing Authorization header → None (pass-through)
  2. Malformed Authorization header → 401
  3. Invalid JWT (bad signature) → 401
  4. Expired JWT → 401
  5. Wrong issuer → 401
  6. Wrong audience → 401
  7. Valid JWT → authenticated user returned
  8. Correct Supabase sub extracted from valid JWT
  9. Second request for same sub → get (no duplicate user created)
"""

import time
import uuid
from unittest.mock import MagicMock, patch

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import jwt
from django.contrib.auth.models import User
from django.test import TestCase, RequestFactory, override_settings
from rest_framework.exceptions import AuthenticationFailed

from apps.authentication.supabase_auth import SupabaseAuthentication

# ── Helpers ──────────────────────────────────────────────────────────────────

ISSUER = "https://test-project.supabase.co/auth/v1"
AUDIENCE = "authenticated"

SUPABASE_SETTINGS = {
    "SUPABASE_JWT_ISSUER": ISSUER,
    "SUPABASE_JWKS_URL": "https://test-project.supabase.co/auth/v1/.well-known/jwks.json",
}


def _make_rsa_key_pair():
    """Generate a throwaway RSA key pair for test signing."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )
    return private_key, private_key.public_key()


def _make_token(private_key, payload_overrides=None):
    """Sign a JWT with the given private key and sensible defaults."""
    sub = str(uuid.uuid4())
    payload = {
        "sub": sub,
        "email": f"{sub[:8]}@example.com",
        "aud": AUDIENCE,
        "iss": ISSUER,
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    if payload_overrides:
        payload.update(payload_overrides)
    return jwt.encode(payload, private_key, algorithm="RS256"), sub


def _mock_jwks_client(public_key):
    """
    Return a MagicMock that mimics PyJWKClient.get_signing_key_from_jwt()
    returning a signing key wrapping the provided public_key.
    """
    signing_key = MagicMock()
    signing_key.key = public_key
    signing_key.algorithm_name = "RS256"
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = signing_key
    return mock_client


# ── Test cases ───────────────────────────────────────────────────────────────

@override_settings(**SUPABASE_SETTINGS)
class SupabaseAuthenticationTests(TestCase):

    def setUp(self):
        self.factory = RequestFactory()
        self.auth = SupabaseAuthentication()
        self.private_key, self.public_key = _make_rsa_key_pair()

    def _request(self, header=None):
        request = self.factory.get("/api/auth/me/")
        if header:
            request.META["HTTP_AUTHORIZATION"] = header
        return request

    def _patch_jwks(self):
        """Context manager that patches the module-level JWKS client."""
        mock_client = _mock_jwks_client(self.public_key)
        return patch(
            "apps.authentication.supabase_auth._jwks_client",
            mock_client,
        )

    # 1. Missing Authorization header → pass-through (None, None)
    def test_missing_auth_header_returns_none(self):
        request = self._request()
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    # 2. Malformed Authorization header → 401
    def test_malformed_header_single_word_raises_401(self):
        request = self._request("Bearer")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_malformed_header_wrong_scheme_raises_401(self):
        request = self._request("Token sometoken")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_malformed_header_three_parts_raises_401(self):
        request = self._request("Bearer one two")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    # 3. Invalid JWT (bad signature) → 401
    def test_invalid_jwt_bad_signature_raises_401(self):
        token, _ = _make_token(self.private_key)
        # Swap in a different public key so verification fails.
        _, other_public_key = _make_rsa_key_pair()
        mock_client = _mock_jwks_client(other_public_key)
        with patch("apps.authentication.supabase_auth._jwks_client", mock_client):
            request = self._request(f"Bearer {token}")
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    def test_plaintext_not_jwt_raises_401(self):
        mock_client = _mock_jwks_client(self.public_key)
        # get_signing_key_from_jwt raises when the token isn't a JWT at all.
        mock_client.get_signing_key_from_jwt.side_effect = Exception("not a jwt")
        with patch("apps.authentication.supabase_auth._jwks_client", mock_client):
            request = self._request("Bearer notajwtatall")
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    # 4. Expired JWT → 401
    def test_expired_jwt_raises_401(self):
        token, _ = _make_token(
            self.private_key,
            {"exp": int(time.time()) - 120},  # expired 120 seconds ago (beyond 60s leeway)
        )
        with self._patch_jwks():
            request = self._request(f"Bearer {token}")
            with self.assertRaises(AuthenticationFailed) as cm:
                self.auth.authenticate(request)
        self.assertIn("expired", str(cm.exception.detail).lower())

    # 5. Wrong issuer → 401
    def test_wrong_issuer_raises_401(self):
        token, _ = _make_token(
            self.private_key,
            {"iss": "https://evil.example.com/auth/v1"},
        )
        with self._patch_jwks():
            request = self._request(f"Bearer {token}")
            with self.assertRaises(AuthenticationFailed) as cm:
                self.auth.authenticate(request)
        self.assertIn("issuer", str(cm.exception.detail).lower())

    # 6. Wrong audience → 401
    def test_wrong_audience_raises_401(self):
        token, _ = _make_token(
            self.private_key,
            {"aud": "service_role"},  # wrong aud
        )
        with self._patch_jwks():
            request = self._request(f"Bearer {token}")
            with self.assertRaises(AuthenticationFailed) as cm:
                self.auth.authenticate(request)
        self.assertIn("audience", str(cm.exception.detail).lower())

    # 7. Valid JWT → authenticated user returned
    def test_valid_jwt_returns_user_and_payload(self):
        token, sub = _make_token(self.private_key)
        with self._patch_jwks():
            request = self._request(f"Bearer {token}")
            result = self.auth.authenticate(request)

        self.assertIsNotNone(result)
        user, payload = result
        self.assertIsInstance(user, User)
        self.assertTrue(user.is_active)

    # 8. Correct sub extracted and stored as username
    def test_sub_stored_as_django_username(self):
        token, sub = _make_token(self.private_key)
        with self._patch_jwks():
            request = self._request(f"Bearer {token}")
            user, payload = self.auth.authenticate(request)

        self.assertEqual(user.username, sub)
        self.assertEqual(payload["sub"], sub)

    # 9. Repeated requests for same sub → get, not create (no duplicate users)
    def test_repeated_auth_does_not_duplicate_user(self):
        token, sub = _make_token(self.private_key)
        with self._patch_jwks():
            request1 = self._request(f"Bearer {token}")
            user1, _ = self.auth.authenticate(request1)
            request2 = self._request(f"Bearer {token}")
            user2, _ = self.auth.authenticate(request2)

        self.assertEqual(user1.pk, user2.pk)
        self.assertEqual(User.objects.filter(username=sub).count(), 1)

    # authenticate_header
    def test_authenticate_header_returns_bearer_realm(self):
        request = self._request()
        value = self.auth.authenticate_header(request)
        self.assertIn("Bearer", value)
