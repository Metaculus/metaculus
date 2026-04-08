from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0019_add_allow_public_comments"),
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
    ]
