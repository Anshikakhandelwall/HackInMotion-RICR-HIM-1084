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
