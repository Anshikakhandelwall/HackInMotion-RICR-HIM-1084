from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile representation including health onboarding state."""
    full_name = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    profile_completed = serializers.SerializerMethodField()
    profileCompleted = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    medical_conditions = serializers.SerializerMethodField()
    medicalConditions = serializers.SerializerMethodField()
    regular_medicines = serializers.SerializerMethodField()
    regularMedicines = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'fullName',
            'profile_completed',
            'profileCompleted',
            'age',
            'medical_conditions',
            'medicalConditions',
            'regular_medicines',
            'regularMedicines',
            'date_joined',
        ]
        read_only_fields = ['id', 'email', 'date_joined']

    def get_full_name(self, obj):
        return obj.first_name if obj.first_name else obj.username

    def get_fullName(self, obj):
        return self.get_full_name(obj)

    def get_profile_completed(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.profile_completed
        return False

    def get_profileCompleted(self, obj):
        return self.get_profile_completed(obj)

    def get_age(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.age
        return None

    def get_medical_conditions(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.medical_conditions
        return ''

    def get_medicalConditions(self, obj):
        return self.get_medical_conditions(obj)

    def get_regular_medicines(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.regular_medicines
        return []

    def get_regularMedicines(self, obj):
        return self.get_regular_medicines(obj)


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    fullName = serializers.CharField(required=False, allow_blank=True, write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        if User.objects.filter(username__iexact=normalized_email).exists() or User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized_email

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        name = validated_data.get('fullName') or validated_data.get('full_name') or ''

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name.strip()
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user authentication."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(username=email, password=password)

        if not user:
            try:
                user_obj = User.objects.get(email__iexact=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is currently deactivated.")

        data['user'] = user
        return data
