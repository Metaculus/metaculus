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

from bisect import bisect_left, bisect_right
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

import numpy as np
from django.db.models import Q, QuerySet

from questions.models import Question, Forecast, AggregateForecast
from questions.types import AggregationMethod
from scoring.reputation import (
    get_reputations_at_time,
    get_reputations_during_interval,
    Reputation,
)
from users.models import User
from utils.the_math.measures import percent_point_function
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
)


def get_histogram(values: ForecastValues, weights: Weights | None) -> np.ndarray:
    histogram = np.zeros(100)
    if weights is None:
        weights = np.ones(len(values))
    for value, weight in zip(values, weights):
        histogram[int(value * 100)] += weight
    return histogram


def compute_forecast_values(
    forecasts_values: ForecastsValues,
    weights: Weights | None = None,
) -> ForecastsValues:
    return np.average(forecasts_values, axis=0, weights=weights).tolist()


@dataclass
class ForecastSet:
    forecasts_values: ForecastsValues
    timestep: datetime
    users: list[User] = list
    timesteps: list[datetime] = list


def calculate_aggregation_entry(
    forecast_set: ForecastSet,
    question_type: str,
    weights: Weights,
    include_stats: bool = False,
    histogram: bool = False,
) -> AggregateForecast:
    aggregation = AggregateForecast(
        forecast_values=compute_forecast_values(forecast_set.forecasts_values, weights)
    )
    weights = np.array(weights)
    if include_stats:
        forecasts_values = np.array(forecast_set.forecasts_values)
        aggregation.start_time = forecast_set.timestep
        aggregation.forecaster_count = len(forecasts_values)
        if question_type in ["binary", "multiple_choice"]:
            # lower and upper "quartiles" are calculated by weighted semivariances
            # Note: these would no longer be quartiles / medians...
            lower_mask = forecasts_values[:, 1] < aggregation.forecast_values[1]
            if not any(lower_mask):
                aggregation.interval_lower_bounds = aggregation.forecast_values
            else:
                aggregation.interval_lower_bounds = (
                    aggregation.forecast_values
                    - np.sqrt(
                        np.average(
                            (forecasts_values[lower_mask] - aggregation.forecast_values)
                            ** 2,
                            weights=weights[lower_mask],
                            axis=0,
                        )
                    )
                ).tolist()
            aggregation.centers = aggregation.forecast_values
            upper_mask = forecasts_values[:, 1] > aggregation.forecast_values[1]
            if not any(upper_mask):
                aggregation.interval_upper_bounds = aggregation.forecast_values
            else:
                aggregation.interval_upper_bounds = (
                    aggregation.forecast_values
                    + np.sqrt(
                        np.average(
                            (forecasts_values[upper_mask] - aggregation.forecast_values)
                            ** 2,
                            weights=weights[upper_mask],
                            axis=0,
                        )
                    )
                ).tolist()

        else:
            lowers, centers, uppers = percent_point_function(
                aggregation.forecast_values, [25.0, 50.0, 75.0]
            )
            aggregation.interval_lower_bounds = [lowers]
            aggregation.centers = [centers]
            aggregation.interval_upper_bounds = [uppers]
        aggregation.means = aggregation.forecast_values
    if histogram and question_type == "binary":
        aggregation.histogram = get_histogram(forecasts_values[:, 1], weights).tolist()
    return aggregation


def get_decays(
    start_times: list[datetime],
    time: datetime,
    open_time: datetime,
    close_time: datetime,
) -> Weights:
    decays = []
    for start_time in start_times:
        decays.append(np.exp(-(time - start_time) / (close_time - open_time)))
    return decays


def calculate_weights_at_time(
    forecasts: list[Forecast],
    time: datetime,
    open_time: datetime,
    close_time: datetime,
) -> Weights:
    # TODO: make these learned parameters
    a = 0.5
    b = 6.0
    users = [forecast.author for forecast in forecasts]
    reputations = get_reputations_at_time(users, time)
    decays = get_decays([f.start_time for f in forecasts], time, open_time, close_time)
    weights = []
    for decay, reputation in zip(decays, reputations):
        weights.append((decay**a * reputation.value ** (1 - a)) ** b)
    return weights


def calculate_weights(
    forecast_set: ForecastSet,
    reputations: list[Reputation],
    open_time: datetime,
    close_time: datetime,
) -> Weights:
    # TODO: make these learned parameters
    a = 0.5
    b = 6.0
    decays = get_decays(
        forecast_set.timesteps, forecast_set.timestep, open_time, close_time
    )
    weights = []
    for decay, reputation in zip(decays, reputations):
        weights.append((decay**a * reputation.value ** (1 - a)) ** b)
    return weights


