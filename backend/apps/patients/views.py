"""
Patient profile API views.

All endpoints use SupabaseAuthentication so request.user is the Django User
whose username equals the Supabase JWT sub claim.

Profile ownership is enforced exclusively by request.user — no user ID is
accepted from the request body or URL.
"""
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.authentication.models import UserProfile
from .serializers import PatientProfileSerializer

logger = logging.getLogger(__name__)


class PatientProfileView(APIView):
    """
    GET  /api/profile/   — retrieve the authenticated user's health profile
    POST /api/profile/   — create (idempotent: updates if already exists)
    PATCH /api/profile/  — partial update of the authenticated user's health profile
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    # ── GET ───────────────────────────────────────────────────────────────────

    def get(self, request):
        """
        Return the authenticated user's health profile.
        If no profile exists, return 404 with a clear status indicator
        so the frontend can redirect to onboarding.
        """
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response(
                {
                    'profile_exists': False,
                    'profile_completed': False,
                    'detail': 'No profile found for this user.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PatientProfileSerializer(profile)
        return Response(
            {
                'profile_exists': True,
                'profile': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── POST ──────────────────────────────────────────────────────────────────

    def post(self, request):
        """
        Create or update the authenticated user's health profile.
        Idempotent: safe to call even if a profile already exists
        (acts as upsert — prevents duplicate-profile bugs).
        The user ID is NEVER read from the request body.
        """
        serializer = PatientProfileSerializer(
            data=request.data,
            context={'user': request.user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # get_or_create ensures no duplicate profile
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer.update(profile, serializer.validated_data)

        result = PatientProfileSerializer(profile)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(
            {
                'profile_exists': True,
                'profile': result.data,
            },
            status=http_status,
        )

    # ── PATCH ─────────────────────────────────────────────────────────────────

    def patch(self, request):
        """
        Partially update the authenticated user's health profile.
        Only supplied fields are modified.
        """
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response(
                {'detail': 'No profile found. Use POST to create one first.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PatientProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'user': request.user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        result = PatientProfileSerializer(profile)
        return Response(
            {
                'profile_exists': True,
                'profile': result.data,
            },
            status=status.HTTP_200_OK,
        )
