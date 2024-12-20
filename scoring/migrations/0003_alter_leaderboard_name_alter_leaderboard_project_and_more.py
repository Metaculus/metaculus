# Generated by Django 5.1.1 on 2024-10-16 20:51

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_show_on_homepage"),
        ("scoring", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="leaderboard",
            name="name",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboard",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="leaderboards",
                to="projects.project",
            ),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="aggregation_method",
            field=models.CharField(
                blank=True,
                choices=[
                    ("recency_weighted", "Recency Weighted"),
                    ("unweighted", "Unweighted"),
                    ("single_aggregation", "Single Aggregation"),
                    ("metaculus_prediction", "Metaculus Prediction"),
                ],
                max_length=200,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="coverage",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="medal",
            field=models.CharField(
                blank=True,
                choices=[("gold", "Gold"), ("silver", "Silver"), ("bronze", "Bronze")],
                max_length=200,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="percent_prize",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="prize",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="rank",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="take",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="leaderboardentry",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="medalexclusionrecord",
            name="end_time",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="medalexclusionrecord",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="projects.project",
            ),
        ),
    ]
