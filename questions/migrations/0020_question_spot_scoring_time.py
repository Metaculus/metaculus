# Generated by Django 5.1.7 on 2025-03-20 20:45

from django.db import migrations, models


def migrate(apps, schema_editor):
    Question = apps.get_model("questions", "Question")
    Question.objects.filter(spot_scoring_time__isnull=True).update(
        spot_scoring_time=models.F("cp_reveal_time")
    )


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0019_merge_20250319_2033"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="spot_scoring_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Time when spot scores are evaluated.\n        If not set, defaults to spot_scoring time.",
                null=True,
            ),
        ),
        migrations.RunPython(migrate, migrations.RunPython.noop),
    ]
