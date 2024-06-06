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
from questions.models import Forecast, Question, get_actual_location
from collections import defaultdict
import numpy as np
from utils.the_math.measures import weighted_percentile_2d, percent_point_function


class CommunityPrediction:
    forecast_values: list[float]
    lower: float
    upper: float
    middle: float


def compute_cp(
    question_type: str,
    forecast_values: list[list[float]],
    weights: Optional[list[float]],
    percentile: Optional[float] = 50.0,
) -> list[float]:
    if question_type in ["binary", "multiple_choice"]:
        return weighted_percentile_2d(
            forecast_values, weights=weights, percentile=percentile
        ).tolist()
    # TODO: this needs to be normalized for MC, but special care needs to be taken
    # if the percentile isn't 50 (namely it needs to be normalized based off the values
    # at the median)
    else:
        return np.average(forecast_values, axis=0, weights=weights)


@dataclass
class ForecastHistoryEntry:
    forecast_values: list[list[float]]
    at_datetime: datetime


def get_forecast_history(question: Question) -> list[ForecastHistoryEntry]:
    history = []
    forecasts = question.forecast_set.all()
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
                [forecast.get_forecast_values() for forecast in active_forecasts],
                timestep,
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
        weights = generate_recency_weights(len(entry.forecast_values))
        cps.append(
            GraphCP(
                middle=compute_cp(question.type, entry.forecast_values, weights, 50.0)[
                    0
                ],
                upper=compute_cp(question.type, entry.forecast_values, weights, 75.0)[
                    0
                ],
                lower=compute_cp(question.type, entry.forecast_values, weights, 25.0)[
                    0
                ],
                nr_forecasters=len(entry.forecast_values),
                at_datetime=entry.at_datetime,
            )
        )
    return cps


def compute_multiple_choice_plotable_cp(question: Question) -> list[dict[str, GraphCP]]:
    forecast_history = get_forecast_history(question)
    cps = []
    for entry in forecast_history:
        weights = generate_recency_weights(len(entry.forecast_values))
        middles = compute_cp(question.type, entry.forecast_values, weights, 50.0)
        uppers = compute_cp(question.type, entry.forecast_values, weights, 75.0)
        downers = compute_cp(question.type, entry.forecast_values, weights, 25.0)
        cps.append(
            {
                v: GraphCP(
                    middle=middles[i],
                    upper=uppers[i],
                    lower=downers[i],
                    nr_forecasters=len(entry.forecast_values),
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
        weights = generate_recency_weights(len(entry.forecast_values))
        cdf = compute_cp(question.type, entry.forecast_values, weights)

        cps.append(
            GraphCP(
                lower=get_actual_location(question, percent_point_function(cdf, 0.25)),
                middle=get_actual_location(question, percent_point_function(cdf, 0.5)),
                upper=get_actual_location(question, percent_point_function(cdf, 0.75)),
                nr_forecasters=len(entry.forecast_values),
                at_datetime=entry.at_datetime,
            )
        )
    return cps
