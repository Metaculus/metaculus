from dataclasses import dataclass

import numpy as np
from scipy.stats.mstats import gmean

from questions.models import (
    QUESTION_CONTINUOUS_TYPES,
    AggregateForecast,
    Forecast,
    Question,
)
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.models import Score
from utils.the_math.aggregations import get_aggregation_history


@dataclass
class AggregationEntry:
    pmf: np.ndarray | list[float]
    num_forecasters: int
    timestamp: float


def get_geometric_means(
    forecasts: list[Forecast | AggregateForecast],
) -> list[AggregationEntry]:
    geometric_means = []
    timesteps: set[float] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time.timestamp())
        if forecast.end_time:
            timesteps.add(forecast.end_time.timestamp())
    for timestep in sorted(timesteps):
        prediction_values = [
            f.get_pmf()
            for f in forecasts
            if f.start_time.timestamp() <= timestep
            and (f.end_time is None or f.end_time.timestamp() > timestep)
        ]
        if not prediction_values:
            continue  # TODO: doesn't account for going from 1 active forecast to 0
        geometric_mean = gmean(prediction_values, axis=0)
        predictors = len(prediction_values)
        geometric_means.append(
            AggregationEntry(
                geometric_mean, predictors if predictors > 1 else 0, timestep
            )
        )
    return geometric_means


def get_medians(
    forecasts: list[Forecast | AggregateForecast],
) -> list[AggregationEntry]:
    medians = []
    timesteps: set[float] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time.timestamp())
        if forecast.end_time:
            timesteps.add(forecast.end_time.timestamp())
    for timestep in sorted(timesteps):
        prediction_values = [
            f.get_pmf()
            for f in forecasts
            if f.start_time.timestamp() <= timestep
            and (f.end_time is None or f.end_time.timestamp() > timestep)
        ]
        if not prediction_values:
            continue  # TODO: doesn't account for going from 1 active forecast to 0
        median = np.median(prediction_values, axis=0)
        predictors = len(prediction_values)
        medians.append(
            AggregationEntry(median, predictors if predictors > 1 else 0, timestep)
        )
    return medians


@dataclass
class ForecastScore:
    score: float
    coverage: float = 0.0


def evaluate_forecasts_baseline_accuracy(
    forecasts: list[Forecast | AggregateForecast],
    resolution_bucket: int,
    forecast_horizon_start: float,
    actual_close_time: float,
    forecast_horizon_end: float,
    question_type: str,
    open_bounds_count: int,
) -> list[ForecastScore]:
    total_duration = forecast_horizon_end - forecast_horizon_start
    forecast_scores: list[ForecastScore] = []
    for forecast in forecasts:
        forecast_start = max(forecast.start_time.timestamp(), forecast_horizon_start)
        forecast_end = (
            actual_close_time
            if forecast.end_time is None
            else min(forecast.end_time.timestamp(), actual_close_time)
        )
        forecast_duration = forecast_end - forecast_start
        if forecast_duration <= 0:
            forecast_scores.append(ForecastScore(0))
            continue
        forecast_coverage = forecast_duration / total_duration
        pmf = forecast.get_pmf()
        if question_type in ["binary", "multiple_choice"]:
            forecast_score = (
                100 * np.log(pmf[resolution_bucket] * len(pmf)) / np.log(len(pmf))
            )
        else:
            if resolution_bucket in [0, len(pmf) - 1]:
                baseline = 0.05
            else:
                baseline = (1 - 0.05 * open_bounds_count) / (len(pmf) - 2)
            forecast_score = 100 * np.log(pmf[resolution_bucket] / baseline) / 2
        forecast_scores.append(
            ForecastScore(forecast_score * forecast_coverage, forecast_coverage)
        )

    return forecast_scores


