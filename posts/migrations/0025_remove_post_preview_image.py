# Generated by Django 5.0.8 on 2024-09-05 14:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0024_post_preview_image_post_preview_image_generated_at"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="post",
            name="preview_image",
        ),
    ]
