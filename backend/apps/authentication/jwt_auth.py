"""
Custom JWT Authentication & Token Utilities for Django REST Framework.

Provides secure HS256 JWT generation and validation using Django's SECRET_KEY.
Does NOT rely on any third-party external auth provider.
"""

import datetime
import logging
import jwt

from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

# JWT settings
ACCESS_TOKEN_LIFETIME = datetime.timedelta(hours=24)
REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=7)
ALGORITHM = "HS256"


def generate_tokens_for_user(user: User) -> dict:
    """
    Generate signed JWT access and refresh tokens for a Django user.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    
    access_payload = {
        "user_id": user.pk,
        "email": user.email,
        "username": user.username,
        "token_type": "access",
        "iat": now,
        "exp": now + ACCESS_TOKEN_LIFETIME,
    }
    
    refresh_payload = {
        "user_id": user.pk,
        "token_type": "refresh",
        "iat": now,
        "exp": now + REFRESH_TOKEN_LIFETIME,
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access": access_token,
        "refresh": refresh_token,
        "expires_in": int(ACCESS_TOKEN_LIFETIME.total_seconds()),
    }


def verify_refresh_token(refresh_token: str) -> User:
    """
    Verify a refresh token and return the associated active Django User.
    Raises AuthenticationFailed if invalid or expired.
    """
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Refresh token has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid refresh token.")

    if payload.get("token_type") != "refresh":
        raise AuthenticationFailed("Invalid token type. Expected refresh token.")

    user_id = payload.get("user_id")
    if not user_id:
        raise AuthenticationFailed("Invalid refresh token payload.")

    try:
        user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        raise AuthenticationFailed("User associated with this token no longer exists.")

    return user


class JWTAuthentication(BaseAuthentication):
    """
    DRF Authentication class that validates Authorization: Bearer <access_token>.
    """
    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed("Authorization header must be: Bearer <token>")

        raw_token = parts[1]
        if not raw_token:
            raise AuthenticationFailed("Authentication token is missing.")

        try:
            payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Authentication token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid authentication token.")

        if payload.get("token_type") != "access":
            raise AuthenticationFailed("Invalid token type. Expected access token.")

        user_id = payload.get("user_id")
        if not user_id:
            raise AuthenticationFailed("Invalid token payload: user_id missing.")

        try:
            user = User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed("User no longer exists or is deactivated.")

        return (user, payload)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
