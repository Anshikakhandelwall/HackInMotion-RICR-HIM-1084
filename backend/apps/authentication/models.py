from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    UserProfile model to persist user onboarding health information and completion status in database.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.IntegerField(null=True, blank=True)
    medical_conditions = models.TextField(blank=True, default='')
    known_allergies = models.TextField(blank=True, default='')
    regular_medicines = models.JSONField(default=list, blank=True)
    profile_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email} (Completed: {self.profile_completed})"


class UserSettings(models.Model):
    """
    Per-user notification preferences and application settings.
    One row per authenticated user, created on first access.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')

    # Notification preferences
    notify_safety_alerts = models.BooleanField(default=True)
    notify_medicine_reminders = models.BooleanField(default=True)
    notify_safety_check_updates = models.BooleanField(default=True)
    notify_email = models.BooleanField(default=False)

    # Preferences
    language = models.CharField(max_length=10, default='en')
    appearance = models.CharField(max_length=10, default='system')  # 'light' | 'dark' | 'system'
    default_safety_check = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.email}"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """Signal receiver to automatically create a UserProfile whenever a User is registered."""
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
