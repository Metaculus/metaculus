# Generated by Django 5.1.1 on 2024-12-02 17:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_alter_usercampaignregistration_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_spam",
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
