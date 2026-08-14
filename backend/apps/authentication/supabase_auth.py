"""
Supabase JWT Authentication for Django REST Framework.

Verifies Supabase access tokens (RS256 JWTs) using the project's public JWKS
endpoint, then resolves or creates a lightweight Django User representing the
authenticated Supabase identity.

Flow:
  Authorization: Bearer <supabase_access_token>
      ↓
  Fetch/cache public keys from SUPABASE_JWKS_URL
      ↓
  Verify signature, iss, aud, exp
      ↓
  Extract sub (Supabase user UUID)
      ↓
  get_or_create Django User(username=sub)
      ↓
  request.user = Django User instance
"""

import logging

import jwt
from jwt import PyJWKClient, InvalidTokenError
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

# ── Module-level JWKS client ────────────────────────────────────────────────
# Instantiated once per process; PyJWKClient caches the fetched keys in memory
# and re-fetches only when a token carries an unknown key ID (kid).
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    """Return the module-level JWKS client, creating it on first call."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = getattr(settings, "SUPABASE_JWKS_URL", None)
        if not jwks_url:
            raise AuthenticationFailed(
                "SUPABASE_JWKS_URL is not configured on the server."
            )
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


class SupabaseAuthentication(BaseAuthentication):
    """
    DRF authentication class that verifies Supabase RS256 JWTs.

    Expects the header:
        Authorization: Bearer <supabase_access_token>

    On success returns (user, token_payload).
    On missing credentials returns (None, None) — allowing other auth classes to run.
    On invalid/expired/wrong-issuer tokens raises AuthenticationFailed (HTTP 401).
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header:
            return None  # No credentials — let other authenticators try.

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed(
                "Authorization header must be: Bearer <token>"
            )

        raw_token = parts[1]

        payload = self._verify_token(raw_token)
        user = self._get_or_create_user(payload)
        return (user, payload)

    # ── Private helpers ──────────────────────────────────────────────────────

    def _verify_token(self, raw_token: str) -> dict:
        """
        Verify the JWT signature and standard claims.
        Returns the decoded payload on success.
        Raises AuthenticationFailed on any failure.
        Never logs the raw token.
        """
        issuer = getattr(settings, "SUPABASE_JWT_ISSUER", None)
        if not issuer:
            raise AuthenticationFailed(
                "SUPABASE_JWT_ISSUER is not configured on the server."
            )

        try:
            client = _get_jwks_client()
            signing_key = client.get_signing_key_from_jwt(raw_token)
        except Exception:
            # Key fetch or kid-matching failure — treat as invalid token.
            logger.warning(
                "SupabaseAuthentication: failed to resolve signing key for token."
            )
            raise AuthenticationFailed("Invalid or unrecognised authentication token.")

        try:
            payload = jwt.decode(
                raw_token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=issuer,
                # Supabase sets aud to "authenticated" for user JWTs.
                audience="authenticated",
                options={
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": True,
                },
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Authentication token has expired.")
        except jwt.InvalidIssuerError:
            raise AuthenticationFailed("Authentication token has an invalid issuer.")
        except jwt.InvalidAudienceError:
            raise AuthenticationFailed("Authentication token has an invalid audience.")
        except InvalidTokenError as exc:
            logger.warning("SupabaseAuthentication: token validation failed: %s", type(exc).__name__)
            raise AuthenticationFailed("Invalid authentication token.")

        sub = payload.get("sub")
        if not sub:
            raise AuthenticationFailed("Authentication token is missing the sub claim.")

        return payload

    def _get_or_create_user(self, payload: dict) -> User:
        """
        Resolve a Django User from the verified JWT payload.

        Identity strategy:
          - Primary key: JWT `sub` claim (Supabase user UUID) stored as username.
          - Email is synced from the `email` claim on each authentication
            so it stays current if the user changes their Supabase email.
          - No health-profile fields are created here.

        This is a get-or-create, not a create-only, so repeated requests do
        not generate duplicate users.
        """
        sub = payload["sub"]
        email = payload.get("email", "")

        user, created = User.objects.get_or_create(
            username=sub,
            defaults={"email": email, "is_active": True},
        )

        if not created and user.email != email and email:
            # Keep email in sync with Supabase without triggering full save.
            User.objects.filter(pk=user.pk).update(email=email)
            user.email = email

        if created:
            logger.info(
                "SupabaseAuthentication: created Django user for Supabase sub=%s", sub
            )

        return user

    def authenticate_header(self, request):
        """Returned in WWW-Authenticate on 401 responses."""
        return "Bearer realm=\"api\""
