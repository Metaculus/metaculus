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
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import numpy as np
from django.db.models import Q

from questions.models import Question, Forecast, AggregateForecast
from questions.types import AggregationMethod
from scoring.reputation import (
    get_reputations_at_time,
    get_reputations_during_interval,
    Reputation,
)
from users.models import User
from utils.the_math.measures import weighted_percentile_2d, percent_point_function
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
    Percentiles,
)


def get_histogram(
    values: ForecastValues,
    weights: Weights | None,
    question_type: Question.QuestionType = Question.QuestionType.BINARY,
) -> np.ndarray:
    values = np.array(values)
    if len(values) == 0:
        return np.zeros(100)
    if weights is None:
        weights = np.ones(len(values))

    transposed_values = values.T

    if question_type == Question.QuestionType.BINARY:
        histogram = np.zeros(100)
        for p, w in zip(transposed_values[1], weights):
            histogram[int(p * 100)] += w
        return histogram

    histogram = np.zeros((len(values[0]), 100))
    for forecast_values, w in zip(values, weights):
        for i, p in enumerate(forecast_values):
            histogram[i, int(p * 100)] += w
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


def compute_weighted_semi_standard_deviations(
    forecasts_values: ForecastsValues,
    weights: Weights,
) -> tuple[ForecastValues, ForecastValues]:
    """returns the upper and lower standard_deviations"""
    average = np.average(forecasts_values, axis=0, weights=weights)
    lower_semivariances = np.zeros(forecasts_values.shape[1])
    upper_semivariances = np.zeros(forecasts_values.shape[1])
    for i in range(forecasts_values.shape[1]):
        lower_mask = forecasts_values[:, i] < average[i]
        lower_semivariances[i] = np.average(
            (average[i] - forecasts_values[:, i][lower_mask]) ** 2,
            weights=weights[lower_mask] if weights[lower_mask].size else None,
        )
        upper_mask = forecasts_values[:, i] > average[i]
        upper_semivariances[i] = np.average(
            (forecasts_values[:, i][upper_mask] - average[i]) ** 2,
            weights=weights[upper_mask] if weights[upper_mask].size else None,
        )
    # replace nans with 0s
    lower_semivariances = np.nan_to_num(lower_semivariances)
    upper_semivariances = np.nan_to_num(upper_semivariances)
    return np.sqrt(lower_semivariances), np.sqrt(upper_semivariances)


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
    method: AggregationMethod,
    include_stats: bool = False,
    histogram: bool = False,
) -> AggregateForecast:
    weights = np.array(weights) if weights is not None else None
    if (
        question_type in ["date", "numeric"]
        or method == AggregationMethod.SINGLE_AGGREGATION
    ):
        aggregation = AggregateForecast(
            forecast_values=np.average(
                forecast_set.forecasts_values, axis=0, weights=weights
            ).tolist()
        )
    elif question_type == Question.QuestionType.BINARY:
        aggregation = AggregateForecast(
            forecast_values=compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, 50.0
            )[0]
        )
    else:  # multiple_choice
        medians = np.array(
            compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, 50.0
            )[0]
        )
        floored_medians = medians - 0.001
        normalized_floored_medians = floored_medians / sum(floored_medians)
        normalized_medians = (
            normalized_floored_medians * (1 - len(medians) * 0.001) + 0.001
        )
        aggregation = AggregateForecast(forecast_values=normalized_medians.tolist())

    if include_stats:
        forecasts_values = np.array(forecast_set.forecasts_values)
        aggregation.start_time = forecast_set.timestep
        aggregation.forecaster_count = len(forecast_set.forecasts_values)
        if question_type in [
            Question.QuestionType.BINARY,
            Question.QuestionType.MULTIPLE_CHOICE,
        ]:
            if method == AggregationMethod.SINGLE_AGGREGATION:
                centers = aggregation.forecast_values
                lowers_sd, uppers_sd = compute_weighted_semi_standard_deviations(
                    forecasts_values, weights
                )
                lowers = (np.array(centers) - lowers_sd).tolist()
                uppers = (np.array(centers) + uppers_sd).tolist()
            else:
                lowers, centers, uppers = compute_discrete_forecast_values(
                    forecast_set.forecasts_values, weights, [25.0, 50.0, 75.0]
                )
                if question_type == Question.QuestionType.MULTIPLE_CHOICE:
                    centers_array = np.array(centers)
                    normalized_centers = np.array(aggregation.forecast_values)
                    normalized_lowers = (
                        np.array(lowers) * normalized_centers / centers_array
                    )
                    normalized_uppers = (
                        np.array(uppers) * normalized_centers / centers_array
                    )
                    centers = normalized_centers.tolist()
                    lowers = normalized_lowers.tolist()
                    uppers = normalized_uppers.tolist()
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
        if question_type in [
            Question.QuestionType.BINARY,
            Question.QuestionType.MULTIPLE_CHOICE,
        ]:
            aggregation.means = np.average(
                forecast_set.forecasts_values, weights=weights, axis=0
            ).tolist()
    if histogram and question_type in [
        Question.QuestionType.BINARY,
        Question.QuestionType.MULTIPLE_CHOICE,
    ]:
        aggregation.histogram = get_histogram(
            forecast_set.forecasts_values,
            weights,
            question_type=question_type,
        ).tolist()
    return aggregation


