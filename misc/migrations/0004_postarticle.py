# Generated by Django 5.1.8 on 2025-04-23 09:39

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("misc", "0003_whitelistuser"),
        ("posts", "0017_remove_post_open_time_triggered"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostArticle",
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
                ("distance", models.FloatField(db_index=True)),
                (
                    "article",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="misc.itnarticle",
                    ),
                ),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="posts.post"
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=("article_id", "post_id"), name="post_article_unique"
                    )
                ],
            },
        )
    ]
