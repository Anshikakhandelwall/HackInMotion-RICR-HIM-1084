from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='known_allergies',
            field=models.TextField(blank=True, default=''),
        ),
    ]
