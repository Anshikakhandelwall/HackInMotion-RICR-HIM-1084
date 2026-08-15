"""
Supabase JWT Authentication for Django REST Framework.

Supports all Supabase JWT signing configurations:

    RS256
        Asymmetric RSA signing.
        Verified locally using Supabase JWKS.

    ES256
        Asymmetric elliptic-curve signing.
        Verified locally using Supabase JWKS.

    HS256
        Legacy/shared-secret signing.
        Verified through the Supabase Auth /user endpoint because
        HS256 does not expose a public verification key through JWKS.

Authentication flow:

    Authorization: Bearer <supabase_access_token>
        ↓
    Read JWT header
        ↓
    ┌─────────────────────────────────────────────┐
    │ RS256 / ES256                               │
    │     ↓                                       │
    │ Supabase JWKS                               │
    │     ↓                                       │
    │ Verify signature + issuer + audience + exp  │
    │                                             │
    │ HS256                                       │
    │     ↓                                       │
    │ Supabase Auth /user endpoint                │
    │     ↓                                       │
    │ Verify token with Supabase                  │
    └─────────────────────────────────────────────┘
        ↓
    Extract Supabase user UUID (sub)
        ↓
    get_or_create Django User(username=sub)
        ↓
    request.user = Django User
"""

import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import jwt
from jwt import InvalidTokenError, PyJWKClient

from django.conf import settings
from django.contrib.auth.models import User

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Supported algorithms
# ---------------------------------------------------------------------------
#
# Supabase currently supports asymmetric RS256 and ES256 signing.
# HS256 is supported for legacy/shared-secret projects.
#
# IMPORTANT:
# Never accept an arbitrary algorithm supplied by the JWT.
# The algorithm is read only to select a verification strategy, and each
# strategy has its own explicit allow-list.
#
SUPPORTED_ASYMMETRIC_ALGORITHMS = {"RS256", "ES256"}
SUPPORTED_ALGORITHMS = SUPPORTED_ASYMMETRIC_ALGORITHMS | {"HS256"}


# ---------------------------------------------------------------------------
# Module-level JWKS client
# ---------------------------------------------------------------------------
#
# PyJWKClient caches public keys in memory.
# A single client is reused within the Django process.
#
# This is used ONLY for asymmetric algorithms (RS256 / ES256).
#
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    """
    Return the module-level Supabase JWKS client.

    The JWKS URL should normally be:

        https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
    """

    global _jwks_client

    if _jwks_client is None:
        jwks_url = getattr(settings, "SUPABASE_JWKS_URL", None)

        if not jwks_url:
            raise AuthenticationFailed(
                "SUPABASE_JWKS_URL is not configured on the server."
            )

        _jwks_client = PyJWKClient(
            jwks_url,
            cache_keys=True,
        )

    return _jwks_client


# ---------------------------------------------------------------------------
# Main DRF authentication class
# ---------------------------------------------------------------------------


