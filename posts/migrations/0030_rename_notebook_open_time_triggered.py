from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0029_remove_notebook_markdown_summary_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="notebook",
            old_name="open_time_triggered",
            new_name="published_at_triggered",
        ),
    ]
