# Generated by Django 5.1.1 on 2024-11-21 18:42

from django.db import migrations, models


def migrate_is_onboarding_complete(apps, schema_editor):
    """
    We assume that all existing users with an activated email have completed onboarding.
    """

    User = apps.get_model("users", "User")
    User.objects.filter(is_active=True).update(is_onboarding_complete=True)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_onboarding_complete",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(migrate_is_onboarding_complete, migrations.RunPython.noop),
    ]
