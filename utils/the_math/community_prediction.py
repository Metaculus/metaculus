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
from django.core.cache import cache
from django.db.models import Q, TextChoices

import numpy as np

from django.db.models import QuerySet
from questions.models import Forecast, Question, CDF_SIZE
from utils.the_math.formulas import get_scaled_quartiles_from_cdf
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
    return aggregation


def get_aggregation_at_time(
    question: Question,
    time: datetime,
    include_stats: bool = False,
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
    return calculate_aggregation_entry(
        forecast_set, question.type, weights, include_stats
    )


def get_user_forecast_history(question: Question) -> list[ForecastSet]:
    forecasts = question.forecast_set.all()
    timesteps: set[datetime] = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            timesteps.add(forecast.end_time)

    reversed_sorted_timesteps = sorted(timesteps, reverse=True)
    if len(reversed_sorted_timesteps) == 0:
        return []

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
        active_forecasts = sorted(active_forecasts, key=lambda f: f.start_time)
        if len(active_forecasts) < 1:
            continue
        forecast_set = ForecastSet(
            [forecast.get_prediction_values() for forecast in active_forecasts],
            timestep,
        )
        history.append(forecast_set)

    return list(reversed(history))


def minimize_forecast_history(
    forecast_history: list[AggregationEntry],
) -> list[AggregationEntry]:
    # this is a pretty cheap algorithm that generates a minimized forecast history
    # by taking the middle forecast of the list, then the middle of the two halves,
    # then the middle of the four quarters, etc. 7 times, generating a maximum list
    # of 128 forecasts close evenly spaced.

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
    # depth of 7 for ~100 forecasts
    working_lists = [forecast_history] if forecast_history else []
    for _ in range(7):
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

    return sorted(minimized, key=lambda x: x.start_time)


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def get_cp_summary(
    question: Question,
    aggregation_method: AggregationMethod = AggregationMethod.RECENCY_WEIGHTED,
    reset_cache: bool = False,
) -> list[AggregationEntry]:

    full_summary: list[AggregationEntry] = []

    user_forecast_history = get_user_forecast_history(question)
    for forecast_set in user_forecast_history:
        if aggregation_method == AggregationMethod.RECENCY_WEIGHTED:
            weights = generate_recency_weights(len(forecast_set.forecasts_values))
        else:
            weights = None
        new_entry = calculate_aggregation_entry(
            forecast_set, question.type, weights, include_stats=True
        )
        if full_summary:
            # terminate previous entry
            full_summary[-1].end_time = new_entry.start_time
        full_summary.append(new_entry)

    minimized_summary = minimize_forecast_history(full_summary)
    return minimized_summary
