from django.urls import path
from apps.interactions.views import InteractionCheckView, InteractionExplainView, OpenFDALabelView

app_name = "interactions"

urlpatterns = [
    path("check", InteractionCheckView.as_view()),
    path("check/", InteractionCheckView.as_view(), name="interaction-check"),
    path("explain", InteractionExplainView.as_view()),
    path("explain/", InteractionExplainView.as_view(), name="interaction-explain"),
    path("openfda/", OpenFDALabelView.as_view(), name="openfda-label"),
]
