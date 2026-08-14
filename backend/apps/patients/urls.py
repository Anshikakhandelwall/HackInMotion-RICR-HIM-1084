from django.urls import path
from .views import PatientProfileView

urlpatterns = [
    path('', PatientProfileView.as_view(), name='patient-profile'),
]
