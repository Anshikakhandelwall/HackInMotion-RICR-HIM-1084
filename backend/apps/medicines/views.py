from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from apps.medicines.models import Medicine
from apps.medicines.serializers import MedicineSerializer


class MedicineListView(APIView):
    """
    GET /api/medicines/
    List or search medicines by name or RxCUI.
    Query parameters:
      - search: Search term to filter by medicine name, RxCUI, or DDInter mapping name.
    """

    def get(self, request):
        query = request.query_params.get("search", "").strip()

        queryset = Medicine.objects.all()

        if query:
            # Efficient database-side filtering using Q objects
            queryset = queryset.filter(
                Q(rxnorm_name__icontains=query)
                | Q(rxcui__icontains=query)
                | Q(ddinter_mappings__ddinter_drug_name__icontains=query)
            ).distinct()

        # Limit to top 50 matches for performance
        queryset = queryset[:50]

        serializer = MedicineSerializer(queryset, many=True)
        return Response(
            {
                "success": True,
                "count": len(serializer.data),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MedicineDetailView(APIView):
    """
    GET /api/medicines/{id}/
    Retrieve a canonical medicine by its database ID.
    """

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
