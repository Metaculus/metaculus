# Generated by Django 5.1.9 on 2025-06-27 14:43

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("scoring", "0014_leaderboard_minimum_prize_amount"),
    ]

    operations = [
        migrations.DeleteModel(
            name="UserWeight",
        ),
    ]
