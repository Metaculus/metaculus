# Generated by Django 5.1.4 on 2025-01-08 12:45

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0013_forecast_source"),
        ("scoring", "0004_alter_leaderboard_end_time_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="score",
            name="aggregation_method",
            field=models.CharField(
                choices=[
                    ("recency_weighted", "Recency Weighted"),
                    ("unweighted", "Unweighted"),
                    ("single_aggregation", "Single Aggregation"),
                    ("metaculus_prediction", "Metaculus Prediction"),
                ],
                db_index=True,
                max_length=200,
                null=True,
            ),
        ),
        migrations.AddIndex(
            model_name="archivedscore",
            index=models.Index(
                condition=models.Q(("aggregation_method__isnull", False)),
                fields=["question"],
                name="archivedscore_aggmethod_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="archivedscore",
            index=models.Index(
                fields=["user", "question"], name="scoring_arc_user_id_bb6689_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="score",
            index=models.Index(
                condition=models.Q(("aggregation_method__isnull", False)),
                fields=["question"],
                name="score_question_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="score",
            index=models.Index(
                fields=["user", "question"], name="scoring_sco_user_id_f8cd4e_idx"
            ),
        ),
    ]