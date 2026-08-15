"""
Patient profile and dashboard safety API views.

All secured endpoints use SupabaseAuthentication so request.user is the Django User
whose username equals the Supabase JWT sub claim.

Profile ownership is enforced exclusively by request.user — no user ID is
accepted from the request body or URL.
"""
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.jwt_auth import JWTAuthentication
from apps.authentication.models import UserProfile
from apps.patients.serializers import PatientProfileSerializer
from apps.patients.services import PatientSafetyEngine

logger = logging.getLogger(__name__)


class PatientProfileView(APIView):
    """
    GET   /api/profile/  — retrieve the authenticated user's health profile
    POST  /api/profile/  — create (idempotent: updates if already exists)
    PATCH /api/profile/  — partial update of the authenticated user's health profile
    """
    authentication_classes = [JWTAuthentication]
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
        Idempotent: safe to call even if a profile already exists.
        The user ID is NEVER read from the request body.
        """
        serializer = PatientProfileSerializer(
            data=request.data,
            context={'user': request.user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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


class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/overview/
    Provides aggregated dashboard metrics: active medicines count, safety overview summary,
    and recent interaction check highlights for the authenticated user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        regular_meds = (profile.regular_medicines or []) if profile else []
        medical_conditions = (profile.medical_conditions or "") if profile else ""

        if not regular_meds:
            return Response(
                {
                    "success": True,
                    "safety_overview": {
                        "title": "Safety Overview",
                        "mainValue": "No Medicines",
                        "supportingText": "Add your regular medicines in your profile to see safety insights.",
                        "lastChecked": "Today",
                        "hasWarnings": False,
                        "majorCount": 0,
                        "moderateCount": 0,
                    },
                    "active_medicines_count": 0,
                    "regular_medicines": [],
                    "medical_conditions": medical_conditions,
                },
                status=status.HTTP_200_OK,
            )

        safety_report = PatientSafetyEngine.evaluate_patient_safety(
            medicines=regular_meds,
            medical_conditions=medical_conditions,
        )

        major_count = safety_report["summary"]["major_warnings"]
        moderate_count = safety_report["summary"]["moderate_warnings"]
        total_warnings = major_count + moderate_count

        return Response(
            {
                "success": True,
                "safety_overview": {
                    "title": "Safety Overview",
                    "mainValue": f"{total_warnings} Active Warning{'s' if total_warnings != 1 else ''}" if total_warnings > 0 else "All Clear",
                    "supportingText": "Potential medication interactions need your attention." if total_warnings > 0 else "No active medication interactions identified.",
                    "lastChecked": "Today",
                    "hasWarnings": total_warnings > 0,
                    "majorCount": major_count,
                    "moderateCount": moderate_count,
                },
                "active_medicines_count": len(regular_meds),
                "regular_medicines": regular_meds,
                "medical_conditions": medical_conditions,
            },
            status=status.HTTP_200_OK,
        )


class PersonalizedSafetyCheckView(APIView):
    """
    POST /api/patients/safety-check/
    Combines canonical drug-drug interactions with patient medical conditions to return
    personalized safety warnings.  Requires authentication.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        medicines = request.data.get("medicines", [])
        medical_conditions = request.data.get("medicalConditions", "")

        # Fall back to authenticated user's profile data when not supplied in body
        profile = getattr(request.user, 'profile', None)
        if not medicines and profile:
            medicines = profile.regular_medicines or []
            if not medical_conditions:
                medical_conditions = profile.medical_conditions or ""

        if not medicines:
            return Response(
                {
                    "success": False,
                    "message": "Please provide a list of medicines to check.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        report = PatientSafetyEngine.evaluate_patient_safety(
            medicines=medicines,
            medical_conditions=medical_conditions,
        )

        return Response(
            {
                "success": True,
                **report,
            },
            status=status.HTTP_200_OK,
        )
