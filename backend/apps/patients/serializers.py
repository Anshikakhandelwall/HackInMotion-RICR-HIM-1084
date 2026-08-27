"""
Serializer for the UserProfile (patient health profile).

Maps between the UserProfile model fields and the JSON representation
used by the frontend. Field names use camelCase aliases so the existing
frontend forms work without changes.
"""
from rest_framework import serializers
from apps.authentication.models import UserProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    # camelCase aliases for the frontend
    medicalConditions = serializers.CharField(
        source='medical_conditions',
        allow_blank=True,
        default='',
    )
    knownAllergies = serializers.CharField(
        source='known_allergies',
        allow_blank=True,
        default='',
    )
    regularMedicines = serializers.JSONField(
        source='regular_medicines',
        default=list,
    )
    profileCompleted = serializers.BooleanField(
        source='profile_completed',
        read_only=True,
    )

    class Meta:
        model = UserProfile
        fields = [
            'age',
            'medicalConditions',
            'knownAllergies',
            'regularMedicines',
            'profileCompleted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['profileCompleted', 'created_at', 'updated_at']

    # ── Validation ────────────────────────────────────────────────────────────

    def validate_age(self, value):
        if value is not None:
            if value <= 0 or value > 120:
                raise serializers.ValidationError(
                    'Age must be between 1 and 120.'
                )
        return value

    def validate_regularMedicines(self, value):
        """Ensure regular_medicines is a list of non-empty strings."""
        if not isinstance(value, list):
            raise serializers.ValidationError(
                'Regular medicines must be a list.'
            )
        cleaned = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError(
                    'Each medicine entry must be a string.'
                )
            s = item.strip()
            if s:
                cleaned.append(s)
        return cleaned

    def validate_medicalConditions(self, value):
        if value is None:
            return ''
        return value.strip()

    def validate_knownAllergies(self, value):
        if value is None:
            return ''
        return value.strip()

    # ── Save helpers ──────────────────────────────────────────────────────────

    def update(self, instance, validated_data):
        """
        PATCH semantics: only update fields that were explicitly provided.
        Mark profile_completed = True once the minimum required fields are set.
        """
        instance.age = validated_data.get('age', instance.age)
        instance.medical_conditions = validated_data.get(
            'medical_conditions', instance.medical_conditions
        )
        instance.known_allergies = validated_data.get(
            'known_allergies', instance.known_allergies
        )
        instance.regular_medicines = validated_data.get(
            'regular_medicines', instance.regular_medicines
        )

        # Profile is complete once age and medical_conditions are filled.
        if instance.age and instance.medical_conditions.strip():
            instance.profile_completed = True

        instance.save()
        return instance

    def create(self, validated_data):
        """
        Used only when no UserProfile exists yet (the signal should have
        already created one, but this is a safety path).
        """
        user = self.context['user']
        instance, _ = UserProfile.objects.get_or_create(user=user)
        return self.update(instance, validated_data)
