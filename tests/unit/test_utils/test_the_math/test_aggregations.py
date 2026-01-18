import pytest
import numpy as np
from datetime import datetime, timezone as dt_timezone

from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.types import AggregationMethod
from questions.models import Question, AggregateForecast
from scoring.models import Leaderboard, LeaderboardEntry, Score
from scoring.constants import ScoreTypes
from users.models import User
from utils.the_math.aggregations import (
    AGGREGATIONS,
    summarize_array,
    ForecastSet,
    get_aggregation_by_name,
    UnweightedAggregation,
    RecencyWeightedAggregation,
    ProAggregation,
    MedalistsAggregation,
    SilverMedalistsAggregation,
    GoldMedalistsAggregation,
    JoinedBeforeDateAggregation,
    SingleAggregation,
)


@pytest.mark.parametrize(
    "array, max_size, expected_array",
    [
        ([], 10, []),
        (range(10), 10, range(10)),
        (range(10), 150, range(10)),
        (range(5), 3, [0, 2, 4]),
        ([1, 1.1, 1.2, 1.5, 2, 3, 4, 5], 3, [1, 3, 5]),
        (range(10), 5, [0, 3, 5, 7, 9]),
    ],
)
def test_summarize_array(array, max_size, expected_array):
    summarized = summarize_array(array, max_size)

    # Check that the summarized list has the correct length
    assert np.allclose(summarized, expected_array)