def evaluate_forecasts_baseline_spot_forecast(
    forecasts: list[Forecast | AggregateForecast],
    resolution_bucket: int,
    spot_forecast_timestamp: float,
    question_type: str,
    open_bounds_count: int,
) -> list[ForecastScore]:
    forecast_scores: list[ForecastScore] = []
    for forecast in forecasts:
        start = forecast.start_time.timestamp()
        end = (
            float("inf") if forecast.end_time is None else forecast.end_time.timestamp()
        )
        if start <= spot_forecast_timestamp < end:
            pmf = forecast.get_pmf()
            if question_type in ["binary", "multiple_choice"]:
                forecast_score = (
                    100 * np.log(pmf[resolution_bucket] * len(pmf)) / np.log(len(pmf))
                )
            else:
                if resolution_bucket in [0, len(pmf) - 1]:
                    baseline = 0.05
                else:
                    baseline = (1 - 0.05 * open_bounds_count) / (len(pmf) - 2)
                forecast_score = 100 * np.log(pmf[resolution_bucket] / baseline) / 2
            forecast_scores.append(ForecastScore(forecast_score, 1.0))
        else:
            forecast_scores.append(ForecastScore(0))
    return forecast_scores


def evaluate_forecasts_peer_accuracy(
    forecasts: list[Forecast | AggregateForecast],
    base_forecasts: list[Forecast | AggregateForecast] | None,
    resolution_bucket: int,
    forecast_horizon_start: float,
    actual_close_time: float,
    forecast_horizon_end: float,
    question_type: str,
    geometric_means: list[AggregationEntry] | None = None,
) -> list[ForecastScore]:
    base_forecasts = base_forecasts or forecasts
    geometric_mean_forecasts = geometric_means or get_geometric_means(base_forecasts)
    for gm in geometric_mean_forecasts:
        gm.timestamp = max(gm.timestamp, forecast_horizon_start)
    total_duration = forecast_horizon_end - forecast_horizon_start
    forecast_scores: list[ForecastScore] = []
    for forecast in forecasts:
        forecast_start = max(forecast.start_time.timestamp(), forecast_horizon_start)
        forecast_end = (
            actual_close_time
            if forecast.end_time is None
            else min(forecast.end_time.timestamp(), actual_close_time)
        )
        if (forecast_end - forecast_start) <= 0:
            forecast_scores.append(ForecastScore(0))
            continue

        pmf = forecast.get_pmf()
        interval_scores: list[float | None] = []
        for gm in geometric_mean_forecasts:
            if forecast_start <= gm.timestamp < forecast_end:
                score = (
                    100
                    * (gm.num_forecasters / (gm.num_forecasters - 1))
                    * np.log(pmf[resolution_bucket] / gm.pmf[resolution_bucket])
                )
                if question_type in QUESTION_CONTINUOUS_TYPES:
                    score /= 2
                interval_scores.append(score)
            else:
                interval_scores.append(None)

        forecast_score: float = 0.0
        forecast_coverage: float = 0.0
        times = [
            gm.timestamp
            for gm in geometric_mean_forecasts
            if gm.timestamp < actual_close_time
        ] + [actual_close_time]
        for i in range(len(times) - 1):
            if interval_scores[i] is None:
                continue
            interval_duration = times[i + 1] - times[i]
            forecast_score += interval_scores[i] * interval_duration / total_duration
            forecast_coverage += interval_duration / total_duration
        forecast_scores.append(ForecastScore(forecast_score, forecast_coverage))

    return forecast_scores


def evaluate_forecasts_peer_spot_forecast(
    forecasts: list[Forecast | AggregateForecast],
    base_forecasts: list[Forecast | AggregateForecast] | None,
    resolution_bucket: int,
    spot_forecast_timestamp: float,
    question_type: str,
    geometric_means: list[AggregationEntry] | None = None,
) -> list[ForecastScore]:
    base_forecasts = base_forecasts or forecasts
    geometric_mean_forecasts = geometric_means or get_geometric_means(base_forecasts)
    g = None
    for gm in geometric_mean_forecasts[::-1]:
        if gm.timestamp < spot_forecast_timestamp:
            g = gm.pmf
            break
    if g is None:
        return [ForecastScore(0)] * len(forecasts)

    forecast_scores: list[ForecastScore] = []
    for forecast in forecasts:
        start = forecast.start_time.timestamp()
        end = (
            float("inf") if forecast.end_time is None else forecast.end_time.timestamp()
        )
        if start <= spot_forecast_timestamp < end:
            pmf = forecast.get_pmf()
            forecast_score = (
                100
                * (gm.num_forecasters / (gm.num_forecasters - 1))
                * np.log(pmf[resolution_bucket] / gm.pmf[resolution_bucket])
            )
            if question_type in QUESTION_CONTINUOUS_TYPES:
                forecast_score /= 2
            forecast_scores.append(ForecastScore(forecast_score, 1.0))
        else:
            forecast_scores.append(ForecastScore(0))
    return forecast_scores


