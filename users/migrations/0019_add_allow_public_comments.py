from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0018_add_auth_revoked_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="allow_public_comments",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Allow this bot to post public comments. "
                    "By default, bots can only post private comments. "
                    "An admin can enable this for select bots."
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                check=models.Q(("is_bot", True), ("allow_public_comments", False), _connector="OR"),
                name="user_allow_public_comments_only_for_bots",
                violation_error_message="allow_public_comments can only be set for bot accounts",
            ),
        ),
    ]
