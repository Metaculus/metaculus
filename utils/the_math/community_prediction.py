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
from datetime import datetime, timezone as dt_timezone

import numpy as np
from django.db.models import Q, TextChoices

from questions.models import Question, CDF_SIZE
from utils.the_math.measures import weighted_percentile_2d, percent_point_function
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
    Percentiles,
)


class AggregationMethod(TextChoices):
    RECENCY_WEIGHTED = "recency_weighted"
    UNWEIGHTED = "unweighted"


@dataclass
class AggregationEntry:
    forecast_values: ForecastValues | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    num_forecasters: int | None = None
    q1s: Percentiles | None = None
    medians: Percentiles | None = None
    q3s: Percentiles | None = None
    means: Percentiles | None = None
    histogram: np.ndarray | None = None

    @property
    def continuous_cdf(self) -> list[float] | None:
        if not len(self.forecast_values):
            raise ValueError("No forecast values")
        if len(self.forecast_values) == CDF_SIZE:
            return self.forecast_values

    @property
    def probability_yes(self) -> float | None:
        if not len(self.forecast_values):
            raise ValueError("No forecast values")
        if len(self.forecast_values) == 2:
            return self.forecast_values[1]

    @property
    def probability_yes_per_category(self) -> list[float] | None:
        if not len(self.forecast_values):
            raise ValueError("No forecast values")
        if len(self.forecast_values) > 2:
            return self.forecast_values

    def get_prediction_values(self) -> list[float]:
        if not len(self.forecast_values):
            raise ValueError("No forecast values")
        return self.forecast_values

    def get_pmf(self) -> ForecastValues:
        if not len(self.forecast_values):
            raise ValueError("No forecast values")
        if (cdf := self.continuous_cdf) is not None:
            pmf = [cdf[0]]
            for i in range(1, len(cdf)):
                pmf.append(cdf[i] - cdf[i - 1])
            return pmf
        return self.forecast_values

    @classmethod
    def from_question(cls, question: Question) -> list["AggregationEntry"]:
        """returns a list of aggregation entries from a question's composed_forecasts"""
        composed_forecasts = question.composed_forecasts
        aggregation_history: list[AggregationEntry] = []
        for i in range(len(composed_forecasts["timestamps"])):
            start_time = datetime.fromtimestamp(
                composed_forecasts["timestamps"][i], tz=dt_timezone.utc
            )
            num_forecasters = composed_forecasts["nr_forecasters"][i]
            forecast_values = composed_forecasts["forecast_values"][i]
            if question.type == "binary":
                q1 = composed_forecasts["q1s"][i]
                median = composed_forecasts["medians"][i]
                q3 = composed_forecasts["q3s"][i]
                q1s = [1 - q1, q1]
                medians = [1 - median, median]
                q3s = [1 - q3, q3]
            elif question.type == "multiple_choice":
                q1s = []
                medians = []
                q3s = []
                for label in question.options:
                    q1s.append(composed_forecasts[label][i]["q1"])
                    medians.append(composed_forecasts[label][i]["median"])
                    q3s.append(composed_forecasts[label][i]["q3"])
            else:  # continuous
                q1s = composed_forecasts["q1s"]
                medians = composed_forecasts["medians"]
                q3s = composed_forecasts["q3s"]

            new_entry = cls(
                forecast_values=forecast_values,
                start_time=start_time,
                num_forecasters=num_forecasters,
                q1s=q1s,
                medians=medians,
                q3s=q3s,
            )
            if len(aggregation_history):
                aggregation_history[-1].end_time = new_entry.start_time
            aggregation_history.append(new_entry)
        return aggregation_history


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
        )
    # TODO: this needs to be normalized for MC, but special care needs to be taken
    # if the percentile isn't 50 (namely it needs to be normalized based off the values
    # at the median)
    return weighted_percentile_2d(
        forecasts_values, weights=weights, percentiles=percentile
    )


