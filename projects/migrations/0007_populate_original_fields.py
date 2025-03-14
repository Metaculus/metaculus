# Generated by Django 5.1.1 on 2024-11-13 15:49

from django.db import migrations
from utils.translation import migration_update_default_fields


def migrate(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    migration_update_default_fields(Project, ["description", "name", "subtitle"])


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_project_content_last_md5_and_more"),
    ]

    operations = [
        migrations.RunPython(migrate, migrations.RunPython.noop),
    ]
