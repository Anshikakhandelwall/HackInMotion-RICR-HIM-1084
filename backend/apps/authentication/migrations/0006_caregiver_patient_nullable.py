import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_rbac'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Make CaregiverPatientConnection.patient nullable (pending connections have no patient yet)
        migrations.AlterField(
            model_name='caregiverpatientconnection',
            name='patient',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='patient_connections',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Remove the unique_together constraint that required a patient
        migrations.AlterUniqueTogether(
            name='caregiverpatientconnection',
            unique_together=set(),
        ),
    ]
