from django.urls import path
from apps.interactions.views import InteractionCheckView, InteractionExplainView

app_name = "interactions"

urlpatterns = [
    path("check/", InteractionCheckView.as_view(), name="interaction-check"),
    path("explain/", InteractionExplainView.as_view(), name="interaction-explain"),
]
