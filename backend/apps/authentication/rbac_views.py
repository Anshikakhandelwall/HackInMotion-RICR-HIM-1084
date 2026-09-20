"""
RBAC-specific API views for MediGuard.

Caregiver endpoints:
  POST   /api/rbac/caregiver/generate-code/                — generate a connection invite code
  POST   /api/rbac/caregiver/approve-connection/           — patient approves an invite code
  GET    /api/rbac/caregiver/connections/                   — caregiver lists their approved patients
  DELETE /api/rbac/caregiver/connections/<id>/              — caregiver removes a patient connection
  GET    /api/rbac/caregiver/patient/<id>/profile/          — caregiver reads a connected patient's profile
  POST   /api/rbac/caregiver/patient/<id>/safety-check/     — caregiver runs safety check FOR a patient
  PATCH  /api/rbac/caregiver/patient/<id>/medicines/        — caregiver updates a patient's medicine list

Pharmacist endpoints:
  GET    /api/rbac/pharmacist/cases/                        — list pharmacist's own cases
  POST   /api/rbac/pharmacist/cases/                        — create a new case
  GET    /api/rbac/pharmacist/cases/<id>/                   — get a single case
  PATCH  /api/rbac/pharmacist/cases/<id>/                   — update case (add medicines, notes, patient_id)
  DELETE /api/rbac/pharmacist/cases/<id>/                   — delete case
  POST   /api/rbac/pharmacist/cases/<id>/safety-check/      — run safety check on case medicines
"""
import secrets
import string
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.authentication.models import (
    UserProfile,
    CaregiverPatientConnection,
    PharmacistCase,
    ROLE_PATIENT,
    ROLE_CAREGIVER,
)
from apps.authentication.permissions import IsCaregiver, IsPharmacist
from apps.patients.services import PatientSafetyEngine

logger = logging.getLogger(__name__)


