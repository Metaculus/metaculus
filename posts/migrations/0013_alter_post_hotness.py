# Generated by Django 5.1.1 on 2024-12-06 15:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0012_alter_post_default_project"),
    ]

    operations = [
        migrations.AlterField(
            model_name="post",
            name="hotness",
            field=models.IntegerField(blank=True, db_index=True, null=True),
        ),
    ]
