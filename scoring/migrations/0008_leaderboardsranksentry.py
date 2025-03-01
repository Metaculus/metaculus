# Generated by Django 5.1.4 on 2025-01-20 09:08

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("scoring", "0007_leaderboard_finalized_leaderboard_prize_pool_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LeaderboardsRanksEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False
                    ),
                ),
                ("edited_at", models.DateTimeField(editable=False, null=True)),
                ("points", models.FloatField()),
                (
                    "rank_type",
                    models.CharField(
                        choices=[
                            ("tournaments_global", "Tournaments Global"),
                            ("peer_global", "Peer Global"),
                            ("baseline_global", "Baseline Global"),
                            ("comments_global", "Comments Global"),
                            ("questions_global", "Questions Global"),
                        ],
                        max_length=200,
                    ),
                ),
                ("rank", models.IntegerField()),
                ("rank_total", models.IntegerField()),
                ("rank_timestamp", models.DateTimeField()),
                ("best_rank", models.IntegerField(null=True)),
                ("best_rank_total", models.IntegerField(null=True)),
                ("best_rank_timestamp", models.DateTimeField(null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "unique_together": {("user", "rank_type")},
            },
        ),
    ]
