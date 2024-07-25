"""
Ftr, the general shape of the aggregation is:
Everytime a new prediction is made, take the latest prediction of each user.
For each of those users, compute a reputation weight and a recency weight, 
then combine them to get a weight for the user's prediction.
Transform the predictions to logodds.
For each possible outcome, take the weighted average of all user-prediction logodds.
Transform back to probabilities.
Normalise to 1 over all outcomes.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
from django.core.cache import cache
from django.db.models import Q

import numpy as np

from django.db.models import QuerySet
from questions.models import Forecast, Question
from utils.the_math.formulas import get_scaled_quartiles_from_cdf
from utils.the_math.measures import weighted_percentile_2d


class CommunityPrediction:
    forecast_values: list[float]
    q1: float
    q3: float
    median: float


def compute_cp_discrete(
    forecast_values: list[list[float]],
    weights: list[float] | None = None,
    percentile: float = 50.0,
):
    return weighted_percentile_2d(
        forecast_values, weights=weights, percentile=percentile
    ).tolist()
    # TODO: this needs to be normalized for MC, but special care needs to be taken
    # if the percentile isn't 50 (namely it needs to be normalized based off the values
    # at the median)


def compute_cp_continuous(
    forecast_values: list[list[float]],
    weights: list[float] | None = None,
):
    # max_len = max([len(x) for x in forecast_values])
    # for i in range(len(forecast_values)):
    #    if len(forecast_values[i]) < max_len:
    #        forecast_values[i].extend([0] * int(max_len - len(forecast_values[i])))
    return np.average(forecast_values, axis=0, weights=weights)


def get_cp_at_time(question: Question, time: datetime) -> list[float] | None:
    forecasts = question.forecast_set.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=time), start_time__lte=time
    )
    if forecasts.count() == 0:
        return None
    forecast_values = [forecast.get_prediction_values() for forecast in forecasts]
    weights = generate_recency_weights(len(forecast_values))
    if question.type in ["binary", "multiple_choice"]:
        return compute_cp_discrete(forecast_values, weights, 50.0)
    else:
        return compute_cp_continuous(forecast_values, weights)


@dataclass
class ForecastHistoryEntry:
    predictions: list[list[float]]
    at_datetime: datetime


def get_forecast_history(question: Question) -> list[ForecastHistoryEntry]:
    forecasts: QuerySet[Forecast] = question.forecast_set.all()
    timesteps: set[datetime] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            timesteps.add(forecast.end_time)

    reversed_sorted_timesteps = sorted(timesteps, reverse=True)
    if len(reversed_sorted_timesteps) == 0:
        return []
    cache_key = f"forecast_history-{question.id}"
    cached_history = cache.get(cache_key)
    if cached_history:
        history = cached_history["history"]
        last_timestep = cached_history["last_timestep"]
    else:
        history = []
        last_timestep = None

    for timestep in reversed_sorted_timesteps:
        if last_timestep and timestep <= last_timestep:
            break
        active_forecasts = [
            f
            for f in forecasts
            if f.start_time <= timestep
            and (f.end_time is None or f.end_time > timestep)
        ]
        if len(active_forecasts) < 1:
            continue
        fhe = ForecastHistoryEntry(
            [forecast.get_prediction_values() for forecast in active_forecasts],
            timestep,
        )
        history.append(fhe)

    if (
        not last_timestep
        or reversed_sorted_timesteps[0] - last_timestep > timedelta(hours=12)
    ) and reversed_sorted_timesteps:
        cache.set(
            cache_key,
            {
                "history": history,
                "last_timestep": reversed_sorted_timesteps[0],
            },
            timeout=None,
        )

    return list(reversed(history))


@dataclass
class GraphCP:
    median: float
    q1: float
    q3: float
    nr_forecasters: int
    at_datetime: datetime


def truncate_forecast_history(
    forecast_history: list[ForecastHistoryEntry], max_length: int
) -> list[ForecastHistoryEntry]:
    # @TODO Luke should we be doing this ? I think so, plotting 4-5k datapoints is also going to make the FE very slow and nobody scrolls through that many *BUT* we should probably truncate at even timestamps
    if len(forecast_history) > max_length:
        forecast_history = (
            forecast_history[:5]
            + [
                x
                for i, x in enumerate(forecast_history[5:-5])
                if i % max(1, int(len(forecast_history) / max_length - 10)) == 0
            ]
            + forecast_history[-5:]
        )
    return forecast_history


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def compute_binary_plotable_cp(
    question: Question, max_length: Optional[int] = None
) -> list[GraphCP]:
    forecast_history = get_forecast_history(question)
    if max_length:
        forecast_history = truncate_forecast_history(forecast_history, max_length)
    cps = []
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.predictions))
        cps.append(
            GraphCP(
                median=compute_cp_discrete(entry.predictions, weights, 50.0)[1],
                q3=compute_cp_discrete(entry.predictions, weights, 75.0)[1],
                q1=compute_cp_discrete(entry.predictions, weights, 25.0)[1],
                nr_forecasters=len(entry.predictions),
                at_datetime=entry.at_datetime,
            )
        )
    return cps


def compute_multiple_choice_plotable_cp(
    question: Question, max_length: Optional[int] = None
) -> list[dict[str, GraphCP]]:
    forecast_history = get_forecast_history(question)
    if max_length:
        forecast_history = truncate_forecast_history(forecast_history, max_length)
    cps = []
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.predictions))
        medians = compute_cp_discrete(entry.predictions, weights, 50.0)
        q3s = compute_cp_discrete(entry.predictions, weights, 75.0)
        downers = compute_cp_discrete(entry.predictions, weights, 25.0)
        cps.append(
            {
                v: GraphCP(
                    median=medians[i],
                    q3=q3s[i],
                    q1=downers[i],
                    nr_forecasters=len(entry.predictions),
                    at_datetime=entry.at_datetime,
                )
                for i, v in enumerate(question.options)
            }
        )
    return cps


def compute_continuous_plotable_cp(
    question: Question, max_length: Optional[int] = None
) -> int:
    forecast_history = get_forecast_history(question)
    if max_length:
        forecast_history = truncate_forecast_history(forecast_history, max_length)
    cps = []
    cdf = None
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.predictions))
        cdf = compute_cp_continuous(entry.predictions, weights)
        q1, median, q3 = get_scaled_quartiles_from_cdf(cdf, question)

        cps.append(
            GraphCP(
                q1=q1,
                median=median,
                q3=q3,
                nr_forecasters=len(entry.predictions),
                at_datetime=entry.at_datetime,
            )
        )
    return cps, cdf
