# Generated by Django 5.1.4 on 2024-12-15 17:42

import django.contrib.auth.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_user_is_spam"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserHeavyweight",
            fields=[],
            options={
                "verbose_name": "User (Heavyweight View)",
                "verbose_name_plural": "Users (Heavyweight View)",
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("users.user",),
            managers=[
                ("objects", django.contrib.auth.models.UserManager()),
            ],
        ),
    ]
