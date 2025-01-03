# Generated by Django 5.1.4 on 2024-12-27 18:53

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("misc", "0002_initial"),
        ("posts", "0012_alter_post_default_project"),
        ("projects", "0010_remove_project_add_posts_to_main_feed_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WhitelistUser",
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
                (
                    "created_at",
                    models.DateTimeField(
                        default=django.utils.timezone.now, editable=False
                    ),
                ),
                ("edited_at", models.DateTimeField(editable=False, null=True)),
                (
                    "post",
                    models.ForeignKey(
                        help_text="Optional. If provided, this allows the user to download user-level data for the post. If neither project nor post is set, the user is whitelisted for all data.",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="whitelists",
                        to="posts.post",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        help_text="Optional. If provided, this allows the user to download user-level data for the project. If neither project nor post is set, the user is whitelisted for all data.",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="whitelists",
                        to="projects.project",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="whitelists",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]