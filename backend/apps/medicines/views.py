import urllib.request
import urllib.parse
import urllib.error
import json
import logging

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from apps.medicines.models import Medicine
from apps.medicines.serializers import MedicineSerializer

logger = logging.getLogger(__name__)


def _rxnorm_search(query: str) -> list:
    """
    Call RxNorm getDrugs API to search by name (free, no key).
    """
    try:
        params = urllib.parse.urlencode({"name": query})
        url = f"https://rxnav.nlm.nih.gov/REST/drugs.json?{params}"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            concept_groups = data.get("drugGroup", {}).get("conceptGroup", []) or []
            results = []
            seen = set()
            for group in concept_groups:
                for concept in group.get("conceptProperties", []) or []:
                    name = concept.get("name", "")
                    rxcui = concept.get("rxcui", "")
                    if name and name.lower() not in seen:
                        seen.add(name.lower())
                        results.append({"name": name, "rxcui": rxcui, "source": "rxnorm"})
            return results[:15]
    except Exception as exc:
        logger.warning("RxNorm search failed: %s", type(exc).__name__)
        return []


def _openfda_search(query: str) -> list:
    """
    Search openFDA drug label API by brand name and generic name.
    Requires OPENFDA_API_KEY in settings.
    """
    api_key = getattr(settings, "OPENFDA_API_KEY", None)
    if not api_key:
        return []

    results = []
    seen = set()

    search_fields = [
        f'openfda.brand_name:"{query}"',
        f'openfda.generic_name:"{query}"',
    ]

    for search_expr in search_fields:
        try:
            params = urllib.parse.urlencode({
                "search": search_expr,
                "limit": "10",
                "api_key": api_key,
            })
            url = f"https://api.fda.gov/drug/label.json?{params}"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for r in data.get("results", []):
                    openfda = r.get("openfda", {})
                    brand_names = openfda.get("brand_name", [])
                    generic_names = openfda.get("generic_name", [])
                    rxcuis = openfda.get("rxcui", [])
                    for name in brand_names + generic_names:
                        if name and name.lower() not in seen:
                            seen.add(name.lower())
                            results.append({
                                "name": name,
                                "rxcui": rxcuis[0] if rxcuis else "",
                                "source": "openfda",
                            })
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            logger.warning("openFDA search HTTP error %s for query '%s'", e.code, query)
        except Exception as exc:
            logger.warning("openFDA search failed: %s", type(exc).__name__)

    return results[:15]


class MedicineListView(APIView):
    """
    GET /api/medicines/
    List or search medicines by name or RxCUI.
    Query parameters:
      - search: Search term to filter by medicine name, RxCUI, or DDInter mapping name.
    Falls back to live RxNorm API when local DB returns no results.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("search", "").strip()

        queryset = Medicine.objects.all()

        if query:
            queryset = queryset.filter(
                Q(rxnorm_name__icontains=query)
                | Q(rxcui__icontains=query)
                | Q(ddinter_mappings__ddinter_drug_name__icontains=query)
            ).distinct()

        queryset = queryset[:50]
        serializer = MedicineSerializer(queryset, many=True)
        local_results = serializer.data

        # If local DB has results, return them
        if local_results or not query:
            return Response(
                {
                    "success": True,
                    "count": len(local_results),
                    "results": local_results,
                },
                status=status.HTTP_200_OK,
            )

        # Fallback 1: RxNorm live API (free, no key, US generics)
        fallback_results = _rxnorm_search(query)

        # Fallback 2: openFDA brand name search (needs API key, broader coverage)
        if not fallback_results:
            fallback_results = _openfda_search(query)

        return Response(
            {
                "success": True,
                "count": len(fallback_results),
                "results": fallback_results,
                "source": "live",
            },
            status=status.HTTP_200_OK,
        )


class MedicineDetailView(APIView):
    """
    GET /api/medicines/{id}/
    Retrieve a canonical medicine by its database ID.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            medicine = Medicine.objects.get(pk=pk)
        except Medicine.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": f"Medicine with ID '{pk}' not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicineSerializer(medicine)
        return Response(
            {
                "success": True,
                "medicine": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MedicineRxCUIDetailView(APIView):
    """
    GET /api/medicines/rxcui/{rxcui}/
    Retrieve a canonical medicine by its RxCUI string.
    """
    permission_classes = [AllowAny]

    def get(self, request, rxcui):
        clean_rxcui = str(rxcui).strip()
        try:
            medicine = Medicine.objects.get(rxcui=clean_rxcui)
        except Medicine.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": f"Medicine with RxCUI '{clean_rxcui}' not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicineSerializer(medicine)
        return Response(
            {
                "success": True,
                "medicine": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
