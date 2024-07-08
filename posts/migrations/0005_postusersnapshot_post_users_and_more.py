# Generated by Django 5.0.6 on 2024-07-08 15:01

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0004_rename_closed_at_post_actual_close_time"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PostUserSnapshot",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("comments_count", models.IntegerField(default=0)),
                (
                    "viewed_at",
                    models.DateTimeField(
                        db_index=True, default=django.utils.timezone.now
                    ),
                ),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="snapshots",
                        to="posts.post",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="post_snapshots",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="post",
            name="users",
            field=models.ManyToManyField(
                through="posts.PostUserSnapshot", to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddConstraint(
            model_name="postusersnapshot",
            constraint=models.UniqueConstraint(
                fields=("user_id", "post_id"), name="postusersnapshot_unique_user_post"
            ),
        ),
    ]