class TestAggregations:

    @pytest.mark.parametrize("aggregation_name", [Agg.method for Agg in AGGREGATIONS])
    def test_aggregations_initialize(
        self, question_binary: Question, aggregation_name: str
    ):
        question_binary.open_time = datetime(2015, 1, 1, tzinfo=dt_timezone.utc)
        user = User.objects.create(
            username="user",
            date_joined=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
            metadata={"pro_details": {"is_current_pro": True}},
        )
        project, _ = Project.objects.get_or_create(
            name="test_project",
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        )
        leaderboard, _ = Leaderboard.objects.get_or_create(
            project=project,
            finalize_time=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )
        LeaderboardEntry.objects.get_or_create(
            leaderboard=leaderboard,
            user=user,
            medal="gold",
            score=0,
            calculated_on=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )

        aggregation = get_aggregation_by_name(aggregation_name)(
            question=question_binary,
            all_forecaster_ids=[user.id],
            joined_before=datetime.fromisoformat("2023-01-01"),
        )
        entry = aggregation.calculate_aggregation_entry(
            forecast_set=ForecastSet(
                forecasts_values=[[0.5, 0.5]],
                timestep=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                forecaster_ids=[user.id],
                timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezone.utc)],
            ),
        )
        assert entry

    @pytest.mark.parametrize(
        "init_params, forecast_set, include_stats, histogram, expected",
        [
            (
                {},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezone.utc)],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1],
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezone.utc)],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                    interval_lower_bounds=[0.5, 0.5],
                    centers=[0.5, 0.5],
                    interval_upper_bounds=[0.5, 0.5],
                    means=[0.5, 0.5],
                    histogram=[0] * 50 + [1] + [0] * 49,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1, 2],
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=[0.3, 0.7],
                    histogram=[0] * 60 + [1] + [0] * 19 + [1] + [0] * 19,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1, 2, 3],
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=[0.3, 0.7],
                    histogram=None,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.1, 0.9],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    forecaster_ids=[1, 2, 3],
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.UNWEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.1, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.9],
                    means=[0.8 / 3, 2.2 / 3],
                    histogram=None,
                ),
            ),
        ],
    )
    def test_UnweightedAggregation(
        self,
        question_binary: Question,
        init_params: dict,
        forecast_set: ForecastSet,
        include_stats: bool,
        histogram: bool,
        expected: AggregateForecast,
    ):
        aggregation = UnweightedAggregation(question=question_binary, **init_params)
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
                {},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezone.utc)],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[[0.5, 0.5]],
                    timestep=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[datetime(2023, 1, 1, tzinfo=dt_timezone.utc)],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.5, 0.5],
                    forecaster_count=1,
                    interval_lower_bounds=[0.5, 0.5],
                    centers=[0.5, 0.5],
                    interval_upper_bounds=[0.5, 0.5],
                    means=[0.5, 0.5],
                    histogram=[0] * 50 + [1] + [0] * 49,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                False,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=2,
                    interval_lower_bounds=[0.2, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.8],
                    means=[0.3, 0.7],
                    histogram=[0] * 60 + [1] + [0] * 19 + [1] + [0] * 19,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.3, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.7],
                    means=[0.32350213768407476, 0.6764978623159252],
                    histogram=None,
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                True,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.3, 0.7],
                    forecaster_count=3,
                    interval_lower_bounds=[0.3, 0.6],
                    centers=[0.3, 0.7],
                    interval_upper_bounds=[0.4, 0.7],
                    means=[0.32350213768407476, 0.6764978623159252],
                    histogram=(
                        [0] * 60
                        + [1]
                        + [0] * 9
                        + [0.7277212189012763]
                        + [0] * 9
                        + [0.48092170020263214]
                        + [0] * 19
                    ),
                ),
            ),
            (
                {},
                ForecastSet(
                    forecasts_values=[
                        [0.2, 0.8],
                        [0.3, 0.7],
                        [0.5, 0.5],
                        [0.4, 0.6],
                    ],
                    timestep=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    timesteps=[
                        datetime(2021, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2022, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                        datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    ],
                ),
                True,
                False,
                AggregateForecast(
                    start_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
                    method=AggregationMethod.RECENCY_WEIGHTED,
                    forecast_values=[0.4, 0.6],
                    forecaster_count=4,
                    interval_lower_bounds=[0.3, 0.5],
                    centers=[0.4, 0.6],
                    interval_upper_bounds=[0.5, 0.7],
                    means=[0.38038738350522694, 0.6196126164947732],
                    histogram=None,
                ),
            ),
        ],
    )
    def test_RecencyWeightedAggregation(
        self,
        question_binary: Question,
        init_params: dict,
        forecast_set: ForecastSet,
        include_stats: bool,
        histogram: bool,
        expected: AggregateForecast,
    ):
        aggregation = RecencyWeightedAggregation(
            question=question_binary, **init_params
        )
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

    def test_SingleAggregation(self, question_binary: Question):
        high_rep_user = User.objects.create(username="high_rep_user")
        low_rep_user = User.objects.create(username="low_rep_user")

        question_binary.open_time = datetime(2022, 1, 1, tzinfo=dt_timezone.utc)
        question_binary.scheduled_close_time = datetime(
            2025, 1, 1, tzinfo=dt_timezone.utc
        )
        question_binary.save()
        project, _ = Project.objects.get_or_create(
            name="test_project",
            visibility="normal",
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        )
        Post.objects.create(
            default_project=project,
            question=question_binary,
            author=high_rep_user,
        )

        Score.objects.create(
            user=high_rep_user,
            question=question_binary,
            score=3000,
            coverage=1,
            score_type=ScoreTypes.PEER,
        )
        Score.objects.create(
            user=low_rep_user,
            question=question_binary,
            score=900,
            coverage=1,
            score_type=ScoreTypes.PEER,
        )
        Score.objects.update(edited_at=datetime(2020, 1, 1, tzinfo=dt_timezone.utc))

        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        high_forecast = [0.2, 0.8]
        low_forecast = [0.8, 0.2]
        forecast_set = ForecastSet(
            forecasts_values=[low_forecast, high_forecast],
            timestep=timestep,
            forecaster_ids=[low_rep_user.id, high_rep_user.id],
            timesteps=[timestep, timestep],
        )

        aggregation = SingleAggregation(
            question=question_binary,
            all_forecaster_ids=[low_rep_user.id, high_rep_user.id],
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == AggregationMethod.SINGLE_AGGREGATION
        assert new_aggregation.forecaster_count == 2
        assert new_aggregation.start_time == timestep
        # aggregate should be closer to the user with a higher reputation
        high_value = high_forecast[1]
        low_value = low_forecast[1]
        aggregate_value = new_aggregation.forecast_values[1]
        assert abs(high_value - aggregate_value) < abs(low_value - aggregate_value)

    def test_ProAggregation(self, question_binary: Question):
        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        pro_user = User.objects.create(
            username="pro_user",
            metadata={"pro_details": {"is_current_pro": True}},
        )
        regular_user = User.objects.create(
            username="regular_user",
        )
        pro_forecast = [0.8, 0.2]
        regular_forecast = [0.3, 0.7]
        forecast_set = ForecastSet(
            forecasts_values=[regular_forecast, pro_forecast],
            timestep=timestep,
            forecaster_ids=[regular_user.id, pro_user.id],
            timesteps=[
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                datetime(2023, 1, 2, tzinfo=dt_timezone.utc),
            ],
        )

        aggregation = ProAggregation(
            question=question_binary,
            all_forecaster_ids=[regular_user.id, pro_user.id],
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == ProAggregation.method
        assert np.allclose(new_aggregation.forecast_values, pro_forecast)
        assert new_aggregation.forecaster_count == 1
        assert new_aggregation.start_time == timestep

    def test_MedalistsAggregation(self, question_binary: Question):
        question_binary.open_time = datetime(2023, 1, 1, tzinfo=dt_timezone.utc)
        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        medalist_user = User.objects.create(username="medalist_user")
        non_medalist = User.objects.create(username="non_medalist")
        project, _ = Project.objects.get_or_create(
            name="test_project",
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        )
        leaderboard, _ = Leaderboard.objects.get_or_create(
            project=project,
            finalize_time=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )
        LeaderboardEntry.objects.create(
            leaderboard=leaderboard,
            user=medalist_user,
            medal=LeaderboardEntry.Medals.BRONZE,
            score=0,
        )
        medalist_forecast = [0.6, 0.4]
        non_medalist_forecast = [0.2, 0.8]
        forecast_set = ForecastSet(
            forecasts_values=[non_medalist_forecast, medalist_forecast],
            timestep=timestep,
            forecaster_ids=[non_medalist.id, medalist_user.id],
            timesteps=[
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
            ],
        )

        aggregation = MedalistsAggregation(
            question=question_binary,
            all_forecaster_ids=[non_medalist.id, medalist_user.id],
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == MedalistsAggregation.method
        assert np.allclose(new_aggregation.forecast_values, medalist_forecast)
        assert new_aggregation.forecaster_count == 1
        assert new_aggregation.start_time == timestep

    def test_SilverMedalistsAggregation(self, question_binary: Question):
        question_binary.open_time = datetime(2023, 1, 1, tzinfo=dt_timezone.utc)
        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        bronze_medalist = User.objects.create(username="bronze_user")
        silver_medalist = User.objects.create(username="silver_user")
        project, _ = Project.objects.get_or_create(
            name="test_project",
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        )
        leaderboard, _ = Leaderboard.objects.get_or_create(
            project=project,
            finalize_time=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )
        LeaderboardEntry.objects.create(
            leaderboard=leaderboard,
            user=bronze_medalist,
            medal=LeaderboardEntry.Medals.BRONZE,
            score=0,
        )
        LeaderboardEntry.objects.create(
            leaderboard=leaderboard,
            user=silver_medalist,
            medal=LeaderboardEntry.Medals.SILVER,
            score=0,
        )
        bronze_forecast = [0.2, 0.8]
        silver_forecast = [0.7, 0.3]
        forecast_set = ForecastSet(
            forecasts_values=[bronze_forecast, silver_forecast],
            timestep=timestep,
            forecaster_ids=[bronze_medalist.id, silver_medalist.id],
            timesteps=[
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
            ],
        )

        aggregation = SilverMedalistsAggregation(
            question=question_binary,
            all_forecaster_ids=[bronze_medalist.id, silver_medalist.id],
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == SilverMedalistsAggregation.method
        assert np.allclose(new_aggregation.forecast_values, silver_forecast)
        assert new_aggregation.forecaster_count == 1
        assert new_aggregation.start_time == timestep

    def test_GoldMedalistsAggregation(self, question_binary: Question):
        question_binary.open_time = datetime(2023, 1, 1, tzinfo=dt_timezone.utc)
        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        silver_medalist = User.objects.create(username="silver_user")
        gold_medalist = User.objects.create(username="gold_user")
        project, _ = Project.objects.get_or_create(
            name="test_project",
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        )
        leaderboard, _ = Leaderboard.objects.get_or_create(
            project=project,
            finalize_time=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )
        LeaderboardEntry.objects.create(
            leaderboard=leaderboard,
            user=silver_medalist,
            medal=LeaderboardEntry.Medals.SILVER,
            score=0,
        )
        LeaderboardEntry.objects.create(
            leaderboard=leaderboard,
            user=gold_medalist,
            medal=LeaderboardEntry.Medals.GOLD,
            score=0,
        )
        silver_forecast = [0.4, 0.6]
        gold_forecast = [0.9, 0.1]
        forecast_set = ForecastSet(
            forecasts_values=[silver_forecast, gold_forecast],
            timestep=timestep,
            forecaster_ids=[silver_medalist.id, gold_medalist.id],
            timesteps=[
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
            ],
        )

        aggregation = GoldMedalistsAggregation(
            question=question_binary,
            all_forecaster_ids=[silver_medalist.id, gold_medalist.id],
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == GoldMedalistsAggregation.method
        assert np.allclose(new_aggregation.forecast_values, gold_forecast)
        assert new_aggregation.forecaster_count == 1
        assert new_aggregation.start_time == timestep

    def test_JoinedBeforeDateAggregation(self, question_binary: Question):
        question_binary.open_time = datetime(2022, 1, 1, tzinfo=dt_timezone.utc)
        joined_before = datetime(2020, 1, 1, tzinfo=dt_timezone.utc)
        timestep = datetime(2024, 1, 1, tzinfo=dt_timezone.utc)
        early_user = User.objects.create(
            username="early_user",
            date_joined=datetime(2015, 1, 1, tzinfo=dt_timezone.utc),
        )
        late_user = User.objects.create(
            username="late_user",
            date_joined=datetime(2025, 7, 1, tzinfo=dt_timezone.utc),
        )
        early_forecast = [0.65, 0.35]
        late_forecast = [0.2, 0.8]
        forecast_set = ForecastSet(
            forecasts_values=[late_forecast, early_forecast],
            timestep=timestep,
            forecaster_ids=[late_user.id, early_user.id],
            timesteps=[
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
                datetime(2023, 1, 1, tzinfo=dt_timezone.utc),
            ],
        )

        aggregation = JoinedBeforeDateAggregation(
            question=question_binary,
            all_forecaster_ids=[late_user.id, early_user.id],
            joined_before=joined_before,
        )
        new_aggregation = aggregation.calculate_aggregation_entry(forecast_set)

        assert new_aggregation
        assert new_aggregation.method == JoinedBeforeDateAggregation.method
        assert np.allclose(new_aggregation.forecast_values, early_forecast)
        assert new_aggregation.forecaster_count == 1
        assert new_aggregation.start_time == timestep
