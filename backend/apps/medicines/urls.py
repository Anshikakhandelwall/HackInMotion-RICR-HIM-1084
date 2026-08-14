from django.urls import path
from apps.medicines.views import (
    MedicineListView,
    MedicineDetailView,
    MedicineRxCUIDetailView,
)

app_name = "medicines"

urlpatterns = [
    path("", MedicineListView.as_view(), name="medicine-list"),
    path("<int:pk>/", MedicineDetailView.as_view(), name="medicine-detail"),
    path("rxcui/<str:rxcui>/", MedicineRxCUIDetailView.as_view(), name="medicine-rxcui-detail"),
]
