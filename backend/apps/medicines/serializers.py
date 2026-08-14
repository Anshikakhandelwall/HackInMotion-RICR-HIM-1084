from rest_framework import serializers
from apps.medicines.models import Medicine


class MedicineSerializer(serializers.ModelSerializer):
    """
    Serializer for the canonical Medicine model.
    Provides 'name' alias (mapped to rxnorm_name) for frontend convenience.
    """

    name = serializers.CharField(source="rxnorm_name", read_only=True)

    class Meta:
        model = Medicine
        fields = ["id", "rxcui", "name", "rxnorm_name", "tty"]
