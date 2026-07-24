from django.db import migrations, models
from django.db.models import F


def backfill_username_set_at(apps, schema_editor):
    """
    Stamp existing accounts with their creation date so they are treated as
    human-set (only new social-auth signups stay NULL going forward). Single
    UPDATE; only rows still NULL are touched.

    This runs inside the atomic migration, so the AddField's ACCESS EXCLUSIVE
    lock is held across this UPDATE and the table is blocked for reads/writes
    while it runs (a few seconds at the current row count). That's accepted for
    simplicity;
    """
    User = apps.get_model("users", "User")
    User.objects.filter(username_set_at__isnull=True).update(
        username_set_at=F("date_joined")
    )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0022_user_exclude_from_aggregations"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="username_set_at",
            field=models.DateTimeField(
                blank=True, default=None, editable=False, null=True
            ),
        ),
        migrations.RunPython(backfill_username_set_at, migrations.RunPython.noop),
    ]
