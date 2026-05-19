from django.db import migrations, models
from django.utils import timezone


def set_already_published(apps, schema_editor):
    # Mark questions on already-published posts as triggered so we don't
    # back-fire tournament notifications for the full historical archive.
    Question = apps.get_model("questions", "Question")
    Question.objects.filter(
        post__published_at__lte=timezone.now(),
        post__curation_status="approved",
    ).update(published_at_triggered=True)


class Migration(migrations.Migration):
    dependencies = [
        ("questions", "0037_question_options_order"),
        ("posts", "0029_remove_notebook_markdown_summary_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="published_at_triggered",
            field=models.BooleanField(db_index=True, default=False, editable=False),
        ),
        migrations.RunPython(set_already_published, migrations.RunPython.noop),
    ]
