from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.interactions.serializers import InteractionCheckRequestSerializer
from apps.interactions.services import InteractionEngine


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
