from django.urls import path
from apps.patients.views import PatientProfileView, DashboardOverviewView, PersonalizedSafetyCheckView

urlpatterns = [
    path("", PatientProfileView.as_view(), name="patient-profile"),
    path("dashboard/overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("safety-check/", PersonalizedSafetyCheckView.as_view(), name="patient-safety-check"),
]