def get_aggregation_at_time(
    question: Question,
    time: datetime,
    include_stats: bool = False,
    histogram: bool = False,
) -> AggregateForecast | None:
    """set include_stats to True if you want to include num_forecasters, q1s, medians,
    and q3s"""
    forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=time), start_time__lte=time
    ).order_by("-start_time")
    if forecasts.count() == 0:
        return None
    forecast_set = ForecastSet(
        [forecast.get_prediction_values() for forecast in forecasts],
        timestep=time,
    )
    weights = calculate_weights_at_time(
        forecasts, time, question.open_time, question.scheduled_close_time
    )
    aggregation_entry = calculate_aggregation_entry(
        forecast_set, question.type, weights, include_stats
    )
    if histogram and question.type == "binary":
        aggregation_entry.histogram = get_histogram(
            [f[1] for f in forecast_set.forecasts_values], weights
        )
    return aggregation_entry


def filter_between_dates(timestamps, start_time, end_time=None):
    # Use bisect to find the start & end indexes
    start_index = bisect_left(timestamps, start_time)
    end_index = bisect_right(timestamps, end_time) - 1 if end_time else len(timestamps)

    return timestamps[start_index:end_index]


def get_user_forecast_history(
    forecasts: QuerySet[Forecast],
) -> list[ForecastSet]:
    timestamps = set()
    for forecast in forecasts:
        timestamps.add(forecast.start_time)
        if forecast.end_time:
            timestamps.add(forecast.end_time)

    timestamps = sorted(timestamps)
    prediction_values = defaultdict(list)
    users = defaultdict(list)
    timesteps = defaultdict(list)

    for forecast in forecasts:
        # Find active timestamps
        forecast_timestamps = filter_between_dates(
            timestamps, forecast.start_time, forecast.end_time
        )

        for timestamp in forecast_timestamps:
            prediction_values[timestamp].append((forecast.get_prediction_values()))
            users[timestamp].append(forecast.author)
            timesteps[timestamp].append(forecast.start_time)

    return [
        ForecastSet(prediction_values[key], key, users[key], timesteps[key])
        for key in sorted(prediction_values.keys())
    ]


def minimize_forecast_history(
    forecast_history: list[AggregateForecast],
    max_size: int = 128,
) -> list[AggregateForecast]:
    if len(forecast_history) <= max_size:
        return forecast_history

    # this is a pretty cheap algorithm that generates a minimized forecast history
    # by taking the middle (wrt start_time) forecast of the list, then the middle
    # of the two halves, then the middle of the four quarters, etc. 7 times,
    # generating a maximum list of 128 forecasts close evenly spaced.

    def find_index_of_middle(forecasts: list[AggregateForecast]) -> int:
        if len(forecasts) < 3:
            return 0
        t0 = forecasts[0].start_time
        t2 = forecasts[-1].start_time
        t1 = t0 + (t2 - t0) / 2
        for i, forecast in enumerate(forecasts):
            if forecast.start_time > t1:
                if forecast.start_time - t1 < t1 - forecasts[i - 1].start_time:
                    return i
                return i - 1

    minimized: list[AggregateForecast] = []
    working_lists = [forecast_history]
    for _ in range(int(np.ceil(np.log2(max_size)))):
        new_working_lists = []
        for working_list in working_lists:
            middle_index = find_index_of_middle(working_list)
            if middle_index == 0:
                minimized.append(working_list[0])
                continue
            minimized.append(working_list[middle_index])
            new_working_lists.append(working_list[:middle_index])
            new_working_lists.append(working_list[middle_index + 1 :])
        working_lists = new_working_lists

    minimized = sorted(minimized, key=lambda x: x.start_time)
    # make sure to always have the first and last forecast are the first
    # and last of the original list
    if minimized[0].start_time != forecast_history[0].start_time:
        minimized.insert(0, forecast_history[0])
    if minimized[-1].start_time != forecast_history[-1].start_time:
        minimized.append(forecast_history[-1])
    return minimized


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def get_single_aggregation_history(
    question: Question,
    minimize: bool = True,
    include_stats: bool = True,
) -> list[AggregateForecast]:
    full_summary: list[AggregateForecast] = []

    user_forecasts = question.user_forecasts.all()
    user_forecast_history = get_user_forecast_history(user_forecasts)
    users = list(set(forecast.author for forecast in user_forecasts))
    reputations = get_reputations_during_interval(
        users, question.open_time, question.scheduled_close_time
    )
    for i, forecast_set in enumerate(user_forecast_history):
        reps = []
        # assume forecast_set.users is ordered the same as foreacst_set.forecasts_values
        for user in forecast_set.users:
            user_reps = reputations[user]
            for rep in user_reps[::-1]:
                if rep.time <= forecast_set.timestep:
                    reps.append(rep)
                    break
        weights = calculate_weights(
            forecast_set, reps, question.open_time, question.scheduled_close_time
        )
        histogram = question.type == "binary" and i == (len(user_forecast_history) - 1)
        new_entry = calculate_aggregation_entry(
            forecast_set,
            question.type,
            weights,
            include_stats=include_stats,
            histogram=histogram,
        )
        new_entry.question = question
        new_entry.method = AggregationMethod.SINGLE_AGGREGATION
        if full_summary:
            # terminate previous entry
            full_summary[-1].end_time = new_entry.start_time
        full_summary.append(new_entry)

    if minimize:
        return minimize_forecast_history(full_summary)
    return full_summary
