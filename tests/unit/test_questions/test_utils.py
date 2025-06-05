import pytest
from freezegun import freeze_time

from questions.models import AggregateForecast
from questions.utils import get_last_aggregated_forecast_in_the_past
from tests.unit.utils import datetime_aware


@freeze_time("2025-01-15")
def test_get_last_aggregated_forecast_in_the_past(question_binary):
    aggregations = [
        # Start time in the future (expiration forecast)
        AggregateForecast(start_time=datetime_aware(2025, 1, 16)),
        # Both start and end dates are in the past
        AggregateForecast(
            start_time=datetime_aware(2025, 1, 13), end_time=datetime_aware(2025, 1, 14)
        ),
        # Truly last forecast
        AggregateForecast(
            start_time=datetime_aware(2025, 1, 12), end_time=datetime_aware(2025, 1, 16)
        ),
        # Just another forecast, should not be taken into account
        AggregateForecast(start_time=datetime_aware(2025, 1, 11)),
    ]

    # Case #1: wrong initial order
    with pytest.raises(ValueError):
        get_last_aggregated_forecast_in_the_past(aggregations)

    # Correct order
    aggregations.sort(key=lambda a: a.start_time)
    last_agg = get_last_aggregated_forecast_in_the_past(aggregations)

    assert last_agg.start_time == datetime_aware(2025, 1, 12)
    assert last_agg.end_time == datetime_aware(2025, 1, 16)
