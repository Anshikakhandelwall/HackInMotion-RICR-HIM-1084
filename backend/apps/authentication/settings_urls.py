from django.urls import path
from .settings_views import UserSettingsView, UserDataExportView, DeleteAccountView

urlpatterns = [
    path('', UserSettingsView.as_view(), name='user-settings'),
    path('/', UserSettingsView.as_view()),
    path('export', UserDataExportView.as_view()),
    path('export/', UserDataExportView.as_view(), name='user-data-export'),
    path('account', DeleteAccountView.as_view()),
    path('account/', DeleteAccountView.as_view(), name='delete-account'),
]
