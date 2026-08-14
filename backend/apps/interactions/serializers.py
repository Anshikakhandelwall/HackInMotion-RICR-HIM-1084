from rest_framework import serializers


class InteractionCheckRequestSerializer(serializers.Serializer):
    """
    Serializer for validating POST /api/interactions/check/ request payloads.
    """

    medicines = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
        error_messages={
            "empty": "The 'medicines' list cannot be empty. Please provide at least two medicines to check.",
            "required": "The 'medicines' field is required in the request body.",
        },
    )
