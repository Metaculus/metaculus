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
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Sequence


from django.db.models import Q, QuerySet
from django.utils import timezone
import numpy as np

from questions.models import (
    QUESTION_CONTINUOUS_TYPES,
    Question,
    Forecast,
    AggregateForecast,
)
from questions.types import AggregationMethod
from scoring.models import Score
from scoring.constants import ScoreTypes
from utils.the_math.measures import (
    weighted_percentile_2d,
    percent_point_function,
)
from utils.typing import (
    ForecastValues,
    ForecastsValues,
    Weights,
    Percentiles,
)

RangeValuesType = tuple[list[float], list[float], list[float]]


# Dataclasses ##########################################


@dataclass
class ForecastSet:
    forecasts_values: ForecastsValues
    timestep: datetime
    user_ids: list[int] = list
    timesteps: list[datetime] = list


@dataclass
class Reputation:
    user_id: int
    value: float
    time: datetime


# Helpers ##########################################


def get_histogram(
    values: ForecastsValues,
    weights: Weights,
    question_type: Question.QuestionType,
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
    weights: Weights = None,
    percentile: float | list[float] | Percentiles = 50.0,
) -> ForecastsValues:
    forecasts_values = np.array(forecasts_values)
    if isinstance(percentile, float):
        percentile = np.array([percentile])
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
    weights: Weights | None,
) -> tuple[ForecastValues, ForecastValues]:
    """returns the upper and lower standard_deviations"""
    forecasts_values = np.array(forecasts_values)
    if weights is None:
        weights = np.ones(forecasts_values.shape[0])
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


# Weightings ##########################################


class Weighted:

    def __init__(self, question: Question, **kwargs):
        self.question = question

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        raise NotImplementedError("Implement in Child Class")


class Unweighted(Weighted):
    """No special weighting"""

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        return None


class RecencyWeighted(Weighted):
    """Applies a recency weighting to the forecasts equal to:
    e^(sqrt(n) - sqrt(N)) where n is the nth forecast of the N active forecasts,
    ordered by start_time ascending."""

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        number_of_forecasts = len(forecast_set.forecasts_values)
        if number_of_forecasts <= 2:
            return None
        return np.exp(
            np.sqrt(np.arange(number_of_forecasts) + 1) - np.sqrt(number_of_forecasts)
        )


# ReputationWeightings ##########################################


class ReputationWeighted(Weighted):
    """Uses a Reputation to calculate a forecast's weight.
    Requires `get_reputation_history`"""

    def __init__(self, question: Question, user_ids: list[int] | set[int] | None):
        if question is None or user_ids is None:
            raise ValueError("question and user_ids must be provided")
        self.question = question
        self.reputations: dict[int, list[Reputation]] = self.get_reputation_history(
            user_ids
        )

    def get_reputation_history(
        self, user_ids: list[int] | set[int]
    ) -> dict[int, list[Reputation]]:
        raise NotImplementedError("Implement in Child Class")

    def get_reputations(self, forecast_set: ForecastSet) -> list[Reputation]:
        reps = []
        for user_id in forecast_set.user_ids:
            found = False
            for reputation in self.reputations[user_id][::-1]:
                if reputation.time <= forecast_set.timestep:
                    reps.append(reputation)
                    found = True
                    break
            if not found:
                # no reputation -> no weight
                reps.append(Reputation(user_id, 0, forecast_set.timestep))
        return reps

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        reps = self.get_reputations(forecast_set)
        return np.array([reputation.value for reputation in reps])


