from django.db import migrations, models


def set_bots_to_disallow_public_comments(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(is_bot=True).update(allow_public_comments=False)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0020_api_forecasting_access"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="is_primary_bot",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text=(
                    "Marks the user's primary bot. The primary"
                    " bot is eligible for prizes, counts toward"
                    " peer scores, and appears on leaderboards."
                ),
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="allow_public_comments",
            field=models.BooleanField(
                default=True,
                help_text=(
                    "Whether this account may post public comments. "
                    "Enabled by default for human accounts. "
                    "Bots are disabled by default; an admin can enable this "
                    "for select bots."
                ),
            ),
        ),
        migrations.RunPython(
            set_bots_to_disallow_public_comments, migrations.RunPython.noop
        ),
    ]
