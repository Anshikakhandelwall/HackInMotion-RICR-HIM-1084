from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import UserProfile
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    """
    API view to handle user registration.
    Endpoint: POST /api/auth/register/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response(
                {
                    "success": True,
                    "message": "Account created successfully",
                    "token": token.key,
                    "user": user_data,
                },
                status=status.HTTP_201_CREATED,
            )
        
        errors = serializer.errors
        error_message = "Registration failed."
        if "email" in errors:
            error_message = errors["email"][0]
        elif "password" in errors:
            error_message = errors["password"][0]
        elif "non_field_errors" in errors:
            error_message = errors["non_field_errors"][0]
            
        return Response(
            {
                "success": False,
                "message": error_message,
                "errors": errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    """
    API view to handle user authentication.
    Endpoint: POST /api/auth/login/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "token": token.key,
                    "user": user_data,
                },
                status=status.HTTP_200_OK,
            )

        errors = serializer.errors
        error_message = "Login failed."
        if "non_field_errors" in errors:
            error_message = errors["non_field_errors"][0]
        elif "email" in errors:
            error_message = errors["email"][0]
        elif "password" in errors:
            error_message = errors["password"][0]

        return Response(
            {
                "success": False,
                "message": error_message,
                "errors": errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LogoutView(APIView):
    """
    API view to handle user logout by deleting authentication token.
    Endpoint: POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Token.objects.filter(user=request.user).delete()
            return Response(
                {"success": True, "message": "Successfully logged out."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Logout error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProfileView(APIView):
    """
    API view to retrieve currently authenticated user profile.
    Endpoint: GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(
            {
                "success": True,
                "user": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OnboardingProfileView(APIView):
    """
    API view to save/update user's initial onboarding health profile in the backend database.
    Endpoint: POST /api/auth/profile/onboarding/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        age = request.data.get('age')
        medical_conditions = request.data.get('medicalConditions') or request.data.get('medical_conditions', '')
        regular_medicines = request.data.get('regularMedicines') or request.data.get('regular_medicines', [])

        if age is not None:
            try:
                profile.age = int(age)
            except (ValueError, TypeError):
                return Response(
                    {"success": False, "message": "Age must be a valid whole number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        profile.medical_conditions = str(medical_conditions).strip()
        if isinstance(regular_medicines, list):
            profile.regular_medicines = regular_medicines
        
        # Mark onboarding health profile as completed persistently in database
        profile.profile_completed = True
        profile.save()

        user_data = UserSerializer(user).data
        return Response(
            {
                "success": True,
                "message": "Health profile onboarding saved successfully.",
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )
