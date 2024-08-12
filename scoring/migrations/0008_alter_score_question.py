# Generated by Django 5.0.6 on 2024-08-10 21:09

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0013_rename_max_question_range_max_and_more'),
        ('scoring', '0007_leaderboardentry_excluded'),
    ]

    operations = [
        migrations.AlterField(
            model_name='score',
            name='question',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scores', to='questions.question'),
        ),
    ]