def evaluate_forecasts_legacy_relative(
    forecasts: list[Forecast | AggregateForecast],
    base_forecasts: list[Forecast | AggregateForecast],
    resolution_bucket: int,
    forecast_horizon_start: float,
    actual_close_time: float,
) -> list[ForecastScore]:
    baseline_forecasts = [
        AggregationEntry(
            timestamp=max(bf.start_time.timestamp(), forecast_horizon_start),
            pmf=bf.get_pmf(),
            num_forecasters=bf.forecaster_count,
        )
        for bf in base_forecasts
    ]
    total_duration = actual_close_time - forecast_horizon_start
    forecast_scores: list[ForecastScore] = []
    for forecast in forecasts:
        forecast_start = max(forecast.start_time.timestamp(), forecast_horizon_start)
        forecast_end = (
            actual_close_time
            if forecast.end_time is None
            else min(forecast.end_time.timestamp(), actual_close_time)
        )
        if (forecast_end - forecast_start) <= 0:
            forecast_scores.append(ForecastScore(0))
            continue

        pmf = forecast.get_pmf()
        interval_scores: list[float | None] = []
        for bf in baseline_forecasts:
            if forecast_start <= bf.timestamp < forecast_end:
                score = np.log2(pmf[resolution_bucket] / bf.pmf[resolution_bucket])
                interval_scores.append(score)
            else:
                interval_scores.append(None)

        forecast_score: float = 0.0
        forecast_coverage: float = 0.0
        times = [
            bf.timestamp
            for bf in baseline_forecasts
            if bf.timestamp < actual_close_time
        ] + [actual_close_time]
        for i in range(len(times) - 1):
            if interval_scores[i] is None:
                continue
            interval_duration = times[i + 1] - times[i]
            forecast_score += interval_scores[i] * interval_duration / total_duration
            forecast_coverage += interval_duration / total_duration
        forecast_scores.append(ForecastScore(forecast_score, forecast_coverage))

    return forecast_scores