class PeerScoreWeighted(ReputationWeighted):

    @staticmethod
    def reputation_value(scores: Sequence[Score]) -> float:
        return max(
            sum([score.score for score in scores])
            / (30 + sum([score.coverage for score in scores])),
            1e-6,
        )

    def get_reputation_history(
        self, user_ids: list[int] | set[int]
    ) -> dict[int, list[Reputation]]:

        start = self.question.open_time
        end = self.question.scheduled_close_time
        if end is None:
            end = timezone.now()
        peer_scores = Score.objects.filter(
            user_id__in=user_ids,
            score_type=ScoreTypes.PEER,
            question__in=Question.objects.filter_public(),
            edited_at__lte=end,
        )

        # setup
        scores_by_user: dict[int, dict[int, Score]] = defaultdict(dict)
        reputations: dict[int, list[Reputation]] = defaultdict(list)

        # Establish reputations at the start of the interval.
        old_peer_scores = list(
            peer_scores.filter(edited_at__lte=start).order_by("edited_at")
        )
        for score in old_peer_scores:
            scores_by_user[score.user_id][score.question_id] = score
        for user_id in user_ids:
            value = self.reputation_value(list(scores_by_user[user_id].values()))
            reputations[user_id].append(Reputation(user_id, value, start))

        # Then, for each new score, add a new reputation record
        new_peer_scores = list(
            peer_scores.filter(edited_at__gt=start).order_by("edited_at")
        )
        for score in new_peer_scores:
            # update the scores by user, then calculate the updated reputation
            scores_by_user[score.user_id][score.question_id] = score
            value = self.reputation_value(list(scores_by_user[score.user_id].values()))
            reputations[score.user_id].append(
                Reputation(score.user_id, value, score.edited_at)
            )
        return reputations

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        # Custom overwrite to uniquely combine time weighting with reputation
        reps = self.get_reputations(forecast_set)
        # TODO: make these learned parameters
        a = 0.5
        b = 6.0
        decays = [
            np.exp(
                -(forecast_set.timestep - start_time)
                / (self.question.scheduled_close_time - self.question.open_time)
            )
            for start_time in forecast_set.timesteps
        ]
        weights = np.array(
            [
                (decay**a * reputation.value ** (1 - a)) ** b
                for decay, reputation in zip(decays, reps)
            ]
        )
        if all(weights == 0):
            return None
        return weights if weights.size else None


# Aggregators ##########################################


class AggregatorMixin:
    """
    The method of aggregating forecasts, given their weights
    requires `calculate_forecast_values` and `get_range_values`
    """

    question: Question

    def calculate_forecast_values(
        self, forecast_set: ForecastSet, weights: np.ndarray | None = None
    ) -> np.ndarray:
        raise NotImplementedError("Implement in subclass")

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
    ) -> RangeValuesType:
        raise NotImplementedError("Implement in subclass")


class MedianAggregatorMixin:
    """
    Takes the median of the forecasts values for Binary and MC, mean for continuous
    """

    question: Question

    def calculate_forecast_values(
        self, forecast_set: ForecastSet, weights: np.ndarray | None = None
    ) -> np.ndarray:
        # Default Aggregation method uses weighted medians for binary and MC questions
        # and weighted average for continuous
        if self.question.type == Question.QuestionType.BINARY:
            return np.array(
                compute_discrete_forecast_values(
                    forecast_set.forecasts_values, weights, 50.0
                )[0]
            )
        elif self.question.type == Question.QuestionType.MULTIPLE_CHOICE:
            medians = np.array(
                compute_discrete_forecast_values(
                    forecast_set.forecasts_values, weights, 50.0
                )[0]
            )
            floored_medians = medians - 0.001
            normalized_floored_medians = floored_medians / sum(floored_medians)
            return normalized_floored_medians * (1 - len(medians) * 0.001) + 0.001
        else:  # continuous
            return np.average(forecast_set.forecasts_values, axis=0, weights=weights)

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
    ):
        if self.question.type == Question.QuestionType.BINARY:
            lowers, centers, uppers = compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, [25.0, 50.0, 75.0]
            )
        elif self.question.type == Question.QuestionType.MULTIPLE_CHOICE:
            lowers, centers, uppers = compute_discrete_forecast_values(
                forecast_set.forecasts_values, weights, [25.0, 50.0, 75.0]
            )
            centers_array = np.array(centers)
            normalized_centers = np.array(aggregation_forecast_values)
            normalized_lowers = np.array(lowers) * normalized_centers / centers_array
            normalized_uppers = np.array(uppers) * normalized_centers / centers_array
            centers = normalized_centers.tolist()
            lowers = normalized_lowers.tolist()
            uppers = normalized_uppers.tolist()
        else:  # continuous
            lowers, centers, uppers = percent_point_function(
                aggregation_forecast_values, [25.0, 50.0, 75.0]
            )
            lowers = [lowers]
            centers = [centers]
            uppers = [uppers]
        return lowers, centers, uppers


class MeanAggregatorMixin:
    """Takes the mean of the forecast values"""

    question: Question

    def calculate_forecast_values(
        self, forecast_set: ForecastSet, weights: np.ndarray | None = None
    ) -> np.ndarray:
        return np.average(forecast_set.forecasts_values, axis=0, weights=weights)

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
    ):
        if self.question.type in QUESTION_CONTINUOUS_TYPES:
            lowers, centers, uppers = percent_point_function(
                aggregation_forecast_values, [25.0, 50.0, 75.0]
            )
            lowers = [lowers]
            centers = [centers]
            uppers = [uppers]
        else:
            centers = aggregation_forecast_values
            lowers_sd, uppers_sd = compute_weighted_semi_standard_deviations(
                forecast_set.forecasts_values, weights
            )
            lowers = (np.array(centers) - lowers_sd).tolist()
            uppers = (np.array(centers) + uppers_sd).tolist()
        return lowers, centers, uppers


