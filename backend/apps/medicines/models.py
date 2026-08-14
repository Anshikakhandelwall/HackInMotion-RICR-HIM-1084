from django.db import models
from django.utils import timezone


class Medicine(models.Model):
    rxcui = models.CharField(max_length=20, unique=True)
    rxnorm_name = models.CharField(max_length=500)
    tty = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "medicines"

    def __str__(self):
        return f"{self.rxnorm_name} ({self.rxcui})"


class DDInterDrugMapping(models.Model):
    ddinter_drug_name = models.CharField(max_length=500, unique=True)
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="ddinter_mappings",
    )
    mapping_method = models.CharField(max_length=100, blank=True, default="")
    mapping_status = models.CharField(max_length=50)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ddinter_drug_mappings"
        constraints = [
            models.UniqueConstraint(
                fields=["ddinter_drug_name"],
                name="unique_ddinter_drug_name",
            )
        ]

    def __str__(self):
        return f"{self.ddinter_drug_name} → {self.medicine.rxcui}"
