import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_usersettings_appearance'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Add role field to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[('patient', 'Patient'), ('caregiver', 'Caregiver'), ('pharmacist', 'Pharmacist')],
                default='patient',
                max_length=20,
            ),
        ),

        # 2. Create CaregiverPatientConnection
        migrations.CreateModel(
            name='CaregiverPatientConnection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('connection_code', models.CharField(max_length=10, unique=True)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                    default='pending',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('caregiver', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='caregiver_connections',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('patient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='patient_connections',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'unique_together': {('caregiver', 'patient')}},
        ),

        # 3. Create PharmacistCase
        migrations.CreateModel(
            name='PharmacistCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, default='', max_length=200)),
                ('medicines', models.JSONField(blank=True, default=list)),
                ('notes', models.TextField(blank=True, default='')),
                ('interaction_result', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pharmacist', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pharmacist_cases',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('patient', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pharmacist_case_subjects',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
