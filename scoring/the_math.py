import numpy as np
from scipy.stats.mstats import gmean
from datetime import datetime

from questions.models import Forecast, Question
from scoring.models import Score, LeaderboardEntry
from utils.the_math.community_prediction import ForecastHistoryEntry


def get_geometric_means(forecasts: list[Forecast]) -> list[tuple[np.ndarray, datetime]]:
    geometric_means = []
    timesteps: set[datetime] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            timesteps.add(forecast.end_time)
    for timestep in sorted(timesteps):
        prediction_values = [
            f.get_prediction_values()
            for f in forecasts
            if f.start_time <= timestep
            and (f.end_time is None or f.end_time >= timestep)
        ]
        if not prediction_values:
            continue  # TODO: doesn't account for going from 1 active forecast to 0
        geometric_mean = gmean(prediction_values, axis=0)
        geometric_means.append((geometric_mean, timestep))
    return geometric_means


def evaluate_forecasts_baseline_accuracy(
    forecasts: list[Forecast],
    resolution_bucket: int,
    window_start: float,
    window_end: float,
    question_type: str,
    open_bounds_count: int,
) -> list[float]:
    total_duration = window_end - window_start
    forecast_scores: list[float] = []
    for forecast in forecasts:
        forecast_start = max(forecast.start_time.timestamp(), window_start)
        if forecast.end_time:
            forecast_end = min(forecast.end_time.timestamp(), window_end)
        else:
            forecast_end = window_end
        forecast_duration = forecast_end - forecast_start
        if not forecast_duration:
            forecast_scores.append(0)
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
            forecast_score = 100 * np.log(pmf[resolution_bucket] * baseline) / 2
        forecast_scores.append(forecast_score * forecast_coverage)

    return forecast_scores


def evaluate_forecasts_baseline_spot_forecast(
    forecasts: list[Forecast],
    resolution_bucket: int,
    spot_forecast_timestamp: float,
    question_type: str,
    open_bounds_count: int,
) -> list[float]:
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
                forecast_score = 100 * np.log(pmf[resolution_bucket] * baseline) / 2
            forecast_scores.append(forecast_score)
        else:
            forecast_scores.append(0)
    return forecast_scores


def evaluate_forecasts_peer_accuracy(
    forecasts: list[Forecast],
    resolution_bucket: int,
    window_start: float,
    window_end: float,
    question_type: str,
) -> list[float]:
    geometric_means = get_geometric_means(forecasts)
    total_duration = window_end - window_start
    forecast_scores: list[float] = []
    for forecast in forecasts:
        forecast_start = max(forecast.start_time.timestamp(), window_start)
        if forecast.end_time:
            forecast_end = min(forecast.end_time.timestamp(), window_end)
        else:
            forecast_end = window_end
        if (forecast_end - forecast_start) <= 0:
            forecast_scores.append(0)
            continue

        pmf = forecast.get_pmf()
        interval_scores = []
        for g, t in geometric_means:
            if forecast_start <= t < forecast_end:
                score = 100 * np.log(pmf[resolution_bucket] * g[resolution_bucket])
                if question_type in ["binary", "multiple_choice"]:
                    score /= np.log(len(pmf))
                else:
                    score /= 2
                interval_scores.append(score)
            else:
                interval_scores.append(0)

        forecast_score = 0
        times = [t for _, t in geometric_means]
        for i in range(len(times) - 1):
            interval_duration = times[i + 1] - times[i]
            forecast_score += interval_scores[i] * interval_duration / total_duration
        forecast_scores.append(forecast_score)

    return forecast_scores


def evaluate_forecasts_peer_spot_forecast(
    forecasts: list[Forecast],
    resolution_bucket: int,
    spot_forecast_timestamp: float,
    question_type: str,
) -> list[float]:
    geometric_mean_forecasts = get_geometric_means(forecasts)
    g = None
    for gm, t in geometric_mean_forecasts[::-1]:
        if t < spot_forecast_timestamp:
            g = gm
            break
    if g is None:
        return [0] * len(forecasts)

    forecast_scores: list[float] = []
    for forecast in forecasts:
        start = forecast.start_time.timestamp()
        end = (
            float("inf") if forecast.end_time is None else forecast.end_time.timestamp()
        )
        if start <= spot_forecast_timestamp < end:
            pmf = forecast.get_pmf()
            forecast_score = 100 * np.log(pmf[resolution_bucket] * g[resolution_bucket])
            if question_type in ["binary", "multiple_choice"]:
                forecast_score /= np.log(len(pmf))
            else:
                forecast_score /= 2
            forecast_scores.append(forecast_score)
        else:
            forecast_scores.append(0)
    return forecast_scores


def evaluate_question(
    question: Question,
    resolution_bucket: int,  # TODO: make this a nominal resolution and interpret it
    score_type: str,
    spot_forecast_timestamp: float | None = None,
) -> list[Score]:
    window_start = question.published_at.timestamp()
    window_end = question.closed_at.timestamp()

    forecasts = question.forecast_set.all()

    score_types = LeaderboardEntry.LeaderboardType
    match score_type:
        case score_types.BASELINE_ACCURACY:
            open_bounds_count = bool(question.open_upper_bound) + bool(
                question.open_lower_bound
            )
            forecast_scores = evaluate_forecasts_baseline_accuracy(
                forecasts,
                resolution_bucket,
                window_start,
                window_end,
                question.type,
                open_bounds_count,
            )
        case score_types.BASELINE_SPOT_FORECAST:
            open_bounds_count = bool(question.open_upper_bound) + bool(
                question.open_lower_bound
            )
            forecast_scores = evaluate_forecasts_baseline_spot_forecast(
                forecasts,
                resolution_bucket,
                spot_forecast_timestamp,
                question.type,
                open_bounds_count,
            )
        case score_types.PEER_ACCURACY:
            scores = evaluate_forecasts_peer_accuracy(
                forecasts,
                resolution_bucket,
                window_start,
                window_end,
                question.type,
            )
        case score_types.PEER_SPOT_FORECAST:
            open_bounds_count = bool(question.open_upper_bound) + bool(
                question.open_lower_bound
            )
            forecast_scores = evaluate_forecasts_peer_spot_forecast(
                forecasts,
                resolution_bucket,
                spot_forecast_timestamp,
                question.type,
            )
        # case score_types.METACULUS_POINTS:
        #     scores = evaluate_forecasts_metaculus_points(forecasts)
        case other:
            raise NotImplementedError(f"Score type {other} not implemented")

    scores: list[Score] = []
    users = {forecast.author for forecast in forecasts}
    for user in users:
        user_score = 0
        for forecast, score in zip(forecasts, forecast_scores):
            if forecast.author == user:
                user_score += score
        scores.append(Score(user=user, score=user_score, score_type=score_type))
    return scores
