# Generated by Django 5.1.1 on 2024-09-17 15:10

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0001_initial"),
        ("scoring", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="created_projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="primary_leaderboard",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="primary_project",
                to="scoring.leaderboard",
            ),
        ),
        migrations.AddField(
            model_name="projectsubscription",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="subscriptions",
                to="projects.project",
            ),
        ),
        migrations.AddField(
            model_name="projectsubscription",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="project_subscriptions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="projectuserpermission",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="projects.project"
            ),
        ),
        migrations.AddField(
            model_name="projectuserpermission",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="override_permissions",
            field=models.ManyToManyField(
                through="projects.ProjectUserPermission", to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddConstraint(
            model_name="projectsubscription",
            constraint=models.UniqueConstraint(
                fields=("user_id", "project_id"),
                name="projectsubscription_unique_user_project",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectuserpermission",
            constraint=models.UniqueConstraint(
                fields=("user_id", "project_id"),
                name="projectuserpermission_unique_user_id_project_id",
            ),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                fields=("type", "slug"), name="projects_unique_type_slug"
            ),
        ),
    ]
