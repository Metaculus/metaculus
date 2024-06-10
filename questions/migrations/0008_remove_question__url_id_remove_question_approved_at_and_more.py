# Generated by Django 5.0.6 on 2024-06-10 14:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0007_alter_vote_direction"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="question",
            name="_url_id",
        ),
        migrations.RemoveField(
            model_name="question",
            name="approved_at",
        ),
        migrations.RemoveField(
            model_name="question",
            name="approved_by",
        ),
        migrations.RemoveField(
            model_name="question",
            name="author",
        ),
        migrations.RemoveField(
            model_name="question",
            name="projects",
        ),
        migrations.RemoveField(
            model_name="question",
            name="published_at",
        ),
        migrations.RemoveField(
            model_name="question",
            name="title",
        ),
        migrations.RemoveField(
            model_name="question",
            name="updated_at",
        ),
        migrations.AddField(
            model_name="question",
            name="edited_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.DeleteModel(
            name="Vote",
        ),
    ]
