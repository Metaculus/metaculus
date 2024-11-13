# Generated by Django 5.1.1 on 2024-11-13 11:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_project_temp_translation_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="content_last_md5",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="content_original_lang",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
    ]
