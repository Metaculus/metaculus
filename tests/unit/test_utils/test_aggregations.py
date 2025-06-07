import pytest
import numpy as np
from datetime import datetime, timezone as dt_timezome

from utils.the_math.aggregations import (
    summarize_array,
    ForecastSet,
    UnweightedAggregation,
    RecencyWeightedAggregation,
)
from questions.types import AggregationMethod
from questions.models import Question, AggregateForecast


@pytest.mark.parametrize(
    "array, max_size, expceted_array",
    [
        ([], 10, []),
        (range(10), 10, range(10)),
        (range(10), 150, range(10)),
        (range(5), 3, [0, 2, 4]),
        ([1, 1.1, 1.2, 1.5, 2, 3, 4, 5], 3, [1, 3, 5]),
        (range(10), 5, [0, 3, 5, 7, 9]),
    ],
)
def test_summarize_array(array, max_size, expceted_array):
    summarized = summarize_array(array, max_size)

    # Check that the summarized list has the correct length
    assert np.allclose(summarized, expceted_array)


class TestAggregations:

    @pytest.mark.parametrize(
        "init_params, forecast_set, include_stats, histogram, expected",
        [
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezome.utc)],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezome.utc)],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                    interval_lower_bounds=[0.5, 0.5],
                    centers=[0.5, 0.5],
                    interval_upper_bounds=[0.5, 0.5],
                    means=None,
                    histogram=[0] * 50 + [1] + [0] * 49,
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=None,
                    histogram=[0] * 60 + [1] + [0] * 19 + [1] + [0] * 19,
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2, 3],
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=None,
                    histogram=None,
                ),
            ),
        ],
    )
    def test_UnweightedAggregation(
        self,
        init_params: dict,
        forecast_set: ForecastSet,
        include_stats: bool,
        histogram: bool,
        expected: AggregateForecast,
    ):
        aggregation = UnweightedAggregation(**init_params)
        new_aggregation = aggregation.calculate_aggregation_entry(
            forecast_set, include_stats, histogram
        )

        assert new_aggregation.start_time == expected.start_time
        assert (
            new_aggregation.forecast_values == expected.forecast_values
        ) or np.allclose(new_aggregation.forecast_values, expected.forecast_values)
        assert new_aggregation.forecaster_count == expected.forecaster_count
        assert (
            new_aggregation.interval_lower_bounds == expected.interval_lower_bounds
        ) or np.allclose(
            new_aggregation.interval_lower_bounds, expected.interval_lower_bounds
        )
        assert (new_aggregation.centers == expected.centers) or np.allclose(
            new_aggregation.centers, expected.centers
        )
        assert (
            new_aggregation.interval_upper_bounds == expected.interval_upper_bounds
        ) or np.allclose(
            new_aggregation.interval_upper_bounds, expected.interval_upper_bounds
        )
        assert (new_aggregation.means == expected.means) or np.allclose(
            new_aggregation.means, expected.means
        )
        assert (new_aggregation.histogram == expected.histogram) or np.allclose(
            new_aggregation.histogram, expected.histogram
        )

    @pytest.mark.parametrize(
        "init_params, forecast_set, include_stats, histogram, expected",
        [
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezome.utc)],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezome.utc)],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                    interval_lower_bounds=[0.5, 0.5],
                    centers=[0.5, 0.5],
                    interval_upper_bounds=[0.5, 0.5],
                    means=None,
                    histogram=[0] * 50 + [1] + [0] * 49,
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=None,
                    histogram=[0] * 60 + [1] + [0] * 19 + [1] + [0] * 19,
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2, 3],
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.3, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.7],
                    means=None,
                    histogram=None,
                ),
            ),
            (
                {"question_type": Question.QuestionType.BINARY},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.5, 0.5],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    user_ids=[1, 2, 3, 4],
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezome.utc),
                        datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezome.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.4, 0.6],
                    forecaster_count=4,
                    interval_lower_bounds=[0.3, 0.5],
                    centers=[0.4, 0.6],
                    interval_upper_bounds=[0.5, 0.7],
                    means=None,
                    histogram=None,
                ),
            ),
        ],
    )
    def test_RecencyWeightedAggregation(
        self,
        init_params: dict,
        forecast_set: ForecastSet,
        include_stats: bool,
        histogram: bool,
        expected: AggregateForecast,
    ):
        aggregation = RecencyWeightedAggregation(**init_params)
        new_aggregation = aggregation.calculate_aggregation_entry(
            forecast_set, include_stats, histogram
        )

        assert new_aggregation.start_time == expected.start_time
        assert (
            new_aggregation.forecast_values == expected.forecast_values
        ) or np.allclose(new_aggregation.forecast_values, expected.forecast_values)
        assert new_aggregation.forecaster_count == expected.forecaster_count
        assert (
            new_aggregation.interval_lower_bounds == expected.interval_lower_bounds
        ) or np.allclose(
            new_aggregation.interval_lower_bounds, expected.interval_lower_bounds
        )
        assert (new_aggregation.centers == expected.centers) or np.allclose(
            new_aggregation.centers, expected.centers
        )
        assert (
            new_aggregation.interval_upper_bounds == expected.interval_upper_bounds
        ) or np.allclose(
            new_aggregation.interval_upper_bounds, expected.interval_upper_bounds
        )
        assert (new_aggregation.means == expected.means) or np.allclose(
            new_aggregation.means, expected.means
        )
        assert (new_aggregation.histogram == expected.histogram) or np.allclose(
            new_aggregation.histogram, expected.histogram
        )
