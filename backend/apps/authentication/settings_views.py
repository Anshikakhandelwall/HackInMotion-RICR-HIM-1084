"""
Settings API views for MediGuard.

All endpoints require authentication via SupabaseAuthentication.
User identity is derived exclusively from request.user — no user ID
is accepted from request body or URL params.

Endpoints:
    GET  /api/settings/         — retrieve user settings
    PATCH /api/settings/        — update user settings (partial)

    GET  /api/settings/export/  — export user data as JSON
    DELETE /api/settings/history/ — clear safety-check history (localStorage-based)
    DELETE /api/settings/account/ — delete account
"""
import json
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.authentication.models import UserProfile, UserSettings

logger = logging.getLogger(__name__)


def _get_or_create_settings(user):
    """Get or create UserSettings for the given user, with safe defaults."""
    settings_obj, _ = UserSettings.objects.get_or_create(user=user)
    return settings_obj


class UserSettingsView(APIView):
    """
    GET   /api/settings/  — return the authenticated user's settings
    PATCH /api/settings/  — partial update of settings
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj = _get_or_create_settings(request.user)
        return Response(
            {
                'success': True,
                'settings': _serialize_settings(settings_obj),
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        settings_obj = _get_or_create_settings(request.user)

        # Only accept known fields — ignore anything else to prevent injection
        allowed_fields = {
            'notify_safety_alerts',
            'notify_medicine_reminders',
            'notify_safety_check_updates',
            'notify_email',
            'language',
            'appearance',
            'default_safety_check',
        }

        updated = False
        for field in allowed_fields:
            if field in request.data:
                value = request.data[field]
                # Bool fields
                if field in {'notify_safety_alerts', 'notify_medicine_reminders',
                             'notify_safety_check_updates', 'notify_email',
                             'default_safety_check'}:
                    if not isinstance(value, bool):
                        return Response(
                            {'success': False, 'message': f'{field} must be a boolean.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                # String fields
                if field == 'language':
                    if not isinstance(value, str) or len(value) > 10:
                        return Response(
                            {'success': False, 'message': 'language must be a short string.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                if field == 'appearance':
                    if value not in {'light', 'dark', 'system'}:
                        return Response(
                            {'success': False, 'message': "appearance must be 'light', 'dark', or 'system'."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                setattr(settings_obj, field, value)
                updated = True

        if updated:
            settings_obj.save()

        return Response(
            {
                'success': True,
                'settings': _serialize_settings(settings_obj),
            },
            status=status.HTTP_200_OK,
        )


class UserDataExportView(APIView):
    """
    GET /api/settings/export/
    Export all permitted data for the authenticated user as a JSON response.
    Only data belonging to request.user is returned.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        settings_obj = _get_or_create_settings(user)

        export_data = {
            'account': {
                'email': user.email,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            },
            'profile': None,
            'settings': _serialize_settings(settings_obj),
        }

        if profile:
            export_data['profile'] = {
                'age': profile.age,
                'medical_conditions': profile.medical_conditions,
                'known_allergies': profile.known_allergies,
                'regular_medicines': profile.regular_medicines,
                'profile_completed': profile.profile_completed,
                'created_at': profile.created_at.isoformat() if profile.created_at else None,
                'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
            }

        return Response(
            {
                'success': True,
                'export': export_data,
            },
            status=status.HTTP_200_OK,
        )


class DeleteAccountView(APIView):
    """
    DELETE /api/settings/account/
    Permanently delete the authenticated user's account and all associated data.
    Cascades to UserProfile and UserSettings via FK CASCADE.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        email = user.email  # capture before deletion for logging

        try:
            user.delete()
            logger.info("Account deleted for user email=%s", email)
            return Response(
                {'success': True, 'message': 'Your account has been permanently deleted.'},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception("Failed to delete account for user email=%s: %s", email, exc)
            return Response(
                {'success': False, 'message': 'Unable to delete account. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _serialize_settings(settings_obj):
    return {
        'notify_safety_alerts': settings_obj.notify_safety_alerts,
        'notify_medicine_reminders': settings_obj.notify_medicine_reminders,
        'notify_safety_check_updates': settings_obj.notify_safety_check_updates,
        'notify_email': settings_obj.notify_email,
        'language': settings_obj.language,
        'appearance': settings_obj.appearance,
        'default_safety_check': settings_obj.default_safety_check,
        'updated_at': settings_obj.updated_at.isoformat() if settings_obj.updated_at else None,
    }