def evaluate_question(
    question: Question,
    resolution_bucket: int | None,
    score_types: list[ScoreTypes],
    spot_forecast_timestamp: float | None = None,
    aggregation_methods: list[AggregationMethod] | None = None,
    score_users: bool | list[int] = True,
) -> list[Score]:
    aggregation_methods = aggregation_methods or []
    aggregations_to_calculate = aggregation_methods.copy()
    if ScoreTypes.RELATIVE_LEGACY in score_types and (
        AggregationMethod.RECENCY_WEIGHTED not in aggregations_to_calculate
    ):
        aggregations_to_calculate.append(AggregationMethod.RECENCY_WEIGHTED)
    if resolution_bucket is None:
        return []
    forecast_horizon_start = question.open_time.timestamp()
    actual_close_time = question.actual_close_time.timestamp()
    forecast_horizon_end = question.scheduled_close_time.timestamp()
    if spot_forecast_timestamp:
        spot_forecast_timestamp = min(spot_forecast_timestamp, actual_close_time)

    # We need all user forecasts to calculated GeoMean even
    # if we're only scoring some or none of the users
    user_forecasts = question.user_forecasts.all()
    if score_users is True:
        scoring_user_forecasts = user_forecasts
    elif not score_users:
        scoring_user_forecasts = Forecast.objects.none()
    else:  # we have a list of user ids to score
        scoring_user_forecasts = user_forecasts.filter(author_id__in=score_users)
    if not question.include_bots_in_aggregates:
        user_forecasts = user_forecasts.exclude(author__is_bot=True)
    aggregations = get_aggregation_history(
        question,
        minimize=False,
        aggregation_methods=aggregations_to_calculate,
        include_bots=question.include_bots_in_aggregates,
        include_stats=False,
    )
    recency_weighted_aggregation = aggregations.get(AggregationMethod.RECENCY_WEIGHTED)
    geometric_means: list[AggregationEntry] = []

    if ScoreTypes.PEER in score_types:
        geometric_means = get_geometric_means(user_forecasts)

    scores: list[Score] = []
    for score_type in score_types:
        aggregation_scores: dict[AggregationMethod, list[Score | ForecastScore]] = (
            dict()
        )
        if score_type == ScoreTypes.BASELINE:
            open_bounds_count = bool(question.open_upper_bound) + bool(
                question.open_lower_bound
            )
            user_scores = evaluate_forecasts_baseline_accuracy(
                scoring_user_forecasts,
                resolution_bucket,
                forecast_horizon_start,
                actual_close_time,
                forecast_horizon_end,
                question.type,
                open_bounds_count,
            )
            for method in aggregation_methods:
                aggregation_forecasts = aggregations[method]
                aggregation_scores[method] = evaluate_forecasts_baseline_accuracy(
                    aggregation_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    open_bounds_count,
                )
        elif score_type == ScoreTypes.SPOT_BASELINE:
            open_bounds_count = bool(question.open_upper_bound) + bool(
                question.open_lower_bound
            )
            user_scores = evaluate_forecasts_baseline_spot_forecast(
                scoring_user_forecasts,
                resolution_bucket,
                spot_forecast_timestamp,
                question.type,
                open_bounds_count,
            )
            for method in aggregation_methods:
                aggregation_forecasts = aggregations[method]
                aggregation_scores[method] = evaluate_forecasts_baseline_spot_forecast(
                    aggregation_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    open_bounds_count,
                )
        elif score_type == ScoreTypes.PEER:
            user_scores = evaluate_forecasts_peer_accuracy(
                scoring_user_forecasts,
                user_forecasts,
                resolution_bucket,
                forecast_horizon_start,
                actual_close_time,
                forecast_horizon_end,
                question.type,
                geometric_means=geometric_means,
            )
            for method in aggregation_methods:
                aggregation_forecasts = aggregations[method]
                aggregation_scores[method] = evaluate_forecasts_peer_accuracy(
                    aggregation_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    geometric_means=geometric_means,
                )
        elif score_type == ScoreTypes.SPOT_PEER:
            user_scores = evaluate_forecasts_peer_spot_forecast(
                scoring_user_forecasts,
                user_forecasts,
                resolution_bucket,
                spot_forecast_timestamp,
                question.type,
                geometric_means=geometric_means,
            )
            for method in aggregation_methods:
                aggregation_forecasts = aggregations[method]
                aggregation_scores[method] = evaluate_forecasts_peer_spot_forecast(
                    aggregation_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    geometric_means=geometric_means,
                )
        elif score_type == ScoreTypes.RELATIVE_LEGACY:
            user_scores = evaluate_forecasts_legacy_relative(
                scoring_user_forecasts,
                recency_weighted_aggregation,
                resolution_bucket,
                forecast_horizon_start,
                actual_close_time,
            )
            for method in aggregation_methods:
                aggregation_forecasts = aggregations[method]
                aggregation_scores[method] = evaluate_forecasts_legacy_relative(
                    aggregation_forecasts,
                    recency_weighted_aggregation,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                )
        else:
            raise NotImplementedError(f"Score type {score_type} not implemented")

        user_ids = {forecast.author_id for forecast in scoring_user_forecasts}
        for user_id in user_ids:
            user_score: float = 0.0
            user_coverage: float = 0.0
            for forecast, score in zip(scoring_user_forecasts, user_scores):
                if forecast.author_id == user_id:
                    user_score += score.score
                    user_coverage += score.coverage
            if user_coverage > 0:
                scores.append(
                    Score(
                        user_id=user_id,
                        score=user_score,
                        coverage=user_coverage,
                        score_type=score_type,
                    )
                )
        for method in aggregation_methods:
            aggregation_score: float = 0.0
            aggregation_coverage: float = 0.0
            community_scores = aggregation_scores[method]
            for score in community_scores:
                aggregation_score += score.score
                aggregation_coverage += score.coverage
            scores.append(
                Score(
                    user=None,
                    aggregation_method=method,
                    score=aggregation_score,
                    coverage=aggregation_coverage,
                    score_type=score_type,
                )
            )
    return scores
