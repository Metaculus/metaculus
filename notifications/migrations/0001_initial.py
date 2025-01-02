# Generated by Django 5.1.1 on 2024-09-17 15:10

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Notification",
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
                ("type", models.CharField(db_index=True)),
                ("params", models.JSONField()),
                ("read_at", models.DateTimeField(db_index=True, null=True)),
                ("email_sent", models.BooleanField(db_index=True, default=False)),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
