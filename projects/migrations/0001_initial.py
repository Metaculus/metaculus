# Generated by Django 5.1.1 on 2024-09-17 15:10

import django.core.validators
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Project",
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
                        editable=False
                    ),
                ),
                (
                    "edited_at",
                    models.DateTimeField(
                        editable=False, null=True
                    ),
                ),
                ("add_posts_to_main_feed", models.BooleanField(default=False)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("site_main", "Site Main"),
                            ("tournament", "Tournament"),
                            ("question_series", "Question Series"),
                            ("personal_project", "Personal Project"),
                            ("news_category", "News Category"),
                            ("public_figure", "Public Figure"),
                            ("category", "Category"),
                            ("tag", "Tag"),
                            ("topic", "Topic"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("include_bots_in_leaderboard", models.BooleanField(default=False)),
                ("name", models.CharField(max_length=200)),
                (
                    "slug",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        max_length=200,
                        null=True,
                        validators=[
                            django.core.validators.RegexValidator(
                                "^[-a-zA-Z0-9_]*[a-zA-Z][-a-zA-Z0-9_]*\\Z",
                                "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens. Must contain at least one letter.",
                                "invalid",
                            )
                        ],
                    ),
                ),
                ("subtitle", models.CharField(blank=True, default="", max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "header_image",
                    models.ImageField(blank=True, null=True, upload_to=""),
                ),
                ("header_logo", models.ImageField(blank=True, null=True, upload_to="")),
                ("emoji", models.CharField(blank=True, default="", max_length=10)),
                (
                    "order",
                    models.IntegerField(
                        default=0,
                        help_text="Will be displayed ordered by this field inside each section",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True,
                        default=True,
                        help_text="Inactive projects are not accessible to all users",
                    ),
                ),
                (
                    "prize_pool",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        default=None,
                        max_digits=15,
                        null=True,
                    ),
                ),
                ("start_date", models.DateTimeField(blank=True, null=True)),
                ("close_date", models.DateTimeField(blank=True, null=True)),
                (
                    "sign_up_fields",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Used during tournament onboarding.",
                    ),
                ),
                (
                    "section",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("hot_topics", "Hot Topics"),
                            ("hot_categories", "Hot Categories"),
                        ],
                        default=None,
                        help_text="This groups topics together under the same section in the sidebar. ",
                        max_length=32,
                        null=True,
                    ),
                ),
                ("meta_description", models.TextField(blank=True, default="")),
                (
                    "default_permission",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("viewer", "Viewer"),
                            ("forecaster", "Forecaster"),
                            ("curator", "Curator"),
                            ("admin", "Admin"),
                        ],
                        db_index=True,
                        default="forecaster",
                        null=True,
                    ),
                ),
            ],
            options={
                "ordering": ("order",),
            },
        ),
        migrations.CreateModel(
            name="ProjectSubscription",
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
                        editable=False
                    ),
                ),
                (
                    "edited_at",
                    models.DateTimeField(
                        editable=False, null=True
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProjectUserPermission",
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
                        editable=False
                    ),
                ),
                (
                    "edited_at",
                    models.DateTimeField(
                        editable=False, null=True
                    ),
                ),
                (
                    "permission",
                    models.CharField(
                        choices=[
                            ("viewer", "Viewer"),
                            ("forecaster", "Forecaster"),
                            ("curator", "Curator"),
                            ("admin", "Admin"),
                        ],
                        db_index=True,
                    ),
                ),
            ],
        ),
    ]