def _generate_code(length=8):
    """Return a random uppercase alphanumeric code."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ─────────────────────────────────────────────────────────────
# Caregiver: Generate connection code
# ─────────────────────────────────────────────────────────────

class CaregiverGenerateCodeView(APIView):
    """
    POST /api/rbac/caregiver/generate-code/
    Caregiver generates a short code that a patient can enter to initiate a connection.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def post(self, request):
        # Generate a unique code (retry on collision)
        for _ in range(10):
            code = _generate_code()
            if not CaregiverPatientConnection.objects.filter(connection_code=code).exists():
                break
        else:
            return Response(
                {'detail': 'Could not generate a unique code. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        connection = CaregiverPatientConnection.objects.create(
            caregiver=request.user,
            connection_code=code,
            status=CaregiverPatientConnection.STATUS_PENDING,
        )
        return Response({'connection_code': code, 'id': connection.id}, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# Patient: Approve a caregiver connection via code
# ─────────────────────────────────────────────────────────────

class PatientApproveConnectionView(APIView):
    """
    POST /api/rbac/caregiver/approve-connection/
    Body: { "connection_code": "ABCD1234" }
    The authenticated patient approves the pending connection identified by the code.
    Only users with role='patient' can call this.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Any authenticated user (patient) can approve
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != ROLE_PATIENT:
            return Response(
                {'detail': 'Only patients can approve caregiver connections.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = request.data.get('connection_code', '').strip().upper()
        if not code:
            return Response({'detail': 'connection_code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            connection = CaregiverPatientConnection.objects.get(
                connection_code=code,
                status=CaregiverPatientConnection.STATUS_PENDING,
            )
        except CaregiverPatientConnection.DoesNotExist:
            return Response(
                {'detail': 'Invalid or already-used connection code.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if connection.caregiver == request.user:
            return Response(
                {'detail': 'You cannot connect to yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicate active connections
        if CaregiverPatientConnection.objects.filter(
            caregiver=connection.caregiver,
            patient=request.user,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).exists():
            return Response(
                {'detail': 'This caregiver is already connected to your account.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Assign the patient and approve
        connection.patient = request.user
        connection.status = CaregiverPatientConnection.STATUS_APPROVED
        connection.save(update_fields=['patient', 'status', 'updated_at'])

        return Response(
            {'detail': 'Connection approved.', 'caregiver_email': connection.caregiver.email},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# Caregiver: List connected patients
# ─────────────────────────────────────────────────────────────

class CaregiverConnectionsView(APIView):
    """
    GET    /api/rbac/caregiver/connections/   — list approved patients
    DELETE /api/rbac/caregiver/connections/<id>/ — remove a connection
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def get(self, request):
        connections = CaregiverPatientConnection.objects.filter(
            caregiver=request.user,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).select_related('patient__profile')

        patients = []
        for conn in connections:
            p = conn.patient
            profile = getattr(p, 'profile', None)
            patients.append({
                'connection_id': conn.id,
                'patient_id': p.id,
                'email': p.email,
                'full_name': p.first_name or p.email,
                'age': profile.age if profile else None,
                'medical_conditions': profile.medical_conditions if profile else '',
                'known_allergies': profile.known_allergies if profile else '',
                'regular_medicines': profile.regular_medicines if profile else [],
            })

        return Response({'patients': patients}, status=status.HTTP_200_OK)


class CaregiverConnectionDetailView(APIView):
    """DELETE /api/rbac/caregiver/connections/<id>/"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def delete(self, request, pk):
        try:
            conn = CaregiverPatientConnection.objects.get(pk=pk, caregiver=request.user)
        except CaregiverPatientConnection.DoesNotExist:
            return Response({'detail': 'Connection not found.'}, status=status.HTTP_404_NOT_FOUND)
        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# Caregiver: Read a connected patient's profile
# ─────────────────────────────────────────────────────────────

class CaregiverPatientProfileView(APIView):
    """
    GET /api/rbac/caregiver/patient/<patient_id>/profile/
    Returns the health profile of a patient the caregiver is approved to access.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def get(self, request, patient_id):
        approved = CaregiverPatientConnection.objects.filter(
            caregiver=request.user,
            patient_id=patient_id,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).exists()

        if not approved:
            return Response(
                {'detail': 'You are not authorised to view this patient\'s profile.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = UserProfile.objects.select_related('user').get(user_id=patient_id)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'patient_id': patient_id,
            'email': profile.user.email,
            'full_name': profile.user.first_name or profile.user.email,
            'age': profile.age,
            'medical_conditions': profile.medical_conditions,
            'known_allergies': profile.known_allergies,
            'regular_medicines': profile.regular_medicines,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# Caregiver: Run safety check FOR a connected patient
# ─────────────────────────────────────────────────────────────

class CaregiverPatientSafetyCheckView(APIView):
    """
    POST /api/rbac/caregiver/patient/<patient_id>/safety-check/
    Runs PatientSafetyEngine using the patient's own medicines, conditions and allergies.
    The caregiver must be approved for this patient.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def post(self, request, patient_id):
        approved = CaregiverPatientConnection.objects.filter(
            caregiver=request.user,
            patient_id=patient_id,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).exists()

        if not approved:
            return Response(
                {'detail': 'You are not authorised to run safety checks for this patient.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = UserProfile.objects.get(user_id=patient_id)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Caregiver may supply override medicines list in the body; fall back to patient's own
        medicines = request.data.get('medicines') or profile.regular_medicines or []
        if not medicines:
            return Response(
                {'detail': 'Patient has no medicines listed to check.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report = PatientSafetyEngine.evaluate_patient_safety(
            medicines=medicines,
            medical_conditions=profile.medical_conditions or '',
            known_allergies=profile.known_allergies or '',
        )

        return Response({'success': True, 'patient_id': patient_id, **report}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# Caregiver: Update a connected patient's medicine list
# ─────────────────────────────────────────────────────────────

class CaregiverPatientMedicinesView(APIView):
    """
    PATCH /api/rbac/caregiver/patient/<patient_id>/medicines/
    Body: { "regular_medicines": [...] }
    Caregiver updates the regular_medicines list on an approved patient's profile.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsCaregiver]

    def patch(self, request, patient_id):
        approved = CaregiverPatientConnection.objects.filter(
            caregiver=request.user,
            patient_id=patient_id,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).exists()

        if not approved:
            return Response(
                {'detail': 'You are not authorised to update this patient\'s medicines.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        medicines = request.data.get('regular_medicines')
        if medicines is None or not isinstance(medicines, list):
            return Response({'detail': 'regular_medicines must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(user_id=patient_id)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile.regular_medicines = [str(m).strip() for m in medicines if str(m).strip()]
        profile.save(update_fields=['regular_medicines', 'updated_at'])

        return Response({'patient_id': patient_id, 'regular_medicines': profile.regular_medicines}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# Pharmacist: Cases CRUD
# ─────────────────────────────────────────────────────────────

class PharmacistCaseListCreateView(APIView):
    """
    GET  /api/rbac/pharmacist/cases/  — list own cases
    POST /api/rbac/pharmacist/cases/  — create a case
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsPharmacist]

    def _serialize_case(self, case):
        return {
            'id': case.id,
            'title': case.title,
            'medicines': case.medicines,
            'notes': case.notes,
            'interaction_result': case.interaction_result,
            'patient_id': case.patient_id,
            'created_at': case.created_at.isoformat(),
            'updated_at': case.updated_at.isoformat(),
        }

    def get(self, request):
        cases = PharmacistCase.objects.filter(pharmacist=request.user).order_by('-created_at')
        return Response({'cases': [self._serialize_case(c) for c in cases]}, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title', '').strip()
        medicines = request.data.get('medicines', [])
        notes = request.data.get('notes', '').strip()

        if not isinstance(medicines, list):
            return Response({'detail': 'medicines must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        case = PharmacistCase.objects.create(
            pharmacist=request.user,
            title=title,
            medicines=medicines,
            notes=notes,
        )
        return Response(self._serialize_case(case), status=status.HTTP_201_CREATED)


class PharmacistCaseDetailView(APIView):
    """
    GET    /api/rbac/pharmacist/cases/<id>/
    PATCH  /api/rbac/pharmacist/cases/<id>/
    DELETE /api/rbac/pharmacist/cases/<id>/
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsPharmacist]

    def _get_own_case(self, request, pk):
        try:
            return PharmacistCase.objects.get(pk=pk, pharmacist=request.user)
        except PharmacistCase.DoesNotExist:
            return None

    def _serialize_case(self, case):
        return {
            'id': case.id,
            'title': case.title,
            'medicines': case.medicines,
            'notes': case.notes,
            'interaction_result': case.interaction_result,
            'patient_id': case.patient_id,
            'created_at': case.created_at.isoformat(),
            'updated_at': case.updated_at.isoformat(),
        }

    def get(self, request, pk):
        case = self._get_own_case(request, pk)
        if not case:
            return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._serialize_case(case), status=status.HTTP_200_OK)

    def patch(self, request, pk):
        case = self._get_own_case(request, pk)
        if not case:
            return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'title' in request.data:
            case.title = request.data['title']
        if 'medicines' in request.data:
            medicines = request.data['medicines']
            if not isinstance(medicines, list):
                return Response({'detail': 'medicines must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
            case.medicines = medicines
        if 'notes' in request.data:
            case.notes = request.data['notes']
        if 'patient_id' in request.data:
            # Allow linking / unlinking an authorised patient to this case
            pid = request.data['patient_id']
            if pid is None:
                case.patient = None
            else:
                case.patient_id = int(pid)

        case.save()
        return Response(self._serialize_case(case), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        case = self._get_own_case(request, pk)
        if not case:
            return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
        case.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# Pharmacist: Run safety check on a case
# ─────────────────────────────────────────────────────────────

class PharmacistCaseSafetyCheckView(APIView):
    """
    POST /api/rbac/pharmacist/cases/<id>/safety-check/
    Runs PatientSafetyEngine on the case's medicines.
    Optionally uses an approved patient's medical_conditions as context.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsPharmacist]

    def post(self, request, pk):
        try:
            case = PharmacistCase.objects.get(pk=pk, pharmacist=request.user)
        except PharmacistCase.DoesNotExist:
            return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)

        medicines = case.medicines
        if not medicines:
            return Response(
                {'detail': 'No medicines in this case to check.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pull patient context only when a patient is linked to the case.
        # The pharmacist never sees raw patient data — it is only used as
        # engine context to surface relevant warnings.
        medical_conditions = ''
        known_allergies = ''
        patient_context = None
        if case.patient_id:
            try:
                patient_profile = UserProfile.objects.get(user_id=case.patient_id)
                medical_conditions = patient_profile.medical_conditions or ''
                known_allergies = patient_profile.known_allergies or ''
                patient_context = {
                    'age': patient_profile.age,
                    'has_conditions': bool(medical_conditions),
                    'has_allergies': bool(known_allergies),
                }
            except UserProfile.DoesNotExist:
                pass

        report = PatientSafetyEngine.evaluate_patient_safety(
            medicines=medicines,
            medical_conditions=medical_conditions,
            known_allergies=known_allergies,
        )

        # Persist result on the case
        case.interaction_result = report
        case.save(update_fields=['interaction_result', 'updated_at'])

        return Response({
            'success': True,
            'patient_context_used': patient_context is not None,
            'patient_context': patient_context,
            **report,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# Patient: List and revoke caregiver connections
# ─────────────────────────────────────────────────────────────

class PatientCaregiverListView(APIView):
    """
    GET /api/rbac/patient/caregivers/
    Returns all approved caregiver connections for the authenticated patient.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != ROLE_PATIENT:
            return Response(
                {'detail': 'Only patients can access this resource.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        connections = CaregiverPatientConnection.objects.filter(
            patient=request.user,
            status=CaregiverPatientConnection.STATUS_APPROVED,
        ).select_related('caregiver')

        caregivers = [
            {
                'connection_id': conn.id,
                'caregiver_id': conn.caregiver_id,
                'email': conn.caregiver.email,
                'full_name': conn.caregiver.first_name or conn.caregiver.email,
                'connected_since': conn.updated_at.isoformat(),
            }
            for conn in connections
        ]

        return Response({'caregivers': caregivers}, status=status.HTTP_200_OK)


class PatientCaregiverDetailView(APIView):
    """
    DELETE /api/rbac/patient/caregivers/<id>/
    Patient revokes a specific caregiver's access.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != ROLE_PATIENT:
            return Response(
                {'detail': 'Only patients can access this resource.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            conn = CaregiverPatientConnection.objects.get(pk=pk, patient=request.user)
        except CaregiverPatientConnection.DoesNotExist:
            return Response({'detail': 'Connection not found.'}, status=status.HTTP_404_NOT_FOUND)

        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
