from dataclasses import dataclass
from datetime import datetime

import numpy as np
from scipy.stats.mstats import gmean

from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.models import Score
from utils.the_math.aggregations import get_aggregation_history


@dataclass
class AggregationEntry:
    pmf: np.ndarray
    num_forecasters: int
    timestamp: float


def get_geometric_means(
    forecasts: list[Forecast | AggregateForecast],
    include_bots: bool = False,
) -> list[AggregationEntry]:
    included_forecasts = forecasts
    if not include_bots:
        included_forecasts = [
            f
            for f in forecasts
            if (isinstance(f, AggregateForecast) or f.author.is_bot is False)
        ]
    geometric_means = []
    timesteps: set[datetime] = set()
    for forecast in included_forecasts:
        timesteps.add(forecast.start_time.timestamp())
        if forecast.end_time:
            timesteps.add(forecast.end_time.timestamp())
    for timestep in sorted(timesteps):
        prediction_values = [
            f.get_pmf()
            for f in included_forecasts
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
    timesteps: set[datetime] = set()
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
    coverage: float = 0


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
    forecast_scores: list[tuple[float, float]] = []
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
    forecast_scores: list[float] = []
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
    include_bots_in_aggregates: bool = False,
) -> list[ForecastScore]:
    base_forecasts = base_forecasts or forecasts
    geometric_mean_forecasts = geometric_means or get_geometric_means(
        base_forecasts, include_bots_in_aggregates
    )
    for gm in geometric_mean_forecasts:
        gm.timestamp = max(gm.timestamp, forecast_horizon_start)
    total_duration = forecast_horizon_end - forecast_horizon_start
    forecast_scores: list[float] = []
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
                if question_type in ["numeric", "date"]:
                    score /= 2
                interval_scores.append(score)
            else:
                interval_scores.append(None)

        forecast_score = 0
        forecast_coverage = 0
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
    include_bots_in_aggregates: bool = False,
) -> list[ForecastScore]:
    base_forecasts = base_forecasts or forecasts
    geometric_mean_forecasts = geometric_means or get_geometric_means(
        base_forecasts, include_bots_in_aggregates
    )
    g = None
    for gm in geometric_mean_forecasts[::-1]:
        if gm.timestamp < spot_forecast_timestamp:
            g = gm.pmf
            break
    if g is None:
        return [ForecastScore(0)] * len(forecasts)

    forecast_scores: list[float] = []
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
            if question_type in ["numeric", "date"]:
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
    forecast_scores: list[float] = []
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

        forecast_score = 0
        forecast_coverage = 0
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
    resolution_bucket: int,
    score_types: list[Score.ScoreTypes],
    spot_forecast_timestamp: float | None = None,
) -> list[Score]:
    forecast_horizon_start = question.open_time.timestamp()
    actual_close_time = question.actual_close_time.timestamp()
    forecast_horizon_end = question.scheduled_close_time.timestamp()

    user_forecasts = question.user_forecasts.all()
    community_forecasts = get_aggregation_history(
        question,
        minimize=False,
        aggregation_methods=[AggregationMethod.RECENCY_WEIGHTED],
    )[AggregationMethod.RECENCY_WEIGHTED]
    geometric_means: list[AggregationEntry] = []

    ScoreTypes = Score.ScoreTypes
    if ScoreTypes.PEER in score_types:
        geometric_means = get_geometric_means(
            user_forecasts, include_bots=question.include_bots_in_aggregates
        )

    scores: list[Score] = []
    for score_type in score_types:
        match score_type:
            case ScoreTypes.BASELINE:
                open_bounds_count = bool(question.open_upper_bound) + bool(
                    question.open_lower_bound
                )
                user_scores = evaluate_forecasts_baseline_accuracy(
                    user_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    open_bounds_count,
                )
                community_scores = evaluate_forecasts_baseline_accuracy(
                    community_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    open_bounds_count,
                )
            case ScoreTypes.SPOT_BASELINE:
                open_bounds_count = bool(question.open_upper_bound) + bool(
                    question.open_lower_bound
                )
                user_scores = evaluate_forecasts_baseline_spot_forecast(
                    user_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    open_bounds_count,
                )
                community_scores = evaluate_forecasts_baseline_spot_forecast(
                    community_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    open_bounds_count,
                )
            case ScoreTypes.PEER:
                user_scores = evaluate_forecasts_peer_accuracy(
                    user_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    geometric_means=geometric_means,
                )
                community_scores = evaluate_forecasts_peer_accuracy(
                    community_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                    forecast_horizon_end,
                    question.type,
                    geometric_means=geometric_means,
                )
            case ScoreTypes.SPOT_PEER:
                user_scores = evaluate_forecasts_peer_spot_forecast(
                    user_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    geometric_means=geometric_means,
                )
                community_scores = evaluate_forecasts_peer_spot_forecast(
                    community_forecasts,
                    user_forecasts,
                    resolution_bucket,
                    spot_forecast_timestamp,
                    question.type,
                    geometric_means=geometric_means,
                )
            case ScoreTypes.RELATIVE_LEGACY:
                user_scores = evaluate_forecasts_legacy_relative(
                    user_forecasts,
                    community_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                )
                community_scores = evaluate_forecasts_legacy_relative(
                    community_forecasts,
                    community_forecasts,
                    resolution_bucket,
                    forecast_horizon_start,
                    actual_close_time,
                )
            case other:
                raise NotImplementedError(f"Score type {other} not implemented")

        users = {forecast.author for forecast in user_forecasts}
        for user in users:
            user_score = 0
            user_coverage = 0
            for forecast, score in zip(user_forecasts, user_scores):
                if forecast.author == user:
                    user_score += score.score
                    user_coverage += score.coverage
            if user_coverage > 0:
                scores.append(
                    Score(
                        user=user,
                        score=user_score,
                        coverage=user_coverage,
                        score_type=score_type,
                    )
                )
        community_score = 0
        community_coverage = 0
        for score in community_scores:
            community_score += score.score
            community_coverage += score.coverage
        scores.append(
            Score(
                user=None,
                aggregation_method=AggregationMethod.RECENCY_WEIGHTED,
                score=community_score,
                coverage=community_coverage,
                score_type=score_type,
            )
        )
    return scores
