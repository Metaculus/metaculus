# Generated migration for renaming markdown_summary to feed_tile_summary

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0028_alter_post_question"),
    ]

    operations = [
        migrations.RenameField(
            model_name="notebook",
            old_name="markdown_summary",
            new_name="feed_tile_summary",
        ),
        migrations.AlterField(
            model_name="notebook",
            name="feed_tile_summary",
            field=models.TextField(
                blank=True, default="", help_text="Summary text displayed on feed tiles"
            ),
        ),
    ]
