from django.db import models

# Create your models here.



class Medicine(models.Model):
    """
    Canonical medicine record based on an RxNorm concept.
    """

    rxcui = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
    )

    rxnorm_name = models.CharField(
        max_length=255,
    )

    tty = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "medicines"

    def __str__(self):
        return f"{self.rxnorm_name} (RxCUI: {self.rxcui})"