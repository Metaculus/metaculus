# Generated by Django 5.1.4 on 2025-01-29 16:34

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("scoring", "0008_leaderboardsranksentry"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="leaderboard",
            name="user_list",
            field=models.ManyToManyField(
                blank=True,
                help_text="Optional. If not set, all users with scores will be included.\n        </br>- If set, only users in this list will be included.\n        </br>- Exclusion Records still apply independent of this list.\n        ",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
