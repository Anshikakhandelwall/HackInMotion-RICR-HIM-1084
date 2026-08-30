from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_usersettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersettings',
            name='appearance',
            field=models.CharField(default='system', max_length=10),
        ),
    ]