class SupabaseAuthentication(BaseAuthentication):
    """
    Django REST Framework authentication backend for Supabase.

    Expected request header:

        Authorization: Bearer <supabase_access_token>

    Behaviour:

        No Authorization header
            → return None

        Invalid Authorization header
            → 401

        Invalid JWT
            → 401

        Valid JWT
            → resolve/create Django User
            → return (user, token_payload)
    """

    def authenticate(self, request):
        """
        Authenticate a request using the Supabase access token.
        """

        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        # ---------------------------------------------------------------
        # No credentials
        # ---------------------------------------------------------------
        #
        # Returning None allows other DRF authentication classes to run.
        #
        if not auth_header:
            return None

        parts = auth_header.split()

        # ---------------------------------------------------------------
        # Validate Authorization header format
        # ---------------------------------------------------------------

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed(
                "Authorization header must be: Bearer <token>"
            )

        raw_token = parts[1]

        if not raw_token:
            raise AuthenticationFailed(
                "Authentication token is missing."
            )

        # ---------------------------------------------------------------
        # Verify token
        # ---------------------------------------------------------------

        payload = self._verify_token(raw_token)

        # ---------------------------------------------------------------
        # Resolve Django user
        # ---------------------------------------------------------------

        user = self._get_or_create_user(payload)

        return (user, payload)

    # ===================================================================
    # TOKEN VERIFICATION
    # ===================================================================

    def _verify_token(self, raw_token: str) -> dict:
        """
        Verify a Supabase access token.

        The JWT header determines which verification strategy is used:

            RS256 → JWKS
            ES256 → JWKS
            HS256 → Supabase Auth /user

        Returns:
            Verified JWT payload.

        Raises:
            AuthenticationFailed
        """

        # ---------------------------------------------------------------
        # Read JWT header WITHOUT trusting it.
        # ---------------------------------------------------------------
        #
        # get_unverified_header() is ONLY used to determine which
        # verification strategy to execute.
        #
        # We do NOT consider the token valid at this point.
        #
        try:
            header = jwt.get_unverified_header(raw_token)
        except jwt.DecodeError:
            raise AuthenticationFailed(
                "Invalid authentication token."
            )

        algorithm = header.get("alg")

        if not algorithm:
            raise AuthenticationFailed(
                "Authentication token is missing the alg claim."
            )

        # ---------------------------------------------------------------
        # Reject unsupported algorithms
        # ---------------------------------------------------------------

        if algorithm not in SUPPORTED_ALGORITHMS:
            logger.warning(
                "SupabaseAuthentication: unsupported JWT algorithm=%s",
                algorithm,
            )

            raise AuthenticationFailed(
                "Authentication token uses an unsupported signing algorithm."
            )

        # ---------------------------------------------------------------
        # HS256
        # ---------------------------------------------------------------
        #
        # HS256 is symmetric signing.
        #
        # There is no public verification key available through JWKS.
        #
        # Therefore we ask Supabase Auth itself to validate the token.
        #
        if algorithm == "HS256":
            jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None)
            if jwt_secret:
                return self._verify_hs256_locally(raw_token, jwt_secret)
            return self._verify_hs256_with_supabase(
                raw_token
            )

        # ---------------------------------------------------------------
        # RS256 / ES256
        # ---------------------------------------------------------------
        #
        # Both are asymmetric algorithms.
        #
        # Supabase exposes their public keys through JWKS.
        #
        return self._verify_asymmetric_token(
            raw_token,
            algorithm,
        )

    # ===================================================================
    # ASYMMETRIC TOKEN VERIFICATION
    # ===================================================================

    def _verify_asymmetric_token(
        self,
        raw_token: str,
        algorithm: str,
    ) -> dict:
        """
        Verify an RS256 or ES256 token using Supabase JWKS.
        """

        issuer = getattr(
            settings,
            "SUPABASE_JWT_ISSUER",
            None,
        )

        if not issuer:
            raise AuthenticationFailed(
                "SUPABASE_JWT_ISSUER is not configured on the server."
            )

        # ---------------------------------------------------------------
        # Resolve signing key from JWKS
        # ---------------------------------------------------------------

        try:
            client = _get_jwks_client()

            signing_key = client.get_signing_key_from_jwt(
                raw_token
            )

        except Exception:
            logger.warning(
                "SupabaseAuthentication: failed to resolve "
                "signing key from JWKS."
            )

            raise AuthenticationFailed(
                "Invalid or unrecognised authentication token."
            )

        # ---------------------------------------------------------------
        # Verify algorithm matches the key/JWT strategy
        # ---------------------------------------------------------------

        key_algorithm = getattr(
            signing_key,
            "algorithm_name",
            None,
        )

        if key_algorithm and key_algorithm != algorithm:
            logger.warning(
                "SupabaseAuthentication: JWT algorithm %s "
                "does not match signing key algorithm %s.",
                algorithm,
                key_algorithm,
            )

            raise AuthenticationFailed(
                "Authentication token signing algorithm is invalid."
            )

        # ---------------------------------------------------------------
        # Decode and validate
        # ---------------------------------------------------------------

        try:
            payload = jwt.decode(
                raw_token,
                signing_key.key,

                # Explicit allow-list.
                #
                # We never blindly trust the JWT's alg value.
                algorithms=[
                    algorithm,
                ],

                issuer=issuer,

                # Supabase user access tokens use:
                #
                # aud = authenticated
                #
                audience="authenticated",

                options={
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": True,
                },
            )

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed(
                "Authentication token has expired."
            )

        except jwt.InvalidIssuerError:
            raise AuthenticationFailed(
                "Authentication token has an invalid issuer."
            )

        except jwt.InvalidAudienceError:
            raise AuthenticationFailed(
                "Authentication token has an invalid audience."
            )

        except InvalidTokenError as exc:
            logger.warning(
                "SupabaseAuthentication: asymmetric token "
                "validation failed: %s",
                type(exc).__name__,
            )

            raise AuthenticationFailed(
                "Invalid authentication token."
            )

        # ---------------------------------------------------------------
        # Validate subject
        # ---------------------------------------------------------------

        sub = payload.get("sub")

        if not sub:
            raise AuthenticationFailed(
                "Authentication token is missing the sub claim."
            )

        return payload

    # ===================================================================
    # HS256 TOKEN VERIFICATION
    # ===================================================================

    def _verify_hs256_locally(self, raw_token: str, secret: str) -> dict:
        """
        Verify an HS256 token using the local SUPABASE_JWT_SECRET.
        """
        try:
            payload = jwt.decode(
                raw_token,
                secret,
                algorithms=["HS256"],
                options={
                    "verify_exp": True,
                    "verify_aud": False,
                },
            )
            sub = payload.get("sub")
            if not sub:
                raise AuthenticationFailed("Authentication token is missing the sub claim.")
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Authentication token has expired.")
        except InvalidTokenError as exc:
            logger.warning("SupabaseAuthentication: local HS256 validation failed: %s", type(exc).__name__)
            raise AuthenticationFailed("Invalid authentication token.")

    def _verify_hs256_with_supabase(
        self,
        raw_token: str,
    ) -> dict:
        """
        Verify an HS256 token through Supabase Auth.

        Supabase's /auth/v1/user endpoint validates the supplied
        access token and returns the authenticated user.

        This avoids storing or using the legacy JWT secret in Django.

        Required backend settings:

            SUPABASE_URL
            SUPABASE_PUBLISHABLE_KEY

        The publishable key is safe to use for identifying the
        Supabase project. NEVER put a service-role/secret key in
        frontend code.
        """

        supabase_url = getattr(
            settings,
            "SUPABASE_URL",
            None,
        )

        if not supabase_url:
            raise AuthenticationFailed(
                "SUPABASE_URL is not configured on the server."
            )

        # ---------------------------------------------------------------
        # Prefer the new publishable key.
        #
        # Fall back to SUPABASE_KEY for compatibility with your existing
        # project configuration.
        # ---------------------------------------------------------------

        publishable_key = getattr(
            settings,
            "SUPABASE_PUBLISHABLE_KEY",
            None,
        )

        if not publishable_key:
            publishable_key = getattr(
                settings,
                "SUPABASE_KEY",
                None,
            )

        if not publishable_key:
            raise AuthenticationFailed(
                "SUPABASE_PUBLISHABLE_KEY is not configured on the server."
            )

        # ---------------------------------------------------------------
        # Construct Supabase Auth user endpoint
        # ---------------------------------------------------------------

        user_url = (
            supabase_url.rstrip("/")
            + "/auth/v1/user"
        )

        request = Request(
            user_url,
            method="GET",
            headers={
                "apikey": publishable_key,
                "Authorization": f"Bearer {raw_token}",
                "Accept": "application/json",
            },
        )

        # ---------------------------------------------------------------
        # Ask Supabase to verify the token
        # ---------------------------------------------------------------

        try:
            with urlopen(
                request,
                timeout=10,
            ) as response:

                status_code = response.status

                if status_code != 200:
                    raise AuthenticationFailed(
                        "Invalid authentication token."
                    )

                # The response contains the authenticated Supabase
                # user information.
                #
                # We only use it AFTER Supabase has returned HTTP 200.
                import json

                user_data = json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as exc:

            # Do not expose the response body because it may contain
            # unnecessary authentication details.
            if exc.code in (401, 403):
                raise AuthenticationFailed(
                    "Invalid authentication token."
                )

            logger.warning(
                "SupabaseAuthentication: Supabase Auth returned "
                "HTTP %s while validating HS256 token.",
                exc.code,
            )

            raise AuthenticationFailed(
                "Unable to validate authentication token."
            )

        except URLError:
            logger.exception(
                "SupabaseAuthentication: unable to contact "
                "Supabase Auth."
            )

            raise AuthenticationFailed(
                "Unable to contact authentication service."
            )

        except TimeoutError:
            logger.exception(
                "SupabaseAuthentication: Supabase Auth request timed out."
            )

            raise AuthenticationFailed(
                "Authentication service timed out."
            )

        except AuthenticationFailed:
            raise

        except Exception:
            logger.exception(
                "SupabaseAuthentication: unexpected error while "
                "validating HS256 token."
            )

            raise AuthenticationFailed(
                "Unable to validate authentication token."
            )

        # ---------------------------------------------------------------
        # Build a payload-like object from the verified Supabase user.
        # ---------------------------------------------------------------
        #
        # We need the `sub` and email values for the same Django user
        # mapping used by RS256/ES256.
        #
        sub = user_data.get("id")

        if not sub:
            raise AuthenticationFailed(
                "Authenticated Supabase user is missing an ID."
            )

        return {
            "sub": sub,
            "email": user_data.get("email", ""),
            "aud": "authenticated",
        }

    # ===================================================================
    # DJANGO USER RESOLUTION
    # ===================================================================

    def _get_or_create_user(
        self,
        payload: dict,
    ) -> User:
        """
        Resolve a Django User from the verified Supabase identity.

        Identity strategy:

            Supabase JWT:
                sub = Supabase user UUID

                    ↓

            Django:
                username = Supabase UUID

        Repeated authentication requests therefore resolve to the
        same Django user instead of creating duplicates.
        """

        sub = payload["sub"]

        email = payload.get(
            "email",
            "",
        )

        # ---------------------------------------------------------------
        # Create Django identity if necessary
        # ---------------------------------------------------------------

        user, created = User.objects.get_or_create(
            username=sub,
            defaults={
                "email": email,
                "is_active": True,
            },
        )

        # ---------------------------------------------------------------
        # Keep email synchronized
        # ---------------------------------------------------------------

        if (
            not created
            and email
            and user.email != email
        ):
            User.objects.filter(
                pk=user.pk
            ).update(
                email=email
            )

            user.email = email

        # ---------------------------------------------------------------
        # Logging
        # ---------------------------------------------------------------

        if created:
            logger.info(
                "SupabaseAuthentication: created Django user "
                "for Supabase sub=%s",
                sub,
            )

        return user

    # ===================================================================
    # DRF WWW-AUTHENTICATE HEADER
    # ===================================================================

    def authenticate_header(
        self,
        request,
    ):
        """
        Returned in the WWW-Authenticate header on 401 responses.
        """

        return 'Bearer realm="api"'