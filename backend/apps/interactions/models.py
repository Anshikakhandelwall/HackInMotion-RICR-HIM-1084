from django.db import models
from django.utils import timezone

from apps.medicines.models import Medicine


class DrugInteraction(models.Model):

    class Severity(models.TextChoices):
        MAJOR = "Major", "Major"
        MODERATE = "Moderate", "Moderate"
        MINOR = "Minor", "Minor"

    medicine_a = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="interactions_as_a",
    )
    medicine_b = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="interactions_as_b",
    )
    level = models.CharField(
        max_length=10,
        choices=Severity.choices,
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "drug_interactions"
        constraints = [
            # Canonical pair uniqueness: only one ordering of (a, b) is stored.
            # The import script must always assign the lower Medicine.pk to
            # medicine_a so that (A, B) and (B, A) are treated as the same row.
            models.UniqueConstraint(
                fields=["medicine_a", "medicine_b"],
                name="unique_drug_interaction_pair",
            ),
            # A drug cannot interact with itself.
            models.CheckConstraint(
                condition=~models.Q(medicine_a=models.F("medicine_b")),
                name="drug_interaction_different_medicines",
            ),
        ]

    def __str__(self):
        return (
            f"{self.medicine_a.rxnorm_name} + {self.medicine_b.rxnorm_name}"
            f" [{self.level}]"
        )
