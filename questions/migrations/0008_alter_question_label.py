import re

from django.db import migrations, models


def get_question_group_title(title: str) -> str:
    matches = re.findall(r"\((?:[^()]*|\([^()]*\))*\)", title)
    return matches[-1][1:-1] if matches else title


def migrate(apps, schema_editor):
    """
    Migrating group questions to have a separate label
    """

    Question = apps.get_model("questions", "Question")
    bulk_update = []

    for question in Question.objects.filter(group_id__isnull=False).only("id", "title"):
        question.label = get_question_group_title(question.title)
        bulk_update.append(question)

        if len(bulk_update) == 500:
            Question.objects.bulk_update(bulk_update, fields=["label"])
            bulk_update = []

    Question.objects.bulk_update(bulk_update, fields=["label"])


class Migration(migrations.Migration):
    dependencies = [
        ("questions", "0007_question_question_weight"),
    ]

    operations = [
        migrations.AlterField(
            model_name="question",
            name="label",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.RunPython(migrate, reverse_code=migrations.RunPython.noop),
    ]
