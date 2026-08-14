from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    OnboardingProfileView,
    SupabaseMeView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', UserProfileView.as_view(), name='auth-me'),
    path('profile/onboarding/', OnboardingProfileView.as_view(), name='auth-onboarding'),
    # Supabase JWT-protected identity endpoint (Commit: supabase-jwt-backend)
    path('supabase/me/', SupabaseMeView.as_view(), name='auth-supabase-me'),
]
