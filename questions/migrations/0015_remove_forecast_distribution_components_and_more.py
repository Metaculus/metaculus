# Generated by Django 5.1.4 on 2025-01-27 14:25

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("questions", "0014_forecast_distribution_input"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="forecast",
            name="distribution_components",
        ),
        migrations.RemoveField(
            model_name="forecast",
            name="slider_values",
        ),
    ]