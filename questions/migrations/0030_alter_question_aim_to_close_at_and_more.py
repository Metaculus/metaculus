# Generated by Django 5.0.6 on 2024-07-01 18:22

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0029_alter_question_aim_to_close_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="question",
            name="aim_to_close_at",
            field=models.DateTimeField(
                db_index=True,
                default=datetime.datetime(
                    2051, 11, 17, 18, 22, 5, 65998, tzinfo=datetime.timezone.utc
                ),
            ),
        ),
        migrations.AlterField(
            model_name="question",
            name="aim_to_resolve_at",
            field=models.DateTimeField(
                db_index=True,
                default=datetime.datetime(
                    2051, 11, 17, 18, 22, 5, 66118, tzinfo=datetime.timezone.utc
                ),
            ),
        ),
    ]
