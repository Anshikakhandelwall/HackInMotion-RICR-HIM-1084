"""
Role-based permission classes for MediGuard.

Usage:
    class MyView(APIView):
        authentication_classes = [SupabaseAuthentication]
        permission_classes = [IsAuthenticated, IsCaregiver]
"""
from rest_framework.permissions import BasePermission
from apps.authentication.models import ROLE_PATIENT, ROLE_CAREGIVER, ROLE_PHARMACIST


class IsPatient(BasePermission):
    """Allow access only to authenticated users with role == 'patient'."""
    message = "Only patients can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == ROLE_PATIENT


class IsCaregiver(BasePermission):
    """Allow access only to authenticated users with role == 'caregiver'."""
    message = "Only caregivers can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == ROLE_CAREGIVER


class IsPharmacist(BasePermission):
    """Allow access only to authenticated users with role == 'pharmacist'."""
    message = "Only pharmacists can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == ROLE_PHARMACIST


class IsPatientOrCaregiver(BasePermission):
    """Allow access to patients and caregivers (e.g. safety check)."""
    message = "Only patients or caregivers can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role in (ROLE_PATIENT, ROLE_CAREGIVER)
