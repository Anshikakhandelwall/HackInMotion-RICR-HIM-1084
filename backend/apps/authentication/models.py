from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


ROLE_PATIENT = 'patient'
ROLE_CAREGIVER = 'caregiver'
ROLE_PHARMACIST = 'pharmacist'
ROLE_CHOICES = [
    (ROLE_PATIENT, 'Patient'),
    (ROLE_CAREGIVER, 'Caregiver'),
    (ROLE_PHARMACIST, 'Pharmacist'),
]
VALID_ROLES = {ROLE_PATIENT, ROLE_CAREGIVER, ROLE_PHARMACIST}


class UserProfile(models.Model):
    """
    UserProfile model to persist user onboarding health information,
    role, and completion status in database.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_PATIENT)
    age = models.IntegerField(null=True, blank=True)
    medical_conditions = models.TextField(blank=True, default='')
    known_allergies = models.TextField(blank=True, default='')
    regular_medicines = models.JSONField(default=list, blank=True)
    profile_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email} (Role: {self.role}, Completed: {self.profile_completed})"


class CaregiverPatientConnection(models.Model):
    """
    Links a caregiver user to a patient user they are authorised to manage.
    A caregiver can only access a patient's data once the patient approves.
    """
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    caregiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='caregiver_connections'
    )
    patient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='patient_connections',
        null=True, blank=True,
    )
    # Short alphanumeric code the patient enters to approve the connection
    connection_code = models.CharField(max_length=10, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # unique_together only enforced on approved connections at the application layer
        pass

    def __str__(self):
        patient_email = self.patient.email if self.patient_id else '(pending)'
        return f"{self.caregiver.email} → {patient_email} ({self.status})"


class PharmacistCase(models.Model):
    """
    A medication safety-screening case created by a pharmacist.
    Optionally links to a patient for authorised context access.
    """
    pharmacist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='pharmacist_cases'
    )
    # Optional: a patient whose profile context is included in the case
    patient = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pharmacist_case_subjects'
    )
    title = models.CharField(max_length=200, blank=True, default='')
    medicines = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default='')
    interaction_result = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Case by {self.pharmacist.email} ({self.created_at.date()})"


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
