# Generated by Django 5.1.4 on 2025-02-11 19:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0012_alter_post_default_project"),
    ]

    operations = [
        migrations.AlterField(
            model_name="post",
            name="hotness",
            field=models.IntegerField(db_index=True, default=0, editable=False),
        ),
    ]
