# Generated by Django 5.0.6 on 2024-06-28 19:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0009_alter_post_projects"),
    ]

    operations = [
        migrations.AddField(
            model_name="notebook",
            name="news_type",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
