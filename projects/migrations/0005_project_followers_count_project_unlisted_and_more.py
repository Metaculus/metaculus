# Generated by Django 5.1.1 on 2024-10-31 12:31

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0004_remove_project_is_active_alter_project_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="followers_count",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.AddField(
            model_name="project",
            name="unlisted",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name="project",
            name="type",
            field=models.CharField(
                choices=[
                    ("site_main", "Site Main"),
                    ("tournament", "Tournament"),
                    ("question_series", "Question Series"),
                    ("personal_project", "Personal Project"),
                    ("news_category", "News Category"),
                    ("category", "Category"),
                    ("tag", "Tag"),
                    ("topic", "Topic"),
                    ("community", "Community"),
                ],
                db_index=True,
                max_length=32,
            ),
        ),
    ]