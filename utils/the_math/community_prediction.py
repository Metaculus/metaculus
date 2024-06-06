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
from datetime import datetime
from typing import Optional, Callable
from questions.models import Forecast, Question
from collections import defaultdict
import numpy as np
from utils.the_math.measures import weighted_percentile_2d


@dataclass
class CommunityPrediction:
    pmf: list[float]
    lower: float
    upper: float
    middle: float


def compute_cp_pmf(
    question_type: str,
    pmfs: list[list[float]],
    weights: Optional[list[float]],
    percentile: Optional[float] = 50.0,
) -> list[float]:
    if question_type in ["binary", "multiple_choice"]:
        return weighted_percentile_2d(pmfs, weights=weights, percentile=percentile)
    else:
        return np.average(pmfs, axis=0, weights=weights).tolist()


@dataclass
class ForecastHistoryEntry:
    pmfs: list[list[float]]
    at_datetime: datetime


def get_forecast_history(question: Question) -> list[ForecastHistoryEntry]:
    history = []
    forecasts = Forecast.objects.filter(question=question).all()
    timesteps: set[datetime] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            timesteps.add(forecast.end_time)
    for timestep in sorted(timesteps):
        active_forecasts = [
            f
            for f in forecasts
            if f.start_time <= timestep
            and (f.end_time is None or f.end_time >= timestep)
        ]
        if len(active_forecasts) < 1:
            continue
        history.append(
            ForecastHistoryEntry(
                [forecast.get_pmf() for forecast in active_forecasts], timestep
            )
        )
    return history


@dataclass
class GraphCP:
    middle: float
    lower: float
    upper: float
    nr_forecasters: int
    at_datetime: datetime


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def compute_binary_plotable_cp(question: Question) -> list[GraphCP]:
    forecast_history = get_forecast_history(question)
    cps = []
    for entry in forecast_history:
        print(entry)
        weights = generate_recency_weights(len(entry.pmfs))
        cps.append(
            GraphCP(
                middle=compute_cp_pmf(question.type, entry.pmfs, weights, 50.0)[0],
                upper=compute_cp_pmf(question.type, entry.pmfs, weights, 75.0)[0],
                lower=compute_cp_pmf(question.type, entry.pmfs, weights, 25.0)[0],
                nr_forecasters=len(entry.pmfs),
                at_datetime=entry.at_datetime,
            )
        )
    return cps


def compute_multiple_choice_plotable_cp(question: Question) -> list[dict[str, GraphCP]]:
    forecast_history = get_forecast_history(question)
    cps = []
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.pmfs))
        middles = compute_cp_pmf(question.type, entry.pmfs, weights, 50.0)
        uppers = compute_cp_pmf(question.type, entry.pmfs, weights, 75.0)
        downers = compute_cp_pmf(question.type, entry.pmfs, weights, 25.0)
        cps.append(
            {
                v: GraphCP(
                    middle=middles[i],
                    upper=uppers[i],
                    lower=downers[i],
                    nr_forecasters=len(entry.pmfs),
                    at_datetime=entry.at_datetime,
                )
                for i, v in enumerate(question.options)
            }
        )
    return cps


def compute_continuous_plotable_cp(question: Question) -> int:
    forecast_history = get_forecast_history(question)
    cps = []
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.pmfs))
        averages = compute_cp_pmf(question.type, entry.pmfs, weights)

        # TODO @Luke compute the bins using the zero_point
        step = (question.max - question.min) / 200
        bin_vals = [question.min + step * i for i in range(200)]

        cumulative_probability = np.cumsum(averages)

        cps.append(
            GraphCP(
                middle=bin_vals[
                    np.searchsorted(cumulative_probability, 0.5, side="right")
                ],
                upper=bin_vals[
                    np.searchsorted(cumulative_probability, 0.75, side="right")
                ],
                lower=bin_vals[
                    np.searchsorted(cumulative_probability, 0.25, side="right")
                ],
                nr_forecasters=len(entry.pmfs),
                at_datetime=entry.at_datetime,
            )
        )
    return cps