def compute_cp_continuous(
    forecast_values: ForecastsValues,
    weights: Weights | None = None,
) -> ForecastValues:
    return np.average(forecast_values, axis=0, weights=weights)


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
) -> AggregationEntry:
    if question_type in ["binary", "multiple_choice"]:
        aggregation = AggregationEntry(
            forecast_values=compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, 50.0
            )[0]
        )
    else:
        aggregation = AggregationEntry(
            forecast_values=compute_cp_continuous(
                forecast_set.forecasts_values, weights
            )
        )
    if include_stats:
        aggregation.start_time = forecast_set.timestep
        aggregation.num_forecasters = len(forecast_set.forecasts_values)
        if question_type in ["binary", "multiple_choice"]:
            aggregation.q1s, aggregation.medians, aggregation.q3s = (
                compute_discrete_forecast_values(
                    forecast_set.forecasts_values, weights, [25.0, 50.0, 75.0]
                )
            )
        else:
            aggregation.q1s, aggregation.medians, aggregation.q3s = (
                percent_point_function(aggregation.forecast_values, [25.0, 50.0, 75.0])
            )
        aggregation.means = np.average(
            forecast_set.forecasts_values, weights=weights, axis=0
        )
    if histogram and question_type == "binary":
        aggregation.histogram = get_histogram(
            [f[1] for f in forecast_set.forecasts_values], weights
        )
    return aggregation


def get_aggregation_at_time(
    question: Question,
    time: datetime,
    include_stats: bool = False,
    histogram: bool = False,
    aggregation_method: AggregationMethod = AggregationMethod.RECENCY_WEIGHTED,
) -> AggregationEntry | None:
    """set include_stats to True if you want to include num_forecasters, q1s, medians,
    and q3s"""
    forecasts = question.forecast_set.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=time), start_time__lte=time
    ).order_by("-start_time")
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


def get_user_forecast_history(question: Question) -> list[ForecastSet]:
    forecasts = question.forecast_set.order_by("start_time").all()
    timestamps = set()
    for forecast in forecasts:
        timestamps.add(forecast.start_time)
        if forecast.end_time:
            timestamps.add(forecast.end_time)

    timestamps = sorted(timestamps)
    output = defaultdict(list)

    for forecast in forecasts:
        # Find active timestamps
        forecast_timestamps = filter_between_dates(
            timestamps, forecast.start_time, forecast.end_time
        )

        for timestamp in forecast_timestamps:
            output[timestamp].append(forecast.get_prediction_values())

    return [ForecastSet(output[key], key) for key in sorted(output.keys())]


def minimize_forecast_history(
    forecast_history: list[AggregationEntry],
    max_size: int = 128,
) -> list[AggregationEntry]:
    if len(forecast_history) <= max_size:
        return forecast_history

    # this is a pretty cheap algorithm that generates a minimized forecast history
    # by taking the middle (wrt start_time) forecast of the list, then the middle
    # of the two halves, then the middle of the four quarters, etc. 7 times,
    # generating a maximum list of 128 forecasts close evenly spaced.

    def find_index_of_middle(forecasts: list[AggregationEntry]) -> int:
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

    minimized = []
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


def get_cp_history(
    question: Question,
    aggregation_method: AggregationMethod = AggregationMethod.RECENCY_WEIGHTED,
    minimize: bool = True,
    include_stats: bool = True,
) -> list[AggregationEntry]:
    full_summary: list[AggregationEntry] = []

    user_forecast_history = get_user_forecast_history(question)
    for i, forecast_set in enumerate(user_forecast_history):
        if aggregation_method == AggregationMethod.RECENCY_WEIGHTED:
            weights = generate_recency_weights(len(forecast_set.forecasts_values))
        else:
            weights = None
        histogram = question.type == "binary" and i == (len(user_forecast_history) - 1)
        new_entry = calculate_aggregation_entry(
            forecast_set,
            question.type,
            weights,
            include_stats=include_stats,
            histogram=histogram,
        )
        if full_summary:
            # terminate previous entry
            full_summary[-1].end_time = new_entry.start_time
        full_summary.append(new_entry)

    if minimize:
        return minimize_forecast_history(full_summary)
    return full_summary