# Aggregations ##########################################


class Aggregation(AggregatorMixin):
    """Base class for actual Aggregations.
    Any class Inheriting this one must also inherit from a single Aggregator class.
    Multiple weightings/filters are allowed. Their classes must be listed in the
        `weighting_classes` property. They will be applied multiplicatively in order.
    """

    method = "N/A"
    weighting_classes: list[type[Weighted]] = []  # defined in subclasses

    def __init__(
        self, question: Question, user_ids: list[int] | set[int] | None = None
    ):
        self.question = question
        self.weightings: list[Weighted] = [
            Klass(question=question, user_ids=user_ids)
            for Klass in self.weighting_classes
        ]

    def get_weights(self, forecast_set: ForecastSet) -> Weights:
        weights = None
        for weighting in self.weightings:
            new_weights = weighting.calculate_weights(forecast_set)
            if weights is None:
                weights = new_weights
            elif new_weights is not None:
                weights = weights * new_weights
        if weights is None or np.all(weights == 0):
            return None
        if len(forecast_set.forecasts_values) != weights.shape[0]:
            weights = weights[0]
        return weights

    def calculate_aggregation_entry(
        self,
        forecast_set: ForecastSet,
        include_stats: bool = False,
        histogram: bool = False,
    ) -> AggregateForecast:
        weights = self.get_weights(forecast_set)
        aggregation = AggregateForecast(question=self.question, method=self.method)
        aggregation.forecast_values = self.calculate_forecast_values(
            forecast_set, weights
        ).tolist()

        aggregation.start_time = forecast_set.timestep
        aggregation.forecaster_count = len(forecast_set.forecasts_values)
        if include_stats:
            lowers, centers, uppers = self.get_range_values(
                forecast_set, aggregation.forecast_values, weights
            )
            aggregation.interval_lower_bounds = lowers
            aggregation.centers = centers
            aggregation.interval_upper_bounds = uppers
            if self.question.type in [
                Question.QuestionType.BINARY,
                Question.QuestionType.MULTIPLE_CHOICE,
            ]:
                aggregation.means = np.average(
                    forecast_set.forecasts_values, weights=weights, axis=0
                ).tolist()

        if histogram and self.question.type in [
            Question.QuestionType.BINARY,
            Question.QuestionType.MULTIPLE_CHOICE,
        ]:
            aggregation.histogram = get_histogram(
                forecast_set.forecasts_values,
                weights,
                question_type=self.question.type,
            ).tolist()

        return aggregation


class UnweightedAggregation(MedianAggregatorMixin, Aggregation):
    method = AggregationMethod.UNWEIGHTED
    weighting_classes = [Unweighted]


class RecencyWeightedAggregation(MedianAggregatorMixin, Aggregation):
    method = AggregationMethod.RECENCY_WEIGHTED
    weighting_classes = [RecencyWeighted]


class SingleAggregation(MeanAggregatorMixin, Aggregation):
    method = AggregationMethod.SINGLE_AGGREGATION
    weighting_classes = [PeerScoreWeighted]


AGGREGATIONS: list[type[Aggregation]] = [
    UnweightedAggregation,
    RecencyWeightedAggregation,
    SingleAggregation,
]


def get_aggregation_by_name(method: AggregationMethod) -> type[Aggregation]:
    return next(agg for agg in AGGREGATIONS if agg.method == method)


def get_aggregations_at_time(
    question: Question,
    time: datetime,
    aggregation_methods: list[AggregationMethod],
    user_ids: list[int] | set[int] | None = None,
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
        user_ids=[forecast.author_id for forecast in forecasts],
        timesteps=[forecast.start_time for forecast in forecasts],
    )

    aggregations: dict[AggregationMethod, AggregateForecast] = dict()
    for method in aggregation_methods:
        aggregation_generator = get_aggregation_by_name(method)(
            question=question,
            user_ids=set(forecast_set.user_ids),
        )
        new_entry = aggregation_generator.calculate_aggregation_entry(
            forecast_set,
            include_stats=include_stats,
            histogram=histogram,
        )
        aggregations[method] = new_entry
    return aggregations


