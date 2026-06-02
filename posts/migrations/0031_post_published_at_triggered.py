from django.db import migrations, models
from django.utils import timezone


def set_already_published(apps, schema_editor):
    # Mark already-published posts as triggered so we don't back-fire
    # tournament / project follower notifications for the historical archive.
    Post = apps.get_model("posts", "Post")
    Post.objects.filter(
        published_at__lte=timezone.now(),
        curation_status="approved",
    ).update(published_at_triggered=True)


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0030_backfill_conditional_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="published_at_triggered",
            field=models.BooleanField(db_index=True, default=False, editable=False),
        ),
        migrations.RunPython(set_already_published, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="notebook",
            name="open_time_triggered",
        ),
    ]