def get_aggregations_at_time(
    question: Question,
    time: datetime,
    aggregation_methods: list[AggregationMethod],
    user_ids: list[int] | None = None,
    include_stats: bool = False,
    histogram: bool = False,
    include_bots: bool = False,
) -> dict[AggregationMethod, AggregateForecast]:
    """set include_stats to True if you want to include num_forecasters, q1s, medians,
    and q3s"""
    forecasts = (
        question.user_forecasts.filter(
            Q(end_time__isnull=True) | Q(end_time__gt=time), start_time__lte=time
        )
        .order_by("start_time")
        .select_related("author")
    )
    if user_ids:
        forecasts = forecasts.filter(author_id__in=user_ids)
    if not include_bots:
        forecasts = forecasts.exclude(author__is_bot=True)
    if len(forecasts) == 0:
        return dict()
    forecast_set = ForecastSet(
        forecasts_values=[forecast.get_prediction_values() for forecast in forecasts],
        timestep=time,
        users=[forecast.author for forecast in forecasts],
        timesteps=[forecast.start_time for forecast in forecasts],
    )

    aggregations: dict[AggregationMethod, AggregateForecast] = dict()
    for method in aggregation_methods:
        match method:
            case AggregationMethod.RECENCY_WEIGHTED:
                weights = generate_recency_weights(len(forecast_set.forecasts_values))
            case AggregationMethod.UNWEIGHTED:
                weights = None
            case AggregationMethod.SINGLE_AGGREGATION:
                repuatations = get_reputations_at_time(forecast_set.users, time)
                weights = calculate_single_aggregation_weights(
                    forecast_set,
                    repuatations,
                    question.open_time,
                    question.scheduled_close_time,
                )
        new_entry: AggregateForecast = calculate_aggregation_entry(
            forecast_set,
            question.type,
            weights,
            method=method,
            include_stats=include_stats,
            histogram=histogram,
        )
        new_entry.question = question
        new_entry.method = method
        aggregations[method] = new_entry
    return aggregations


def summarize_array(
    array: list,
    size: int,
) -> list[datetime]:
    """helper method to pick evenly distributed values from an ordered list
    array must be sorted in ascending order
    """

    if size <= 0:
        return []
    elif len(array) <= size:
        return array
    elif size == 2 or len(array) == 2:
        return [array[0], array[-1]]

    target_values = np.linspace(array[0], array[-1], size)
    summary = set()
    for target in target_values:
        index = bisect_left(array, target)
        if index == len(array) - 1:
            summary.add(array[-1])
            continue
        left = array[index]
        right = array[index + 1]
        if abs(left - target) <= abs(right - target):
            summary.add(left)
        else:
            summary.add(right)
    return sorted(summary)


