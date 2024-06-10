# Generated by Django 5.0.6 on 2024-06-10 14:19

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0006_alter_project_section"),
        (
            "questions",
            "0008_remove_question__url_id_remove_question_approved_at_and_more",
        ),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Post",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("edited_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                (
                    "type",
                    models.CharField(
                        choices=[("forecast", "Forecast"), ("discussion", "Discussion")]
                    ),
                ),
                ("approved_at", models.DateTimeField(null=True)),
                ("published_at", models.DateTimeField(db_index=True, null=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="approved_questions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="posts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "projects",
                    models.ManyToManyField(related_name="posts", to="projects.project"),
                ),
                (
                    "question",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="post",
                        to="questions.question",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Vote",
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
                    "direction",
                    models.SmallIntegerField(choices=[(1, "Up"), (-1, "Down")]),
                ),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="votes",
                        to="posts.post",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="votes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="vote",
            constraint=models.UniqueConstraint(
                fields=("user_id", "post_id"), name="votes_unique_user_question"
            ),
        ),
    ]
