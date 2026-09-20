"""
URL patterns for RBAC (caregiver and pharmacist) endpoints.
Mounted under /api/rbac/ in config/urls.py.
"""
from django.urls import path
from apps.authentication.rbac_views import (
    CaregiverGenerateCodeView,
    PatientApproveConnectionView,
    CaregiverConnectionsView,
    CaregiverConnectionDetailView,
    CaregiverPatientProfileView,
    CaregiverPatientSafetyCheckView,
    CaregiverPatientMedicinesView,
    PharmacistCaseListCreateView,
    PharmacistCaseDetailView,
    PharmacistCaseSafetyCheckView,
    PatientCaregiverListView,
    PatientCaregiverDetailView,
)

urlpatterns = [
    # ── Caregiver ─────────────────────────────────────────────────────────────
    path('caregiver/generate-code/', CaregiverGenerateCodeView.as_view(), name='caregiver-generate-code'),
    path('caregiver/approve-connection/', PatientApproveConnectionView.as_view(), name='patient-approve-connection'),
    path('caregiver/connections/', CaregiverConnectionsView.as_view(), name='caregiver-connections'),
    path('caregiver/connections/<int:pk>/', CaregiverConnectionDetailView.as_view(), name='caregiver-connection-detail'),
    path('caregiver/patient/<int:patient_id>/profile/', CaregiverPatientProfileView.as_view(), name='caregiver-patient-profile'),
    path('caregiver/patient/<int:patient_id>/safety-check/', CaregiverPatientSafetyCheckView.as_view(), name='caregiver-patient-safety-check'),
    path('caregiver/patient/<int:patient_id>/medicines/', CaregiverPatientMedicinesView.as_view(), name='caregiver-patient-medicines'),

    # ── Patient caregiver access ───────────────────────────────────────────────
    path('patient/caregivers/', PatientCaregiverListView.as_view(), name='patient-caregivers'),
    path('patient/caregivers/<int:pk>/', PatientCaregiverDetailView.as_view(), name='patient-caregiver-detail'),

    # ── Pharmacist ────────────────────────────────────────────────────────────
    path('pharmacist/cases/', PharmacistCaseListCreateView.as_view(), name='pharmacist-cases'),
    path('pharmacist/cases/<int:pk>/', PharmacistCaseDetailView.as_view(), name='pharmacist-case-detail'),
    path('pharmacist/cases/<int:pk>/safety-check/', PharmacistCaseSafetyCheckView.as_view(), name='pharmacist-case-safety-check'),
]
