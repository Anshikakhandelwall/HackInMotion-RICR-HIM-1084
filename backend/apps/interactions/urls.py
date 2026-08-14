from django.urls import path
from apps.interactions.views import InteractionCheckView

app_name = "interactions"

urlpatterns = [
    path("check/", InteractionCheckView.as_view(), name="interaction-check"),
]
