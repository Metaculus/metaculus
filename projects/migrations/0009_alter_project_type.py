# Generated by Django 5.0.8 on 2024-08-31 16:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0008_project_include_bots_in_leaderboard'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='type',
            field=models.CharField(choices=[('site_main', 'Site Main'), ('tournament', 'Tournament'), ('question_series', 'Question Series'), ('personal_project', 'Personal Project'), ('news_category', 'News Category'), ('public_figure', 'Public Figure'), ('category', 'Category'), ('tag', 'Tag'), ('topic', 'Topic')], db_index=True, max_length=32),
        ),
    ]