def summarize_array(
    array: list[float],
    size: int,
) -> list[float]:
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

    now_or_last = min(h[-1], timezone.now().timestamp())
    # Day interval
    day_history = []
    day_interval = []
    if day_size > 0:
        first_index = bisect_left(h, now_or_last - day)
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
        first_index = bisect_left(h, now_or_last - day * 7)
        last_index = bisect_right(h, now_or_last - day)
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
        first_index = bisect_left(h, now_or_last - day * 60)
        last_index = bisect_right(h, now_or_last - day * 7)
        month_interval = h[first_index:last_index]
        month_history = summarize_array(month_interval, month_size)
        remainder = month_size - len(month_history)
        if remainder > 0:
            all_size += remainder
    # All Time interval
    all_history = []
    all_interval = []
    if all_size > 0:
        last_index = bisect_right(h, now_or_last - day * 60)
        all_interval = h[:last_index]
        all_history = summarize_array(all_interval, all_size)
        remainder = all_size - len(all_history)
    # put it all together
    minimized_history = all_history + month_history + week_history + day_history
    return [datetime.fromtimestamp(h, tz=dt_timezone.utc) for h in minimized_history]


def get_user_forecast_history(
    forecasts: list[Forecast],
    minimize: bool = False,
    cutoff: datetime | None = None,
    include_future: bool = True,
) -> list[ForecastSet]:
    timestep_set: set[datetime] = set()
    for forecast in forecasts:
        timestep_set.add(forecast.start_time)
        if forecast.end_time:
            if cutoff and forecast.end_time > cutoff:
                continue
            timestep_set.add(forecast.end_time)
    timesteps = sorted(timestep_set)
    if minimize:
        timesteps = minimize_history(timesteps)
    forecast_sets: dict[datetime, ForecastSet] = {
        timestep: ForecastSet(
            forecasts_values=[],
            timestep=timestep,
            user_ids=[],
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
            forecast_sets[timestep].user_ids.append(forecast.author_id)
            forecast_sets[timestep].timesteps.append(forecast.start_time)

    return sorted(list(forecast_sets.values()), key=lambda x: x.timestep)


def get_aggregation_history(
    question: Question,
    aggregation_methods: list[AggregationMethod],
    forecasts: QuerySet[Forecast] | None = None,
    user_ids: list[int] | set[int] | None = None,
    minimize: bool = True,
    include_stats: bool = True,
    include_bots: bool = False,
    histogram: bool | None = None,
    include_future: bool = True,
) -> dict[AggregationMethod, list[AggregateForecast]]:
    full_summary: dict[AggregationMethod, list[AggregateForecast]] = dict()

    if not forecasts:
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

    if include_future:
        cutoff = question.actual_close_time
    else:
        cutoff = min(timezone.now(), question.actual_close_time or timezone.now())
    forecast_history = get_user_forecast_history(
        forecasts,
        minimize,
        cutoff=cutoff,
    )

    forecaster_ids = set(forecast.author_id for forecast in forecasts)
    for method in aggregation_methods:
        if method == AggregationMethod.METACULUS_PREDICTION:
            # saved in the database - not reproducable or updateable
            full_summary[method] = list(
                AggregateForecast.objects.filter(
                    question_id=question.id, method=method
                ).order_by("start_time")
            )
            continue

        aggregation_history: list[AggregateForecast] = []
        AggregationGenerator: Aggregation = get_aggregation_by_name(method)(
            question=question,
            user_ids=forecaster_ids,
        )

        last_historical_entry_index = -1
        now = timezone.now()
        for entry in forecast_history:
            if entry.timestep < now:
                last_historical_entry_index += 1

            break
        for i, forecast_set in enumerate(forecast_history):
            if histogram is not None:
                include_histogram = histogram and (
                    question.type
                    in [
                        Question.QuestionType.BINARY,
                        Question.QuestionType.MULTIPLE_CHOICE,
                    ]
                )
            else:
                include_histogram = (
                    question.type == Question.QuestionType.BINARY
                    and i == (len(forecast_history) - 1)
                )

            if forecast_set.forecasts_values:
                new_entry = AggregationGenerator.calculate_aggregation_entry(
                    forecast_set,
                    include_stats=include_stats,
                    histogram=include_histogram,
                )
                if aggregation_history and aggregation_history[-1].end_time is None:
                    aggregation_history[-1].end_time = new_entry.start_time
                aggregation_history.append(new_entry)
            else:
                if aggregation_history:
                    aggregation_history[-1].end_time = forecast_set.timestep
        full_summary[method] = aggregation_history

    return full_summary