def minimize_history(
    history: list[datetime],
    max_size: int = 400,
) -> list[datetime]:
    """This takes a sorted list of datetimes and returns a summarized version of it

    The front end graphs have zoomed views on 1 day, 1 week, 2 months, and all time
    so this makes sure that the history contains sufficiently high resolution data
    for each interval.

    max_size dictates the maximum numer of returned datetimes.
    """
    if len(history) <= max_size:
        return history

    h = [h.timestamp() for h in history]
    # determine how many datetimes we want to have in each interval
    day = timedelta(days=1).total_seconds()
    domain = h[-1] - h[0]
    if domain <= day:
        all_size = 0
        month_size = 0
        week_size = 0
        day_size = max_size
    elif domain <= day * 7:
        all_size = 0
        month_size = 0
        even_spread = int(1 / 2 * max_size)
        week_size = int(even_spread * (domain - day) / (day * 6))
        remainder = even_spread - week_size
        day_size = even_spread + remainder
    elif domain <= day * 60:
        all_size = 0
        even_spread = int(1 / 3 * max_size)
        month_size = int(even_spread * (domain - day * 7) / (day * 53))
        remainder = even_spread - month_size
        week_size = even_spread + int(remainder / 2)
        day_size = even_spread + int(remainder / 2)
    elif domain <= day * 120:
        even_spread = int(1 / 4 * max_size)
        all_size = int(even_spread * (domain - day * 60) / (day * 60))
        remainder = even_spread - all_size
        month_size = even_spread + int(remainder / 3)
        week_size = even_spread + int(remainder / 3)
        day_size = even_spread + int(remainder / 3)
    else:
        even_spread = int(1 / 4 * max_size)
        all_size = even_spread
        month_size = even_spread
        week_size = even_spread
        day_size = even_spread

    # start with smallest interval, populating it with timestamps up to it's size. If
    # interval isn't saturated, distribute the remaining allotment to smaller intervals.

    # Day interval
    day_history = []
    day_interval = []
    if day_size > 0:
        first_index = bisect_left(h, h[-1] - day)
        day_interval = h[first_index:]
        day_history = summarize_array(day_interval, day_size)
        remainder = day_size - len(day_history)
        if remainder > 0:
            week_size += remainder - 2 * int(remainder / 3)
            month_size += int(remainder / 3)
            all_size += int(remainder / 3)
    # Week interval
    week_history = []
    week_interval = []
    if week_size > 0:
        first_index = bisect_left(h, h[-1] - day * 7)
        last_index = bisect_right(h, h[-1] - day)
        week_interval = h[first_index:last_index]
        week_history = summarize_array(week_interval, week_size)
        remainder = week_size - len(week_history)
        if remainder > 0:
            month_size += remainder - int(remainder / 2)
            all_size += int(remainder / 2)
    # Month interval
    month_history = []
    month_interval = []
    if month_size > 0:
        first_index = bisect_left(h, h[-1] - day * 60)
        last_index = bisect_right(h, h[-1] - day * 7)
        month_interval = h[first_index:last_index]
        month_history = summarize_array(month_interval, month_size)
        remainder = month_size - len(month_history)
        if remainder > 0:
            all_size += remainder
    # All Time interval
    all_history = []
    all_interval = []
    if all_size > 0:
        last_index = bisect_right(h, h[-1] - day * 60)
        all_interval = h[:last_index]
        all_history = summarize_array(all_interval, all_size)
        remainder = all_size - len(all_history)

    # put it all together
    minimized_history = all_history + month_history + week_history + day_history
    return [datetime.fromtimestamp(h, tz=timezone.utc) for h in minimized_history]


def get_user_forecast_history(
    forecasts: list[Forecast],
    minimize: bool = False,
    cutoff: datetime | None = None,
) -> list[ForecastSet]:
    timesteps = set()
    for forecast in forecasts:
        timesteps.add(forecast.start_time)
        if forecast.end_time:
            if cutoff and forecast.end_time > cutoff:
                continue
            timesteps.add(forecast.end_time)

    timesteps = sorted(timesteps)
    if minimize:
        timesteps = minimize_history(timesteps)

    forecast_sets: dict[datetime, ForecastSet] = {
        timestep: ForecastSet(
            forecasts_values=[],
            timestep=timestep,
            users=[],
            timesteps=[],
        )
        for timestep in timesteps
    }
    for forecast in forecasts:
        # Find active timesteps using bisect to find the start & end indexes
        start_index = bisect_left(timesteps, forecast.start_time)
        end_index = (
            bisect_left(timesteps, forecast.end_time)
            if forecast.end_time
            else len(timesteps)
        )
        forecast_values = forecast.get_prediction_values()
        for timestep in timesteps[start_index:end_index]:
            forecast_sets[timestep].forecasts_values.append(forecast_values)
            forecast_sets[timestep].users.append(forecast.author)
            forecast_sets[timestep].timesteps.append(forecast.start_time)

    return sorted(list(forecast_sets.values()), key=lambda x: x.timestep)


