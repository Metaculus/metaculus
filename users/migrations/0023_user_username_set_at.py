from django.db import migrations, models


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
    ]
