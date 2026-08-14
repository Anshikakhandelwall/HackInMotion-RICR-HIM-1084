from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.interactions.serializers import InteractionCheckRequestSerializer
from apps.interactions.services import InteractionEngine
from apps.ai.schemas.interaction import Severity


class InteractionCheckView(APIView):
    """
    POST /api/interactions/check/
    Accepts a list of medicine identifiers (RxCUIs, database IDs, or drug names),
    resolves canonical medicine records, performs pairwise interaction checks,
    and returns matching drug-drug interactions with severity levels.
    """

    def post(self, request):
        serializer = InteractionCheckRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        medicines_list = serializer.validated_data["medicines"]

        result = InteractionEngine.check_interactions(medicines_list)

        return Response(
            {
                "success": True,
                **result,
            },
            status=status.HTTP_200_OK,
        )


class InteractionExplainView(APIView):
    """
    POST /api/interactions/explain/
    Accepts drug_a and drug_b (and optional severity), invokes the AI layer,
    and returns structured clinical guidance for:
    - What does this mean?
    - What to watch for?
    - What should you do?
    """

    def post(self, request):
        drug_a = request.data.get("drug_a") or request.data.get("drugA") or ""
        drug_b = request.data.get("drug_b") or request.data.get("drugB") or ""

        if not drug_a or not drug_b:
            medicines = request.data.get("medicines", [])
            if isinstance(medicines, list) and len(medicines) >= 2:
                drug_a = str(medicines[0])
                drug_b = str(medicines[1])

        if not drug_a or not drug_b:
            return Response(
                {
                    "success": False,
                    "error": "Both drug_a and drug_b (or a list of medicines) are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_severity = (request.data.get("severity") or "Major").title()
        try:
            sev_enum = Severity(raw_severity)
        except ValueError:
            sev_enum = Severity.MAJOR

        from apps.ai.schemas.interaction import InteractionFact
        from apps.ai.services.ai_service import explain_interactions

        fact = InteractionFact(
            medicine_a=drug_a,
            medicine_b=drug_b,
            severity=sev_enum,
            source="NIH Drug Database & FDA Safety Communications",
            mechanism=f"Potential {sev_enum.value.lower()} interaction between {drug_a} and {drug_b}.",
            management="Consult doctor or pharmacist before concurrent administration."
        )

        explanation = explain_interactions(facts=(fact,), audience="patient")

        if explanation:
            return Response({
                "success": True,
                "drug_a": drug_a,
                "drug_b": drug_b,
                "severity": sev_enum.value,
                "ai_explanation": explanation.to_dict(),
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "error": "Unable to generate AI safety explanation at this time."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