def generate_recency_weights(number_of_forecasts: int) -> np.ndarray:
    if number_of_forecasts <= 2:
        return None
    return np.exp(
        np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
    )


def calculate_single_aggregation_weights(
    forecast_set: ForecastSet,
    reputations: list[Reputation],
    open_time: datetime,
    close_time: datetime,
) -> Weights:
    # TODO: make these learned parameters
    a = 0.5
    b = 6.0
    decays = [
        np.exp(-(forecast_set.timestep - start_time) / (close_time - open_time))
        for start_time in forecast_set.timesteps
    ]
    weights = [
        (decay**a * reputation.value ** (1 - a)) ** b
        for decay, reputation in zip(decays, reputations)
    ]
    return weights


def get_aggregation_history(
    question: Question,
    aggregation_methods: list[AggregationMethod],
    user_ids: list[int] | None = None,
    minimize: bool = True,
    include_stats: bool = True,
    include_bots: bool = False,
    histogram: bool | None = None,
) -> dict[AggregationMethod, list[AggregateForecast]]:
    full_summary: dict[AggregationMethod, list[AggregateForecast]] = dict()

    # get input forecasts
    forecasts = (
        Forecast.objects.filter(question_id=question.id)
        .order_by("start_time")
        .select_related("author")
    )
    if question.actual_close_time:
        forecasts = forecasts.filter(start_time__lte=question.actual_close_time)

    if user_ids:
        forecasts = forecasts.filter(author_id__in=user_ids)
    if not include_bots:
        forecasts = forecasts.exclude(author__is_bot=True)

    forecast_history = get_user_forecast_history(
        forecasts, minimize, cutoff=question.actual_close_time
    )

    for method in aggregation_methods:
        aggregation_history: list[AggregateForecast] = []
        match method:
            case AggregationMethod.RECENCY_WEIGHTED:

                def get_weights(forecast_set: ForecastSet) -> Weights | None:
                    return generate_recency_weights(len(forecast_set.forecasts_values))

            case AggregationMethod.UNWEIGHTED:

                def get_weights(forecast_set: ForecastSet) -> Weights | None:
                    return None

            case AggregationMethod.SINGLE_AGGREGATION:
                users = list(set(forecast.author for forecast in forecasts))
                reputations = get_reputations_during_interval(
                    users, question.open_time, question.scheduled_close_time
                )

                def get_weights(forecast_set: ForecastSet) -> Weights | None:
                    reps = []
                    for user in forecast_set.users:
                        for rep in reputations[user][::-1]:
                            if rep.time <= forecast_set.timestep:
                                reps.append(rep)
                                break
                    return calculate_single_aggregation_weights(
                        forecast_set,
                        reps,
                        question.open_time,
                        question.scheduled_close_time,
                    )

            case AggregationMethod.METACULUS_PREDICTION:
                full_summary[method] = list(
                    AggregateForecast.objects.filter(
                        question=question, method=method
                    ).order_by("start_time")
                )
                continue

        for i, forecast_set in enumerate(forecast_history):
            weights = get_weights(forecast_set)
            include_histogram = (
                question.type
                in [Question.QuestionType.BINARY, Question.QuestionType.MULTIPLE_CHOICE]
                and histogram
                if histogram is not None
                else question.type == Question.QuestionType.BINARY
                and i == (len(forecast_history) - 1)
            )

            if forecast_set.forecasts_values:
                new_entry: AggregateForecast = calculate_aggregation_entry(
                    forecast_set,
                    question.type,
                    weights,
                    method=method,
                    include_stats=include_stats,
                    histogram=include_histogram,
                )
                new_entry.question = question
                new_entry.method = method
                if aggregation_history and aggregation_history[-1].end_time is None:
                    aggregation_history[-1].end_time = new_entry.start_time
                aggregation_history.append(new_entry)
            else:
                if aggregation_history:
                    aggregation_history[-1].end_time = forecast_set.timestep

        full_summary[method] = aggregation_history

    return full_summary
