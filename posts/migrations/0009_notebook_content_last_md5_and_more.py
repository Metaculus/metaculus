# Generated by Django 5.1.1 on 2024-11-13 15:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0008_rename_published_at_triggered_post_open_time_triggered"),
    ]

    operations = [
        migrations.AddField(
            model_name="notebook",
            name="content_last_md5",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="content_original_lang",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="markdown_cs",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="markdown_en",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="markdown_es",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="markdown_original",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="notebook",
            name="markdown_zh",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="content_last_md5",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="content_original_lang",
            field=models.CharField(blank=True, max_length=16, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="title_cs",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="title_en",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="title_es",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="title_original",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="title_zh",
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="url_title_cs",
            field=models.CharField(blank=True, default="", max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="url_title_en",
            field=models.CharField(blank=True, default="", max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="url_title_es",
            field=models.CharField(blank=True, default="", max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="url_title_original",
            field=models.CharField(blank=True, default="", max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="post",
            name="url_title_zh",
            field=models.CharField(blank=True, default="", max_length=2000, null=True),
        ),
    ]