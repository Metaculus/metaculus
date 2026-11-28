from django.contrib.postgres.operations import ValidateConstraint
from django.db import migrations


class Migration(migrations.Migration):
    """
    Validates the constraint added NOT VALID in 0040. Runs in its own
    transaction, under a SHARE UPDATE EXCLUSIVE lock, so forecasts can still
    be read and written while existing rows are scanned.
    """

    dependencies = [
        ("questions", "0040_forecast_resilience"),
    ]

    operations = [
        ValidateConstraint(
            model_name="forecast",
            name="forecast_resilience_between_0_and_1",
        ),
    ]
