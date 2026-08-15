import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.interactions.serializers import InteractionCheckRequestSerializer
from apps.interactions.services import InteractionEngine
from apps.interactions.openfda_service import (
    fetch_drug_label,
    OpenFDAError,
    OpenFDAUnavailableError,
)
from apps.ai.schemas.interaction import Severity

logger = logging.getLogger(__name__)


def _fetch_openfda_evidence(checked_medicines: list) -> list:
    """
    Fetch openFDA drug-label supporting evidence for each resolved medicine.

    This is a best-effort enrichment step:
    - If openFDA is unavailable, the interaction result is still returned.
    - If the API key is missing, evidence is skipped with a logged warning.
    - Each medicine is looked up independently; one failure does not block others.

    Returns a list of evidence dicts, one per medicine that could be resolved.
    The openFDA API key is NEVER included in the returned data.
    """
    evidence = []
    for med in checked_medicines:
        name = med.get("rxnorm_name") or med.get("name") or ""
        if not name:
            continue
        try:
            label = fetch_drug_label(name)
        except ValueError:
            # API key not configured — skip all openFDA lookups silently.
            logger.warning(
                "openFDA evidence skipped: OPENFDA_API_KEY not configured."
            )
            break
        except (OpenFDAError, OpenFDAUnavailableError) as exc:
            logger.warning(
                "openFDA evidence unavailable for '%s': %s", name, type(exc).__name__
            )
            evidence.append({
                "drug": name,
                "source": "openFDA",
                "available": False,
                "reason": "openFDA evidence temporarily unavailable.",
            })
            continue

        if label.get("found"):
            evidence.append({
                "drug": name,
                "source": "openFDA",
                "available": True,
                "generic_name": label.get("generic_name", ""),
                "brand_name": label.get("brand_name", ""),
                "rxcui": label.get("rxcui", ""),
                "drug_interactions": label.get("drug_interactions", []),
                "warnings": label.get("warnings", []),
                "precautions": label.get("precautions", []),
                "adverse_reactions": label.get("adverse_reactions", []),
            })
        else:
            evidence.append({
                "drug": name,
                "source": "openFDA",
                "available": False,
                "reason": "No drug label found in openFDA.",
            })

    return evidence


class InteractionCheckView(APIView):
    """
    POST /api/interactions/check/

    Accepts a list of medicine identifiers (RxCUIs, database IDs, or drug names),
    resolves canonical medicine records, performs pairwise DDInter interaction checks,
    then enriches the result with openFDA drug-label supporting evidence.

    Pipeline:
        medicine input → InteractionEngine (DDInter/RxNorm) → openFDA evidence
                       → combined normalized response

    Authentication: Supabase JWT required (authenticated users only).
    OpenFDA API key is never included in the response.
    """

    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

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

        # ── Step 1: DDInter/RxNorm pairwise interaction check ─────────────────
        result = InteractionEngine.check_interactions(medicines_list)

        # ── Step 2: openFDA supporting evidence (best-effort) ─────────────────
        # openFDA enriches each resolved medicine with label information.
        # A failure here never prevents DDInter results from being returned.
        supporting_evidence = _fetch_openfda_evidence(result.get("checked_medicines", []))

        return Response(
            {
                "success": True,
                **result,
                "supporting_evidence": supporting_evidence,
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


class OpenFDALabelView(APIView):
    """
    GET /api/interactions/openfda/?drug=<medicine_name>

    Fetches and returns normalized drug label information from the openFDA
    Drug Label API for the specified medicine.

    This is a supporting evidence endpoint — it provides drug labeling,
    warnings, precautions, and drug-interaction text from FDA-approved labels.
    It does NOT replace the DDInter/RxNorm interaction pipeline.

    Authentication: Supabase JWT required.
    The openFDA API key is never included in the response.
    """

    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drug = (request.query_params.get("drug") or "").strip()

        if not drug:
            return Response(
                {
                    "success": False,
                    "source": "openFDA",
                    "error": "The 'drug' query parameter is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            label = fetch_drug_label(drug)
        except ValueError:
            # API key not configured — server-side config error.
            return Response(
                {
                    "success": False,
                    "source": "openFDA",
                    "error": "Drug label service is not configured on the server.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except OpenFDAUnavailableError:
            return Response(
                {
                    "success": False,
                    "source": "openFDA",
                    "error": "Drug label service is temporarily unavailable. Please try again later.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except OpenFDAError:
            return Response(
                {
                    "success": False,
                    "source": "openFDA",
                    "error": "An error occurred while retrieving drug label information.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not label.get("found"):
            return Response(
                {
                    "success": False,
                    "source": "openFDA",
                    "error": "Medicine information not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "success": True,
                "source": "openFDA",
                "drug": {
                    "name": label["drug_name"],
                    "generic_name": label["generic_name"],
                    "brand_name": label["brand_name"],
                    "rxcui": label["rxcui"],
                },
                "safety_information": {
                    "drug_interactions": label["drug_interactions"],
                    "warnings": label["warnings"],
                    "precautions": label["precautions"],
                    "adverse_reactions": label["adverse_reactions"],
                },
            },
            status=status.HTTP_200_OK,
        )
