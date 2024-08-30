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
from django.db.models import Q

from questions.models import Question, AggregateForecast
from questions.types import AggregationMethod
from utils.the_math.measures import weighted_percentile_2d, percent_point_function
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
    Percentiles,
)


def get_histogram(values: ForecastValues, weights: Weights | None) -> np.ndarray:
    histogram = np.zeros(100)
    if weights is None:
        weights = np.ones(len(values))
    for value, weight in zip(values, weights):
        histogram[int(value * 100)] += weight
    return histogram


def compute_discrete_forecast_values(
    forecasts_values: ForecastsValues,
    weights: Weights | None = None,
    percentile: float | Percentiles = 50.0,
) -> ForecastsValues:
    forecasts_values = np.array(forecasts_values)
    if isinstance(percentile, float):
        percentile = [percentile]
    if forecasts_values.shape[1] == 2:
        return weighted_percentile_2d(
            forecasts_values, weights=weights, percentiles=percentile
        ).tolist()
    # TODO: this needs to be normalized for MC, but special care needs to be taken
    # if the percentile isn't 50 (namely it needs to be normalized based off the values
    # at the median)
    return weighted_percentile_2d(
        forecasts_values, weights=weights, percentiles=percentile
    ).tolist()


def compute_cp_continuous(
    forecast_values: ForecastsValues,
    weights: Weights | None = None,
) -> ForecastValues:
    return np.average(forecast_values, axis=0, weights=weights).tolist()


@dataclass
class ForecastSet:
    forecasts_values: ForecastsValues
    timestep: datetime


def calculate_aggregation_entry(
    forecast_set: ForecastSet,
    question_type: str,
    weights: Weights,
    include_stats: bool = False,
    histogram: bool = False,
) -> AggregateForecast:
    if question_type in ["binary", "multiple_choice"]:
        aggregation = AggregateForecast(
            forecast_values=compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, 50.0
            )[0]
        )
    else:
        aggregation = AggregateForecast(
            forecast_values=compute_cp_continuous(
                forecast_set.forecasts_values, weights
            )
        )
    if include_stats:
        aggregation.start_time = forecast_set.timestep
        aggregation.forecaster_count = len(forecast_set.forecasts_values)
        if question_type in ["binary", "multiple_choice"]:
            lowers, centers, uppers = compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, [25.0, 50.0, 75.0]
            )
        else:
            lowers, centers, uppers = percent_point_function(
                aggregation.forecast_values, [25.0, 50.0, 75.0]
            )
            lowers = [lowers]
            centers = [centers]
            uppers = [uppers]
        aggregation.interval_lower_bounds = lowers
        aggregation.centers = centers
        aggregation.interval_upper_bounds = uppers
        if question_type in ["binary", "multiple_choice"]:
            aggregation.means = np.average(
                forecast_set.forecasts_values, weights=weights, axis=0
            ).tolist()
    if histogram and question_type == "binary":
        aggregation.histogram = get_histogram(
            [f[1] for f in forecast_set.forecasts_values], weights
        ).tolist()
    return aggregation


def get_aggregation_at_time(
    question: Question,
    time: datetime,
    include_stats: bool = False,
    histogram: bool = False,
    aggregation_method: AggregationMethod = AggregationMethod.RECENCY_WEIGHTED,
    include_bots: bool = False,
) -> AggregateForecast | None:
    """set include_stats to True if you want to include num_forecasters, q1s, medians,
    and q3s"""
    forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=time), start_time__lte=time
    ).order_by("start_time")
    if not include_bots:
        forecasts = forecasts.exclude(forecaster__is_bot=True)
    if forecasts.count() == 0:
        return None
    forecast_set = ForecastSet(
        [forecast.get_prediction_values() for forecast in forecasts],
        timestep=time,
    )
    weights = (
        None
        if aggregation_method == AggregationMethod.UNWEIGHTED
        else generate_recency_weights(len(forecast_set.forecasts_values))
    )
    aggregation_entry = calculate_aggregation_entry(
        forecast_set, question.type, weights, include_stats, histogram
    )
    return aggregation_entry


def filter_between_dates(timestamps, start_time, end_time=None):
    # Use bisect to find the start & end indexes
    start_index = bisect_left(timestamps, start_time)
    end_index = bisect_right(timestamps, end_time) - 1 if end_time else len(timestamps)

    return timestamps[start_index:end_index]


def minimize_history(
    history: list[datetime],
    max_size: int = 128,
) -> list[datetime]:
    if len(history) <= max_size:
        return history

    # this is a pretty cheap algorithm that generates a minimized history
    # by taking the middle time of the list, then the middle
    # of the two halves, then the middle of the four quarters, etc. 7 times,
    # generating a maximum list of 128 datetimes close evenly spaced.

    def find_index_of_middle(forecasts: list[AggregateForecast]) -> int:
        if len(forecasts) < 3:
            return 0
        t0 = forecasts[0]
        t2 = forecasts[-1]
        t1 = t0 + (t2 - t0) / 2
        for i, forecast in enumerate(forecasts):
            if forecast > t1:
                if forecast - t1 < t1 - forecasts[i - 1]:
                    return i
                return i - 1

    minimized = []
    working_lists = [history]
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

    minimized: list[AggregateForecast] = sorted(minimized)
    # make sure to always have the first and last forecast are the first
    # and last of the original list
    if minimized[0] != history[0]:
        minimized.insert(0, history[0])
    if minimized[-1] != history[-1]:
        minimized.append(history[-1])
    return minimized


def get_user_forecast_history(
    question: Question, minimize: bool = False, include_bots: bool = False
) -> list[ForecastSet]:
    forecasts = question.user_forecasts.order_by("start_time").all()
    if not include_bots:
        forecasts.exclude(author__is_bot=True)
    timestamps = set()
    for forecast in forecasts:
        timestamps.add(forecast.start_time)
        if forecast.end_time:
            timestamps.add(forecast.end_time)

    timestamps = sorted(timestamps)
    if minimize:
        timestamps = minimize_history(timestamps)
    output = defaultdict(list)

    for forecast in forecasts:
        # Find active timestamps
        forecast_timestamps = filter_between_dates(
            timestamps, forecast.start_time, forecast.end_time
        )

        for timestamp in forecast_timestamps:
            output[timestamp].append(forecast.get_prediction_values())

    return [ForecastSet(output[key], key) for key in sorted(output.keys())]


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def get_cp_history(
    question: Question,
    aggregation_method: AggregationMethod = AggregationMethod.RECENCY_WEIGHTED,
    minimize: bool = True,
    include_stats: bool = True,
    include_bots: bool = False,
) -> list[AggregateForecast]:
    full_summary: list[AggregateForecast] = []

    forecast_history = get_user_forecast_history(
        question, minimize=minimize, include_bots=include_bots
    )
    for i, forecast_set in enumerate(forecast_history):
        if aggregation_method == AggregationMethod.RECENCY_WEIGHTED:
            weights = generate_recency_weights(len(forecast_set.forecasts_values))
        else:
            weights = None
        histogram = question.type == "binary" and i == (len(forecast_history) - 1)
        new_entry = calculate_aggregation_entry(
            forecast_set,
            question.type,
            weights,
            include_stats=include_stats,
            histogram=histogram,
        )
        new_entry.question = question
        new_entry.method = aggregation_method
        if full_summary:
            # terminate previous entry
            full_summary[-1].end_time = new_entry.start_time
        full_summary.append(new_entry)

    return full_summary
