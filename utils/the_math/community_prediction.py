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

from datetime import datetime
from typing import Optional, Callable
from questions.models import Forecast, Question
from collections import defaultdict
import numpy as np
from utils.the_math.measures import weighted_percentile_2d


def latest_forecasts_at(
    forecasts: list[Forecast], at_datetime: Optional[datetime]
) -> int:
    if at_datetime:
        forecasts = [f for f in forecasts if f.start_time <= at_datetime]

    user_latest_forecasts = defaultdict(lambda: None)
    for forecast in forecasts:
        if (
            user_latest_forecasts[forecast.author_id] is None
            or forecast.start_time
            > user_latest_forecasts[forecast.author_id].start_time
        ):
            user_latest_forecasts[forecast.author_id] = forecast

    return list(user_latest_forecasts.values())


def compute_binary_cp(
    forecasts: list[Forecast], at_datetime: Optional[datetime]
) -> int:
    forecasts = latest_forecasts_at(forecasts, at_datetime)
    if len(forecasts) == 0:
        return None
    probabilities = [x.probability_yes for x in forecasts]
    return {
        "mean": np.quantile(probabilities, 0.5),
        "max": np.quantile(probabilities, 0.75),
        "min": np.quantile(probabilities, 0.25),
        "nr_forecasters": len(forecasts),
    }


def compute_multiple_choice_cp(
    question: Question, forecasts: list[Forecast], at_datetime: Optional[datetime]
) -> int:
    forecasts = latest_forecasts_at(forecasts, at_datetime)
    if len(forecasts) == 0:
        return None
    data = {x: [] for x in question.options}
    for f in forecasts:
        for i, prob in enumerate(f.probability_yes_per_category):
            data[question.options[i]].append(prob["probability"])
    for k in data:
        data[k] = {
            "mean": np.quantile(data[k], 0.5),
            "nr_forecasters": len(data[k]),
        }
    sum_medians = np.sum([x["mean"] for x in data.values()])
    for k in list(data.keys()):
        data[k]["mean"] = data[k]["mean"] / sum_medians
        data["nr_forecasters"] = data[k]["nr_forecasters"]
        del data[k]["nr_forecasters"]
    return data


def compute_continuous_cp(
    question: Question, forecasts: list[Forecast], at_datetime: Optional[datetime]
) -> int:
    forecasts = latest_forecasts_at(forecasts, at_datetime)
    if len(forecasts) == 0:
        return None

    predictions = np.array([f.continuous_prediction_values for f in forecasts])
    forecasts_per_bin = np.mean(predictions, axis=0)

    # TODO: Associate bins with numbers
    step = (question.max - question.min) / 200
    bin_vals = [question.min + step * i for i in range(200)]

    cumulative_probability = np.cumsum(forecasts_per_bin)

    # Find the indices where the cumulative probability crosses the thresholds
    min = bin_vals[np.searchsorted(cumulative_probability, 0.25, side="right")]
    mean = bin_vals[np.searchsorted(cumulative_probability, 0.5, side="right")]
    max = bin_vals[np.searchsorted(cumulative_probability, 0.75, side="right")]

    return {
        "mean": mean,
        "max": max,
        "min": min,
        "nr_forecasters": len(forecasts),
    }


def aggregate_pmfs_median(pmfs: list[list[float]], weights: list[float]) -> list[float]:
    pmf = weighted_percentile_2d(pmfs, weights=weights, percentile=50.0)
    return (pmf / np.sum(pmf)).tolist()


def aggregate_pmfs_mean(pmfs: list[list[float]], weights: list[float]) -> list[float]:
    return np.average(pmfs, axis=0, weights=weights).tolist()


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray | None:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def compute_pmf_at_time(
    forecasts: list[Forecast],
    time: datetime,
    aggregation_method: Callable,
    weighting_method: Callable = lambda x: None,
) -> list[float] | None:
    active_forecasts: list[Forecast] = []
    for forecast in forecasts:
        if forecast.start_time <= time and (
            forecast.end_time is None or forecast.end_time > time
        ):
            active_forecasts.append(forecast)
    if len(active_forecasts) == 0:
        return None
    weights = weighting_method(len(active_forecasts))
    pmfs = [f.get_pmf() for f in active_forecasts]
    return aggregation_method(pmfs, weights)


def compute_history(
    forecasts: list[Forecast],
    aggregation_method: Callable,
    weighting_method: Callable = lambda x: None,
) -> list[tuple[float, datetime]]:

    if len(forecasts) == 0:
        # no forecasts to aggregate
        return []

    timesteps: set[datetime] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            timesteps.add(forecast.end_time)

    ordered_timesteps = sorted(timesteps)
    forecast_history = []
    for timestep in ordered_timesteps:
        aggregated_pmf = compute_pmf_at_time(
            forecasts, timestep, aggregation_method, weighting_method
        )
        forecast_history.append((aggregated_pmf, timestep))


# suggestion: this all below should move to the Question app


def compute_binary_aggregation_history(
    forecasts: list[Forecast],
) -> list[tuple[float, datetime]]:
    return compute_history(forecasts, aggregate_pmfs_median, generate_recency_weights)


def compute_multiple_choice_aggregation_history(
    forecasts: list[Forecast],
) -> list[tuple[float, datetime]]:
    return compute_history(forecasts, aggregate_pmfs_median, generate_recency_weights)


def compute_continuous_aggregation_history(
    forecasts: list[Forecast],
) -> list[tuple[float, datetime]]:
    return compute_history(forecasts, aggregate_pmfs_mean, generate_recency_weights)


def compute_aggregation_history(question: Question):
    forecasts = Forecast.objects.filter(question=question)
    if question.type == "binary":
        return compute_binary_aggregation_history(forecasts)
    elif question.type == "multiple_choice":
        return compute_multiple_choice_aggregation_history(forecasts)
    elif question.type == "continuous":
        return compute_continuous_aggregation_history(forecasts)
    else:
        raise ValueError(f"Unknown question type: {question.type}")
