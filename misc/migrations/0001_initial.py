# Generated by Django 5.0.8 on 2024-08-13 15:57

import django.utils.timezone
import pgvector.django.vector
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ITNArticle",
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
                ("aid", models.BigIntegerField(unique=True)),
                ("title", models.CharField()),
                ("text", models.CharField(null=True)),
                ("url", models.CharField()),
                ("img_url", models.CharField()),
                ("favicon_url", models.CharField()),
                (
                    "embedding_vector",
                    pgvector.django.vector.VectorField(
                        blank=True,
                        help_text="Vector embeddings of the ITN Article content",
                        null=True,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
