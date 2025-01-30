# Generated by Django 5.1.1 on 2024-09-17 15:10

import datetime
import django.contrib.postgres.fields
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AggregateForecast",
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
                    "method",
                    models.CharField(
                        choices=[
                            ("recency_weighted", "Recency Weighted"),
                            ("unweighted", "Unweighted"),
                            ("single_aggregation", "Single Aggregation"),
                            ("metaculus_prediction", "Metaculus Prediction"),
                        ],
                        max_length=200,
                    ),
                ),
                ("start_time", models.DateTimeField(db_index=True)),
                ("end_time", models.DateTimeField(db_index=True, null=True)),
                (
                    "forecast_values",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), max_length=201, size=None
                    ),
                ),
                ("forecaster_count", models.IntegerField(null=True)),
                (
                    "interval_lower_bounds",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=None
                    ),
                ),
                (
                    "centers",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=None
                    ),
                ),
                (
                    "interval_upper_bounds",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=None
                    ),
                ),
                (
                    "means",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=None
                    ),
                ),
                (
                    "histogram",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=100
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Conditional",
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
                        editable=False, null=True
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Forecast",
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
                    "start_time",
                    models.DateTimeField(
                        db_index=True,
                        help_text="Begining time when this prediction is active",
                    ),
                ),
                (
                    "end_time",
                    models.DateTimeField(
                        db_index=True,
                        help_text="Time at which this prediction is no longer active",
                        null=True,
                    ),
                ),
                (
                    "continuous_cdf",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=201
                    ),
                ),
                ("probability_yes", models.FloatField(null=True)),
                (
                    "probability_yes_per_category",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.FloatField(), null=True, size=None
                    ),
                ),
                (
                    "distribution_components",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.JSONField(null=True),
                        help_text="The components for a continuous prediction. Used to generate prediction_values.",
                        null=True,
                        size=5,
                    ),
                ),
                ("slider_values", models.JSONField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name="GroupOfQuestions",
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
                        editable=False, null=True
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("resolution_criteria", models.TextField(blank=True, null=True)),
                ("fine_print", models.TextField(blank=True, null=True)),
                ("group_variable", models.TextField(blank=True, null=True)),
                (
                    "graph_type",
                    models.CharField(
                        choices=[
                            ("fan_graph", "Fan Graph"),
                            ("multiple_choice_graph", "Multiple Choice Graph"),
                        ],
                        default="multiple_choice_graph",
                        max_length=256,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Question",
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
                        editable=False, null=True
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("binary", "Binary"),
                            ("numeric", "Numeric"),
                            ("date", "Date"),
                            ("multiple_choice", "Multiple Choice"),
                        ],
                        max_length=20,
                    ),
                ),
                ("resolution", models.TextField(blank=True, null=True)),
                ("include_bots_in_aggregates", models.BooleanField(default=False)),
                ("title", models.CharField(max_length=2000)),
                ("description", models.TextField(blank=True)),
                ("resolution_criteria", models.TextField(blank=True)),
                ("fine_print", models.TextField(blank=True)),
                (
                    "open_time",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "scheduled_close_time",
                    models.DateTimeField(
                        db_index=True,
                        default=datetime.datetime(
                            9999,
                            12,
                            31,
                            23,
                            59,
                            59,
                            999999,
                            tzinfo=datetime.timezone.utc,
                        ),
                    ),
                ),
                (
                    "scheduled_resolve_time",
                    models.DateTimeField(
                        db_index=True,
                        default=datetime.datetime(
                            9999,
                            12,
                            31,
                            23,
                            59,
                            59,
                            999999,
                            tzinfo=datetime.timezone.utc,
                        ),
                    ),
                ),
                (
                    "actual_resolve_time",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "resolution_set_time",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                (
                    "actual_close_time",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                ("cp_reveal_time", models.DateTimeField(blank=True, null=True)),
                ("range_max", models.FloatField(blank=True, null=True)),
                ("range_min", models.FloatField(blank=True, null=True)),
                ("zero_point", models.FloatField(blank=True, null=True)),
                ("open_upper_bound", models.BooleanField(blank=True, null=True)),
                ("open_lower_bound", models.BooleanField(blank=True, null=True)),
                (
                    "options",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=200),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
                ("possibilities", models.JSONField(blank=True, null=True)),
                ("label", models.TextField(blank=True, null=True)),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
