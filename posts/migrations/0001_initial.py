# Generated by Django 5.1.1 on 2024-09-17 15:10

import django.core.validators
import django.utils.timezone
import pgvector.django.vector
from django.db import migrations, models
from pgvector.django import VectorExtension


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        VectorExtension(),
        migrations.CreateModel(
            name="Notebook",
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
                (
                    "edited_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False, null=True
                    ),
                ),
                ("markdown", models.TextField()),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("discussion", "Discussion"),
                            ("news", "News"),
                            ("public_figure", "Public Figure"),
                        ],
                        max_length=100,
                    ),
                ),
                ("news_type", models.CharField(blank=True, max_length=100, null=True)),
                ("image_url", models.URLField(blank=True, null=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Post",
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
                (
                    "edited_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False, null=True
                    ),
                ),
                (
                    "curation_status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("pending", "Pending"),
                            ("rejected", "Rejected"),
                            ("approved", "Approved"),
                            ("deleted", "Deleted"),
                        ],
                        db_index=True,
                        default="draft",
                        max_length=20,
                    ),
                ),
                (
                    "curation_status_updated_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                ("title", models.CharField(blank=True, max_length=2000)),
                (
                    "url_title",
                    models.CharField(blank=True, default="", max_length=2000),
                ),
                (
                    "published_at",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                ("scheduled_close_time", models.DateTimeField(blank=True, null=True)),
                ("scheduled_resolve_time", models.DateTimeField(blank=True, null=True)),
                ("actual_close_time", models.DateTimeField(blank=True, null=True)),
                ("resolved", models.BooleanField(default=False)),
                (
                    "embedding_vector",
                    pgvector.django.vector.VectorField(
                        blank=True,
                        help_text="Vector embeddings of the Post content",
                        null=True,
                    ),
                ),
                (
                    "preview_image_generated_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                ("movement", models.FloatField(blank=True, db_index=True, null=True)),
                (
                    "hotness",
                    models.IntegerField(
                        blank=True, db_index=True, editable=False, null=True
                    ),
                ),
                (
                    "forecasts_count",
                    models.PositiveIntegerField(
                        db_index=True, default=0, editable=False
                    ),
                ),
                ("published_at_triggered", models.BooleanField(default=False)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="PostActivityBoost",
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
                (
                    "edited_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False, null=True
                    ),
                ),
                ("score", models.IntegerField()),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="PostSubscription",
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
                (
                    "edited_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False, null=True
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("cp_change", "Cp Change"),
                            ("new_comments", "New Comments"),
                            ("milestone", "Milestone"),
                            ("status_change", "Status Change"),
                            ("specific_time", "Specific Time"),
                        ],
                        db_index=True,
                    ),
                ),
                (
                    "last_sent_at",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "next_trigger_value",
                    models.FloatField(blank=True, db_index=True, null=True),
                ),
                (
                    "next_trigger_datetime",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "comments_frequency",
                    models.PositiveSmallIntegerField(blank=True, null=True),
                ),
                ("recurrence_interval", models.DurationField(blank=True, null=True)),
                (
                    "milestone_step",
                    models.FloatField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(1),
                        ],
                    ),
                ),
                ("cp_change_threshold", models.FloatField(blank=True, null=True)),
                ("is_global", models.BooleanField(db_index=True, default=False)),
            ],
        ),
        migrations.CreateModel(
            name="PostUserSnapshot",
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
                    "last_forecast_date",
                    models.DateTimeField(db_index=True, default=None, null=True),
                ),
                ("comments_count", models.IntegerField(default=0)),
                (
                    "viewed_at",
                    models.DateTimeField(
                        db_index=True, default=django.utils.timezone.now
                    ),
                ),
                ("divergence", models.FloatField(blank=True, db_index=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="Vote",
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
                (
                    "edited_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False, null=True
                    ),
                ),
                (
                    "direction",
                    models.SmallIntegerField(choices=[(1, "Up"), (-1, "Down")]),
                ),
            ],
        ),
    ]
