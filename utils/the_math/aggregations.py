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
from itertools import chain
from dataclasses import dataclass, field, replace
from functools import cached_property
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Any, Iterable, Sequence

import numpy as np
import sentry_sdk
from django.db.models import F, Q, QuerySet
from django.utils import timezone

from projects.permissions import ObjectPermission
from questions.models import (
    QUESTION_CONTINUOUS_TYPES,
    Question,
    Forecast,
    AggregateForecast,
)
from questions.types import AggregationMethod
from scoring.models import LeaderboardEntry, Reputation
from scoring.reputations import REPUTATION_FORMULAS
from users.models import User
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
    forecaster_ids: list[int] = list
    timesteps: list[datetime] = list
    _timesteps_epoch_cache: np.ndarray | None = field(
        default=None, repr=False, compare=False
    )

    def timesteps_epoch(self) -> np.ndarray:
        """`timesteps` as epoch seconds, computed once and cached"""
        if self._timesteps_epoch_cache is None:
            self._timesteps_epoch_cache = np.array(
                [t.timestamp() for t in self.timesteps]
            )
        return self._timesteps_epoch_cache


# Helpers ##########################################


def get_histogram(
    values: ForecastsValues,
    weights: Weights,
    question_type: Question.QuestionType,
) -> np.ndarray:
    values = np.asarray(values)
    if len(values) == 0:
        return np.zeros(100)
    if weights is None:
        weights = np.ones(len(values))
    transposed_values = values.T
    if question_type == Question.QuestionType.BINARY:
        if np.any(np.equal(values, None)):
            raise ValueError("Forecast values contain None values")
        histogram = np.zeros(100)
        for p, w in zip(transposed_values[1], weights):
            histogram[int(p * 100)] += w
        return histogram
    histogram = np.zeros((len(values[0]), 100))
    for forecast_values, w in zip(values, weights):
        for i, p in enumerate(forecast_values):
            if p is not None:
                histogram[i, int(p * 100)] += w
    return histogram


def compute_discrete_forecast_values(
    forecasts_values: ForecastsValues,
    weights: Weights = None,
    percentile: float | list[float] | Percentiles = 50.0,
) -> ForecastsValues:
    forecasts_values = np.asarray(forecasts_values)
    if isinstance(percentile, float):
        percentile = np.array([percentile])
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


def compute_weighted_semi_standard_deviations(
    forecasts_values: ForecastsValues,
    weights: Weights | None,
) -> tuple[ForecastValues, ForecastValues]:
    """returns the upper and lower standard_deviations"""
    forecasts_values = np.array(forecasts_values)
    forecasts_values[np.equal(forecasts_values, None)] = np.nan
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
    def __init__(self, **kwargs):
        pass

    @classmethod
    def transition_times(cls, question: Question, **kwargs) -> list[datetime]:
        """Times, other than forecasts starting and ending, at which these
        weights can change. kwargs are the weighting's own parameters."""
        return []

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


# FilterWeightings ##########################################


class Filtered(Weighted):
    """Filter by user (yes, no)"""

    def __init__(self, all_forecaster_ids: list[int] | set[int] | None, **kwargs):
        if all_forecaster_ids is None:
            raise ValueError("all_forecaster_ids must be provided")
        self.filter: set[int] = self.get_filter(all_forecaster_ids)

    def get_filter(self, all_forecaster_ids: list[int] | set[int]) -> set[int]:
        raise NotImplementedError("Implement in Child Class")

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        return np.array(
            [user_id in self.filter for user_id in forecast_set.forecaster_ids]
        )


class JoinedBeforeFiltered(Filtered):
    """Filters for only forecasts by users who joined before a given date"""

    def __init__(self, joined_before: datetime | None, **kwargs):
        if joined_before is None:
            raise ValueError("joined_before must be provided")
        self.joined_before = joined_before
        super().__init__(joined_before=joined_before, **kwargs)

    def get_filter(self, all_forecaster_ids: list[int] | set[int]) -> set[int]:
        return set(
            User.objects.filter(
                id__in=all_forecaster_ids,
                date_joined__lte=self.joined_before,
            ).values_list("id", flat=True)
        )


class ProsFiltered(Filtered):
    """Filters for only forecasts by Pro users"""

    def get_filter(self, all_forecaster_ids: list[int] | set[int]) -> set[int]:
        return set(
            User.objects.filter(
                id__in=all_forecaster_ids,
                metadata__pro_details__isnull=False,
            ).values_list("id", flat=True)
        )


# TimeDecays ##########################################
#
# The decay term of DecayReputationWeighted: how much a forecast is discounted
# for its age. t_now is forecast_set.timestep, t_i a forecast's start_time.


class TimeDecay:
    """Computes the decay for every forecast in a ForecastSet, aligned with
    forecast_set.forecaster_ids"""

    def __init__(self, question: Question, **kwargs):
        self.question = question

    @cached_property
    def question_duration_seconds(self) -> float:
        # Lazy: questions without an open or close time can't have forecasts to
        # decay, but are still built (to an empty history)
        return (
            self.question.scheduled_close_time - self.question.open_time
        ).total_seconds()

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        raise NotImplementedError("Implement in Child Class")


class ExponentialLifetimeDecay(TimeDecay):
    """exp(-(t_now - t_i) / (t_close - t_open)): age measured relative to the
    question's lifetime"""

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        age = forecast_set.timestep.timestamp() - forecast_set.timesteps_epoch()
        return np.exp(-age / self.question_duration_seconds)


class ExponentialDaysDecay(TimeDecay):
    """exp(-(t_now - t_i)) with age in days, independent of the question's
    lifetime"""

    SECONDS_PER_DAY = 86400.0

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        age = forecast_set.timestep.timestamp() - forecast_set.timesteps_epoch()
        return np.exp(-age / self.SECONDS_PER_DAY)


class OldMetaculusStyleDecay(TimeDecay):
    """(t_i - t_open) / (t_close - t_open): the old Metaculus Prediction's time
    weight, which depends only on when in the question's life the forecast was
    made"""

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        open_epoch = self.question.open_time.timestamp()
        return (
            forecast_set.timesteps_epoch() - open_epoch
        ) / self.question_duration_seconds


class LinearDecay(TimeDecay):
    """(t_close - t_open) / (t_close - t_i): grows as forecasts are made closer
    to the close time"""

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        close_epoch = self.question.scheduled_close_time.timestamp()
        return self.question_duration_seconds / (
            close_epoch - forecast_set.timesteps_epoch()
        )


class OrdinalDecay(TimeDecay):
    """RecencyWeighted's rank-based weight, e^(sqrt(n) - sqrt(N))"""

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        n = len(forecast_set.forecaster_ids)
        if n == 0:
            return np.array([])
        return np.exp(np.sqrt(np.arange(n) + 1) - np.sqrt(n))


class NoDecay(TimeDecay):
    """1 for every forecast"""

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        return np.ones(len(forecast_set.forecaster_ids))


class SpotSensitiveDecay(TimeDecay):
    """Wraps another TimeDecay: no decay at all before the question's spot
    scoring time (when the CP is typically still hidden, so nobody has been
    prompted to update), the wrapped decay from then on"""

    def __init__(
        self,
        question: Question,
        wrapped_decay_class: type[TimeDecay] = ExponentialLifetimeDecay,
        **kwargs,
    ):
        super().__init__(question=question, **kwargs)
        self.wrapped_decay = wrapped_decay_class(question=question, **kwargs)
        spot_time = question.get_spot_scoring_time()
        self.spot_scoring_epoch = spot_time.timestamp() if spot_time else None

    def compute(self, forecast_set: ForecastSet) -> np.ndarray:
        if (
            self.spot_scoring_epoch is not None
            and forecast_set.timestep.timestamp() < self.spot_scoring_epoch
        ):
            return np.ones(len(forecast_set.forecaster_ids))
        return self.wrapped_decay.compute(forecast_set)


TIME_DECAYS: dict[str, type[TimeDecay]] = {
    "exponential_lifetime": ExponentialLifetimeDecay,
    "exponential_days": ExponentialDaysDecay,
    "old_metaculus": OldMetaculusStyleDecay,
    "linear": LinearDecay,
    "ordinal": OrdinalDecay,
    "none": NoDecay,
}


# WeightCombiners ##########################################
#
# How DecayReputationWeighted turns a decay and a reputation into one weight.
# Two families, which read `a` and `b` differently:
#   GeometricWeightCombiner splits one overall sharpness `b` across the two
#   terms with an a / (1-a) mix.
#   The rest treat `a` and `b` as independent exponents on decay and
#   reputation, and `c` as the mix between the two terms.
# GeometricWeightCombiner(a, b) == GeometricPowerWeightCombiner(a*b, (1-a)*b).

# Floor applied before any division or negative power, so a zero decay can't
# turn a harmonic or negative-p generalized mean into inf/nan
COMBINER_EPSILON = 1e-12


def scale_to_unit_max(values: np.ndarray) -> np.ndarray:
    """Rescales so the largest entry is 1. Only ratios between weights at one
    timestep matter, so this is free for multiplicative combiners and makes
    additive ones mix decay and reputation on a common scale."""
    largest = np.max(values) if values.size else 0.0
    if not np.isfinite(largest) or largest <= 0:
        return values
    return values / largest


class WeightCombiner:
    def __init__(
        self,
        a: float = 0.5,
        b: float = 6.0,
        c: float = 0.5,
        p: float = 1.0,
        **kwargs,
    ):
        self.a = a
        self.b = b
        self.c = c
        self.p = p

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        raise NotImplementedError("Implement in Child Class")

    def _finalize(self, weights: np.ndarray) -> Weights:
        if np.all(weights == 0):
            return None
        return weights if weights.size else None

    def _terms(
        self, decays: np.ndarray, reputation: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        """(decay**a, reputation**b), each rescaled to a unit maximum first"""
        tau = np.maximum(scale_to_unit_max(decays), COMBINER_EPSILON) ** self.a
        rep = np.maximum(scale_to_unit_max(reputation), COMBINER_EPSILON) ** self.b
        return tau, rep


class GeometricWeightCombiner(WeightCombiner):
    """(decay**a * reputation**(1-a))**b"""

    def __init__(self, a: float = 0.5, b: float = 6.0, **kwargs):
        super().__init__(a=a, b=b, **kwargs)

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        return self._finalize((decays**self.a * reputation ** (1 - self.a)) ** self.b)


class GeometricPowerWeightCombiner(WeightCombiner):
    """decay**a * reputation**b"""

    def __init__(self, a: float = 3.0, b: float = 3.0, **kwargs):
        super().__init__(a=a, b=b, **kwargs)

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        tau, rep = self._terms(decays, reputation)
        return self._finalize(tau * rep)


class ArithmeticWeightCombiner(WeightCombiner):
    """c * decay**a + (1-c) * reputation**b. Either term alone can carry a
    forecast's weight."""

    def __init__(self, a: float = 3.0, b: float = 3.0, c: float = 0.5, **kwargs):
        super().__init__(a=a, b=b, c=c, **kwargs)

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        tau, rep = self._terms(decays, reputation)
        return self._finalize(self.c * tau + (1 - self.c) * rep)


class HarmonicWeightCombiner(WeightCombiner):
    """(c / decay**a + (1-c) / reputation**b)**-1. Either term near zero drags
    the weight to near zero."""

    def __init__(self, a: float = 3.0, b: float = 3.0, c: float = 0.5, **kwargs):
        super().__init__(a=a, b=b, c=c, **kwargs)

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        tau, rep = self._terms(decays, reputation)
        denominator = self.c / tau + (1 - self.c) / rep
        return self._finalize(np.where(denominator > 0, 1.0 / denominator, 0.0))


class GeneralizedMeanWeightCombiner(WeightCombiner):
    """(c * decay**(a*p) + (1-c) * reputation**(b*p))**(1/p): arithmetic at
    p=1, harmonic at p=-1, geometric as p->0"""

    def __init__(
        self,
        a: float = 3.0,
        b: float = 3.0,
        c: float = 0.5,
        p: float = 1.0,
        **kwargs,
    ):
        super().__init__(a=a, b=b, c=c, p=p, **kwargs)

    def combine(self, decays: np.ndarray, reputation: np.ndarray) -> Weights:
        tau, rep = self._terms(decays, reputation)
        if abs(self.p) < 1e-9:
            return self._finalize(tau**self.c * rep ** (1 - self.c))
        blended = self.c * tau**self.p + (1 - self.c) * rep**self.p
        blended = np.maximum(blended, COMBINER_EPSILON)
        return self._finalize(blended ** (1.0 / self.p))


WEIGHT_COMBINERS: dict[str, type[WeightCombiner]] = {
    "geometric": GeometricWeightCombiner,
    "geometric_power": GeometricPowerWeightCombiner,
    "arithmetic": ArithmeticWeightCombiner,
    "harmonic": HarmonicWeightCombiner,
    "generalized": GeneralizedMeanWeightCombiner,
}


# ReputationWeightings ##########################################

# user_id -> (times as epoch seconds, values, contributions), sorted by time
ReputationArrays = dict[int, tuple[np.ndarray, np.ndarray, np.ndarray]]


def _reputation_arrays(
    rows: Iterable[tuple[int, datetime, float, float]],
) -> ReputationArrays:
    """Groups (user_id, time, value, contribution) rows into ReputationArrays"""
    by_user: dict[int, list[tuple[float, float, float]]] = defaultdict(list)
    for user_id, time, value, contribution in rows:
        by_user[user_id].append((time.timestamp(), value, contribution))
    arrays: ReputationArrays = {}
    for user_id, history in by_user.items():
        history.sort(key=lambda entry: entry[0])
        times, values, contributions = np.array(history).T
        arrays[user_id] = (times, values, contributions)
    return arrays


class ReputationWeighted(Weighted):
    """Uses a Reputation to calculate a forecast's weight.
    Requires `get_reputation_history`, which returns each forecaster's
    Reputations sorted by time, or an override of `get_reputation_arrays`. A
    forecaster's reputation is the latest one at or before the time
    `_lookup_epochs` gives (the timestep by default), 0 if none."""

    def __init__(
        self,
        question: Question,
        all_forecaster_ids: list[int] | set[int] | None,
        forecast_history: Sequence[ForecastSet] | None = None,
        **kwargs,
    ):
        if question is None or all_forecaster_ids is None:
            raise ValueError("question and all_forecaster_ids must be provided")
        self.question = question
        time_range = None
        if forecast_history:
            epochs = np.concatenate(
                [self._lookup_epochs(forecast_set) for forecast_set in forecast_history]
            )
            if epochs.size:
                time_range = (
                    datetime.fromtimestamp(epochs.min(), dt_timezone.utc),
                    datetime.fromtimestamp(epochs.max(), dt_timezone.utc),
                )
        self.reputations: ReputationArrays = self.get_reputation_arrays(
            all_forecaster_ids, time_range
        )
        # With the full history known up front, look every reputation up in one
        # batched pass per user rather than one search per forecast per timestep
        self._precomputed: dict[int, tuple[np.ndarray, np.ndarray]] = {}
        if forecast_history:
            self._precomputed = self._precompute_reputations(forecast_history)

    def get_reputation_history(
        self, all_forecaster_ids: list[int] | set[int]
    ) -> dict[int, list[Reputation]]:
        raise NotImplementedError("Implement in Child Class")

    def _lookup_epochs(self, forecast_set: ForecastSet) -> np.ndarray:
        """When each of forecast_set's forecasters' reputation is read"""
        return np.full(
            len(forecast_set.forecaster_ids), forecast_set.timestep.timestamp()
        )

    def get_reputation_arrays(
        self,
        all_forecaster_ids: list[int] | set[int],
        time_range: tuple[datetime, datetime] | None,
    ) -> ReputationArrays:
        """time_range is the (earliest, latest) timestep that will be looked up,
        when known. Lookups outside it are unsupported, so an override may skip
        reputations that can't affect them."""
        return _reputation_arrays(
            (user_id, r.time, r.value, r.contribution)
            for user_id, history in self.get_reputation_history(
                all_forecaster_ids
            ).items()
            for r in history
        )

    def _lookup(
        self, user_id: int, epochs: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        """(values, contributions) of user_id's reputation at each of epochs"""
        arrays = self.reputations.get(user_id)
        if arrays is None:
            return np.zeros(len(epochs)), np.zeros(len(epochs))
        times, values, contributions = arrays
        indexes = np.searchsorted(times, epochs, side="right") - 1
        found = indexes >= 0
        indexes = np.maximum(indexes, 0)
        return (
            np.where(found, values[indexes], 0.0),
            np.where(found, contributions[indexes], 0.0),
        )

    def _precompute_reputations(
        self, forecast_history: Sequence[ForecastSet]
    ) -> dict[int, tuple[np.ndarray, np.ndarray]]:
        """id(forecast_set) -> (values, contributions) for every forecast_set"""
        forecast_history = list(forecast_history)
        lengths = np.array([len(fs.forecaster_ids) for fs in forecast_history])
        # every (forecast_set, forecaster) pair, flattened
        users = np.fromiter(
            chain.from_iterable(fs.forecaster_ids for fs in forecast_history),
            dtype=np.int64,
            count=lengths.sum(),
        )
        epochs = np.concatenate([self._lookup_epochs(fs) for fs in forecast_history])
        values = np.zeros(len(users))
        contributions = np.zeros(len(users))
        order = np.argsort(users, kind="stable")
        unique_users, group_starts = np.unique(users[order], return_index=True)
        for user_id, group in zip(unique_users, np.split(order, group_starts[1:])):
            values[group], contributions[group] = self._lookup(
                int(user_id), epochs[group]
            )
        split_points = np.cumsum(lengths)[:-1]
        return {
            id(forecast_set): (set_values, set_contributions)
            for forecast_set, set_values, set_contributions in zip(
                forecast_history,
                np.split(values, split_points),
                np.split(contributions, split_points),
            )
        }

    def _live_reputations(
        self, forecast_set: ForecastSet
    ) -> tuple[np.ndarray, np.ndarray]:
        values = np.zeros(len(forecast_set.forecaster_ids))
        contributions = np.zeros(len(forecast_set.forecaster_ids))
        epochs = self._lookup_epochs(forecast_set)
        for i, user_id in enumerate(forecast_set.forecaster_ids):
            user_values, user_contributions = self._lookup(user_id, epochs[i : i + 1])
            values[i] = user_values[0]
            contributions[i] = user_contributions[0]
        return values, contributions

    def get_reputations(
        self, forecast_set: ForecastSet
    ) -> tuple[np.ndarray, np.ndarray]:
        """(values, contributions) of the reputation of each of
        forecast_set.forecaster_ids (see `_lookup_epochs`), 0 where there is
        none"""
        precomputed = self._precomputed.get(id(forecast_set))
        if precomputed is not None and len(precomputed[0]) == len(
            forecast_set.forecaster_ids
        ):
            return precomputed
        return self._live_reputations(forecast_set)

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        return self.get_reputations(forecast_set)[0]


class DecayReputationWeighted(ReputationWeighted):
    """Combines a time decay with a stored Reputation:
        reputation = max(formula(value, contribution; rho, gamma), e)
        weight = combiner(decay, reputation; a, b, c, p)
    See REPUTATION_FORMULAS, TIME_DECAYS and WEIGHT_COMBINERS for the options.
    `pre_spot_decay` turns off the decay before the spot scoring time (see
    SpotSensitiveDecay). a/b default per combiner, since the two combiner
    families read them differently."""

    def __init__(
        self,
        question: Question,
        all_forecaster_ids: list[int] | set[int] | None,
        reputation_type: str = Reputation.ReputationTypes.AVERAGE_PEER_SCORE,
        reputation_formula: str = "none",
        rho: float = 0.0,
        gamma: float = 0.0,
        e: float = 1e-6,
        time_decay: str = "exponential_lifetime",
        pre_spot_decay: bool = False,
        combiner: str = "geometric",
        a: float | None = None,
        b: float | None = None,
        c: float = 0.5,
        p: float = 1.0,
        **kwargs,
    ):
        # read by get_reputation_arrays, which super().__init__ calls
        self.reputation_type = reputation_type
        super().__init__(question, all_forecaster_ids, **kwargs)
        self.reputation_formula = REPUTATION_FORMULAS[reputation_formula]
        self.rho = rho
        self.gamma = gamma
        self.e = e
        decay_class = TIME_DECAYS[time_decay]
        if pre_spot_decay:
            self.time_decay = SpotSensitiveDecay(
                question=question, wrapped_decay_class=decay_class
            )
        else:
            self.time_decay = decay_class(question=question)
        combiner_kwargs = {"c": c, "p": p}
        if a is not None:
            combiner_kwargs["a"] = a
        if b is not None:
            combiner_kwargs["b"] = b
        self.combiner = WEIGHT_COMBINERS[combiner](**combiner_kwargs)

    def _lookup_epochs(self, forecast_set: ForecastSet) -> np.ndarray:
        # A forecast keeps the reputation its forecaster had when it was made
        return forecast_set.timesteps_epoch()

    @classmethod
    def transition_times(
        cls, question: Question, pre_spot_decay: bool = False, **kwargs
    ) -> list[datetime]:
        # the decay switches on at the spot scoring time
        spot_time = question.get_spot_scoring_time() if pre_spot_decay else None
        return [spot_time] if spot_time else []

    def get_reputation_arrays(
        self,
        all_forecaster_ids: list[int] | set[int],
        time_range: tuple[datetime, datetime] | None,
    ) -> ReputationArrays:
        reputations = Reputation.objects.filter(
            user_id__in=all_forecaster_ids, type=self.reputation_type
        )
        fields = ("user_id", "time", "value", "contribution")
        if time_range is None:
            return _reputation_arrays(reputations.values_list(*fields))
        earliest, latest = time_range
        # each user's reputation as of the earliest lookup, then every change
        # until the latest one
        starting = (
            reputations.filter(time__lte=earliest)
            .order_by("user_id", "-time")
            .distinct("user_id")
            .values_list(*fields)
        )
        changes = reputations.filter(time__gt=earliest, time__lte=latest).values_list(
            *fields
        )
        return _reputation_arrays(chain(starting, changes))

    def calculate_weights(self, forecast_set: ForecastSet) -> Weights:
        values, contributions = self.get_reputations(forecast_set)
        reputation = np.maximum(
            self.reputation_formula(values, contributions, self.rho, self.gamma),
            self.e,
        )
        decays = self.time_decay.compute(forecast_set)
        return self.combiner.combine(decays, reputation)


class MedalistsReputationWeighted(ReputationWeighted):
    """Filters out forecasts by users with no medals"""

    medal_filter = Q(medal__isnull=False)

    def get_reputation_history(
        self, all_forecaster_ids: list[int] | set[int]
    ) -> dict[int, list[Reputation]]:
        start = self.question.open_time
        end = self.question.scheduled_close_time
        if end is None:
            end = timezone.now()
        medals = (
            LeaderboardEntry.objects.filter(
                self.medal_filter,
                user_id__in=all_forecaster_ids,
                leaderboard__project__default_permission=ObjectPermission.FORECASTER,
            )
            .annotate(set_time=F("leaderboard__finalize_time"))
            .filter(set_time__lte=end)
            .order_by("set_time")
        )

        # setup
        reputations: dict[int, list[Reputation]] = defaultdict(list)

        # Establish initial reputations at the start of the interval.
        old_medals = list(medals.filter(set_time__lte=start).order_by("set_time"))
        for medal in old_medals:
            user_id = medal.user_id
            reputations[user_id] = [Reputation(user_id=user_id, value=1, time=start)]
        for user_id in all_forecaster_ids:
            if user_id not in reputations:
                reputations[user_id] = [
                    Reputation(user_id=user_id, value=0, time=start)
                ]
        # Then, for each new medal, add a new reputation record
        new_medals = list(medals.filter(set_time__gt=start).order_by("set_time"))
        for medal in new_medals:
            user_id = medal.user_id
            if reputations[user_id][-1].value == 0:
                reputations[user_id].append(
                    Reputation(
                        user_id=user_id,
                        value=1,
                        time=medal.edited_at or medal.created_at,
                    )
                )
        return reputations


class SilverMedalistsReputationWeighted(MedalistsReputationWeighted):
    """Filters for only forecasts by users with silver or better medals"""

    medal_filter = Q(
        medal__in=[
            LeaderboardEntry.Medals.GOLD,
            LeaderboardEntry.Medals.SILVER,
        ]
    )


class GoldMedalistsReputationWeighted(MedalistsReputationWeighted):
    """Filters for only forecasts by users with gold medals"""

    medal_filter = Q(medal=LeaderboardEntry.Medals.GOLD)


# Aggregators ##########################################
#
# Every method takes `forecasts_values_array`, forecast_set.forecasts_values
# already converted to an array, so one entry converts it only once. None of
# them mutate it.


def _as_array(
    forecast_set: ForecastSet, forecasts_values_array: np.ndarray | None
) -> np.ndarray:
    if forecasts_values_array is not None:
        return forecasts_values_array
    return np.asarray(forecast_set.forecasts_values)


class AggregatorMixin:
    """
    The method of aggregating forecasts, given their weights
    requires `calculate_forecast_values` and `get_range_values`
    """

    question: Question

    def calculate_forecast_values(
        self,
        forecast_set: ForecastSet,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> np.ndarray:
        raise NotImplementedError("Implementation required in Mixin")

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> RangeValuesType:
        raise NotImplementedError("Implementation required in Mixin")


def _discrete_percentile_ranges(
    question: Question,
    forecasts_values: np.ndarray,
    aggregation_forecast_values: ForecastValues,
    weights: np.ndarray | None,
) -> RangeValuesType:
    """Per-column weighted quartiles. For MC, rescaled so the center matches
    the (normalized) aggregate."""
    if question.type == Question.QuestionType.BINARY:
        return compute_discrete_forecast_values(
            forecasts_values, weights, [25.0, 50.0, 75.0]
        )
    non_nans = ~np.isnan(forecasts_values[0]) if forecasts_values.size else []
    lowers, centers, uppers = compute_discrete_forecast_values(
        forecasts_values, weights, [25.0, 50.0, 75.0]
    )
    centers_array = np.array(centers)
    centers_array[np.equal(centers_array, 0.0)] = 1.0  # avoid divide by zero
    normalized_centers = np.array(aggregation_forecast_values)
    normalized_lowers = np.array(lowers)
    normalized_lowers[non_nans] = (
        normalized_lowers[non_nans]
        * normalized_centers[non_nans]
        / centers_array[non_nans]
    )
    normalized_uppers = np.array(uppers)
    normalized_uppers[non_nans] = (
        normalized_uppers[non_nans]
        * normalized_centers[non_nans]
        / centers_array[non_nans]
    )
    return (
        normalized_lowers.tolist(),
        normalized_centers.tolist(),
        normalized_uppers.tolist(),
    )


def _continuous_ranges(aggregation_forecast_values: ForecastValues) -> RangeValuesType:
    if np.any(np.equal(aggregation_forecast_values, None)):
        raise ValueError("Forecast values contain None values")
    lowers, centers, uppers = percent_point_function(
        aggregation_forecast_values, [25.0, 50.0, 75.0]
    )
    return [lowers], [centers], [uppers]


class MedianAggregatorMixin:
    """
    Takes the median of the forecasts values for Binary and MC, mean for continuous
    """

    question: Question

    def calculate_forecast_values(
        self,
        forecast_set: ForecastSet,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> np.ndarray:
        # Default Aggregation method uses weighted medians for binary and MC questions
        # and weighted average for continuous
        forecasts_values = _as_array(forecast_set, forecasts_values_array)
        if self.question.type == Question.QuestionType.BINARY:
            return np.array(
                compute_discrete_forecast_values(forecasts_values, weights, 50.0)[0]
            )
        elif self.question.type == Question.QuestionType.MULTIPLE_CHOICE:
            arr = np.array(
                compute_discrete_forecast_values(forecasts_values, weights, 50.0)[0]
            )
            non_nans = ~np.isnan(arr) if arr.size else []
            arr[non_nans] -= 0.001  # remove minimum forecastable value
            arr[non_nans] = arr[non_nans] / sum(arr[non_nans])  # renormalize
            # squeeze into forecastable value range
            arr[non_nans] = arr[non_nans] * (1 - len(arr[non_nans]) * 0.001) + 0.001
            return arr
        else:  # continuous
            return np.average(forecasts_values, axis=0, weights=weights)

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> RangeValuesType:
        if self.question.type in QUESTION_CONTINUOUS_TYPES:
            return _continuous_ranges(aggregation_forecast_values)
        return _discrete_percentile_ranges(
            self.question,
            _as_array(forecast_set, forecasts_values_array),
            aggregation_forecast_values,
            weights,
        )


class MeanAggregatorMixin:
    """Takes the mean of the forecast values"""

    question: Question

    def calculate_forecast_values(
        self,
        forecast_set: ForecastSet,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> np.ndarray:
        forecasts_values = _as_array(forecast_set, forecasts_values_array)
        forecast_values = (
            forecasts_values[0].copy() if forecasts_values.size else np.array([])
        )
        non_nones = np.logical_not(np.equal(forecast_values, None))
        forecast_values[non_nones] = np.average(
            forecasts_values[:, non_nones], axis=0, weights=weights
        )
        return forecast_values

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> RangeValuesType:
        if self.question.type in QUESTION_CONTINUOUS_TYPES:
            return _continuous_ranges(aggregation_forecast_values)
        centers = np.array(aggregation_forecast_values)
        lowers_sd, uppers_sd = compute_weighted_semi_standard_deviations(
            _as_array(forecast_set, forecasts_values_array), weights
        )
        non_nones = np.logical_not(np.equal(centers, None))
        lowers = centers.copy()
        uppers = centers.copy()
        lowers[non_nones] = centers[non_nones] - lowers_sd[non_nones]
        uppers[non_nones] = centers[non_nones] + uppers_sd[non_nones]
        return lowers.tolist(), centers.tolist(), uppers.tolist()


LOGIT_EPSILON = 1e-6


def _logit(values: np.ndarray) -> np.ndarray:
    """log(p / (1-p)), clamped away from 0 and 1. None becomes NaN."""
    arr = np.array(values, dtype=object)
    arr[np.equal(arr, None)] = np.nan
    p = np.clip(arr.astype(float), LOGIT_EPSILON, 1 - LOGIT_EPSILON)
    return np.log(p / (1 - p))


def _sigmoid(values: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-values))


class LogOddsMeanAggregatorMixin:
    """Takes the mean of the forecast values in log-odds space, per column"""

    question: Question

    def calculate_forecast_values(
        self,
        forecast_set: ForecastSet,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> np.ndarray:
        forecasts_values = _as_array(forecast_set, forecasts_values_array)
        forecast_values = (
            forecasts_values[0].copy() if forecasts_values.size else np.array([])
        )
        non_nones = np.logical_not(np.equal(forecast_values, None))
        mean_logit = np.average(
            _logit(forecasts_values[:, non_nones]), axis=0, weights=weights
        )
        forecast_values[non_nones] = _sigmoid(mean_logit)
        return forecast_values

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> RangeValuesType:
        if self.question.type in QUESTION_CONTINUOUS_TYPES:
            return _continuous_ranges(aggregation_forecast_values)
        # semi-standard deviations in log-odds space keep the bounds in (0, 1)
        centers = np.array(aggregation_forecast_values, dtype=object)
        non_nones = np.logical_not(np.equal(centers, None))
        lowers_sd, uppers_sd = compute_weighted_semi_standard_deviations(
            _logit(_as_array(forecast_set, forecasts_values_array)), weights
        )
        center_logit = _logit(centers)
        lowers = centers.copy()
        uppers = centers.copy()
        lowers[non_nones] = _sigmoid(center_logit[non_nones] - lowers_sd[non_nones])
        uppers[non_nones] = _sigmoid(center_logit[non_nones] + uppers_sd[non_nones])
        return lowers.tolist(), centers.tolist(), uppers.tolist()


GEOMETRIC_MEDIAN_MAX_ITER = 300
GEOMETRIC_MEDIAN_TOL = 1e-6
GEOMETRIC_MEDIAN_DISTANCE_FLOOR = 1e-8


def _weighted_median_along_line(coords: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Exact weighted median of each row of `coords` (T, U) under `weights`
    (T, U): the smallest coordinate whose cumulative weight reaches half the
    row's total, or the midpoint to the next one when it lands exactly on half"""
    order = np.argsort(coords, axis=1)
    sorted_coords = np.take_along_axis(coords, order, axis=1)
    cumulative = np.cumsum(np.take_along_axis(weights, order, axis=1), axis=1)
    half = 0.5 * cumulative[:, -1]
    rows = np.arange(coords.shape[0])
    last = coords.shape[1] - 1
    k = np.minimum((cumulative < half[:, None]).sum(axis=1), last)
    median = sorted_coords[rows, k]
    on_half = np.isclose(cumulative[rows, k], half, rtol=1e-12, atol=0.0) & (k < last)
    following = sorted_coords[rows, np.minimum(k + 1, last)]
    return np.where(on_half, 0.5 * (median + following), median)


def _on_line(points: np.ndarray) -> bool:
    """Whether (U, 2) points all share one coordinate sum, as every binary PMF
    does"""
    return points.shape[1] == 2 and np.allclose(points.sum(axis=1), points[0].sum())


def _weighted_geometric_median(
    points: np.ndarray,
    weights: np.ndarray | None,
    max_iter: int = GEOMETRIC_MEDIAN_MAX_ITER,
    tol: float = GEOMETRIC_MEDIAN_TOL,
) -> np.ndarray:
    """Weiszfeld's algorithm for the point minimizing sum(w_i * ||P - p_i||).
    Points on a line (binary) use the exact 1-D weighted median instead, which
    Weiszfeld only approaches slowly there."""
    weights = (
        np.ones(points.shape[0])
        if weights is None
        else np.asarray(weights, dtype=float)
    )
    if _on_line(points):
        median = _weighted_median_along_line(points[None, :, 1], weights[None, :])[0]
        return np.array([points[0].sum() - median, median])
    estimate = np.average(points, axis=0, weights=weights)
    for _ in range(max_iter):
        distances = np.maximum(
            np.linalg.norm(points - estimate, axis=1), GEOMETRIC_MEDIAN_DISTANCE_FLOOR
        )
        new_estimate = np.average(points, axis=0, weights=weights / distances)
        if np.linalg.norm(new_estimate - estimate) < tol:
            estimate = new_estimate
            break
        estimate = new_estimate
    return estimate


class GeometricMedianAggregatorMixin:
    """The multi-dimensional weighted median of the whole forecast vector, as
    opposed to MedianAggregatorMixin's per-column median. Identical to it on
    binary questions; on MC and continuous the result is already normalized.
    Ranges use the same per-column percentiles as MedianAggregatorMixin."""

    question: Question

    def calculate_forecast_values(
        self,
        forecast_set: ForecastSet,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> np.ndarray:
        forecasts_values = _as_array(forecast_set, forecasts_values_array)
        forecast_values = (
            forecasts_values[0].copy() if forecasts_values.size else np.array([])
        )
        non_nones = np.logical_not(np.equal(forecast_values, None))
        if non_nones.any():
            points = forecasts_values[:, non_nones].astype(float)
            forecast_values[non_nones] = _weighted_geometric_median(points, weights)
        return forecast_values

    def get_range_values(
        self,
        forecast_set: ForecastSet,
        aggregation_forecast_values: ForecastValues,
        weights: np.ndarray | None = None,
        forecasts_values_array: np.ndarray | None = None,
    ) -> RangeValuesType:
        if self.question.type in QUESTION_CONTINUOUS_TYPES:
            return _continuous_ranges(aggregation_forecast_values)
        return _discrete_percentile_ranges(
            self.question,
            _as_array(forecast_set, forecasts_values_array),
            aggregation_forecast_values,
            weights,
        )


# Aggregations ##########################################

# A weighting class, optionally with the keyword arguments to build it with
WeightingSpec = type[Weighted] | tuple[type[Weighted], dict[str, Any]]


def _weighting_class(spec: WeightingSpec) -> type[Weighted]:
    return spec[0] if isinstance(spec, tuple) else spec


class Aggregation(AggregatorMixin):
    """Base class for actual Aggregations.
    Any class Inheriting this one must also inherit from a single Aggregator class.
    Multiple weightings/filters are allowed. Their classes must be listed in the
        `weighting_classes` property. They will be applied multiplicatively in order.
        An entry can be a (class, kwargs) tuple to parametrize that weighting.
    """

    method: str = "N/A"
    weighting_classes: list[WeightingSpec] = []  # defined in subclasses

    def __init__(
        self,
        question: Question,
        all_forecaster_ids: list[int] | set[int] | None = None,
        joined_before: datetime | None = None,
        forecast_history: Sequence[ForecastSet] | None = None,
    ):
        self.question = question
        self.weightings: list[Weighted] = []
        for spec in self.weighting_classes:
            Klass, kwargs = spec if isinstance(spec, tuple) else (spec, {})
            self.weightings.append(
                Klass(
                    question=question,
                    all_forecaster_ids=all_forecaster_ids,
                    joined_before=joined_before,
                    forecast_history=forecast_history,
                    **kwargs,
                )
            )

    @classmethod
    def transition_times(cls, question: Question) -> list[datetime]:
        """Times, other than forecasts starting and ending, at which this
        aggregation can change, so its history needs an entry at each"""
        times: set[datetime] = set()
        for spec in cls.weighting_classes:
            Klass, kwargs = spec if isinstance(spec, tuple) else (spec, {})
            times.update(Klass.transition_times(question, **kwargs))
        return sorted(times)

    def get_weights(self, forecast_set: ForecastSet) -> Weights | int:
        """returns 0 as a sentinel for uniform 0 weights"""
        weights = None
        for weighting in self.weightings:
            new_weights = weighting.calculate_weights(forecast_set)
            if weights is None:
                weights = new_weights
            elif new_weights is not None:
                weights = weights * new_weights
        if weights is None:
            return None
        if np.all(weights == 0):
            return 0
        if len(forecast_set.forecasts_values) != weights.shape[0]:
            weights = weights[0]
        return weights

    def calculate_aggregation_entry(
        self,
        forecast_set: ForecastSet,
        include_stats: bool = False,
        histogram: bool = False,
    ) -> AggregateForecast | None:
        # forecast_set can have nans in its forecasts_values, so we handle those by
        # converting nans to None when setting values on the aggregation object
        # to get nan's back from object, user get_prediction_values or get_pmf
        weights = self.get_weights(forecast_set)
        if isinstance(weights, int):
            assert weights == 0, "0 is only supported int return of get_weights"
            return None
        aggregation = AggregateForecast(question=self.question, method=self.method)
        forecasts_values_array = np.asarray(forecast_set.forecasts_values)
        forecast_values = self.calculate_forecast_values(
            forecast_set, weights, forecasts_values_array
        )
        aggregation.forecast_values = [
            None if np.isnan(v) else v for v in forecast_values
        ]

        aggregation.start_time = forecast_set.timestep
        if weights is not None:
            aggregation.forecaster_count = sum(weights > 0)
        else:
            aggregation.forecaster_count = len(forecast_set.forecasts_values)
        if include_stats:
            lowers, centers, uppers = self.get_range_values(
                forecast_set, forecast_values, weights, forecasts_values_array
            )
            aggregation.interval_lower_bounds = [
                None if np.isnan(v) else v for v in lowers
            ]
            aggregation.centers = [None if np.isnan(v) else v for v in centers]
            aggregation.interval_upper_bounds = [
                None if np.isnan(v) else v for v in uppers
            ]
            if self.question.type in [
                Question.QuestionType.BINARY,
                Question.QuestionType.MULTIPLE_CHOICE,
            ]:
                means = np.average(forecasts_values_array, weights=weights, axis=0)
                aggregation.means = [None if np.isnan(v) else v for v in means]

        if histogram and self.question.type in [
            Question.QuestionType.BINARY,
            Question.QuestionType.MULTIPLE_CHOICE,
        ]:
            aggregation.histogram = get_histogram(
                forecasts_values_array,
                weights,
                question_type=self.question.type,
            ).tolist()

        return aggregation


# Aggregations that may be stored in database


class UnweightedAggregation(MedianAggregatorMixin, Aggregation):
    method = AggregationMethod.UNWEIGHTED
    weighting_classes = [Unweighted]


class RecencyWeightedAggregation(MedianAggregatorMixin, Aggregation):
    method = AggregationMethod.RECENCY_WEIGHTED
    weighting_classes = [RecencyWeighted]


class ReputationWeightedAggregation(MeanAggregatorMixin, Aggregation):
    """Parameters tuned for a geometric median central estimate instead
    (GeometricMedianAggregatorMixin), kept in case we switch:
        a=0.7, b=4.0, e=0.15, rho=-10.0, gamma=10.0 (everything else the same)
    """

    method = AggregationMethod.REPUTATION_WEIGHTED
    weighting_classes = [
        (
            DecayReputationWeighted,
            {
                "reputation_type": Reputation.ReputationTypes.AVERAGE_PEER_SCORE,
                "reputation_formula": "continuous",
                "rho": -10.0,
                "gamma": 10.0,
                "e": 1e-4,
                "time_decay": "exponential_lifetime",
                "pre_spot_decay": True,
                "combiner": "geometric",
                "a": 0.7,
                "b": 5.5,
            },
        )
    ]


# Aggregations that can be calculated, but not stored in database


class MedalistsAggregation(MedianAggregatorMixin, Aggregation):
    method = "medalists"
    weighting_classes = [RecencyWeighted, MedalistsReputationWeighted]


class SilverMedalistsAggregation(MedianAggregatorMixin, Aggregation):
    method = "silver_medalists"
    weighting_classes = [RecencyWeighted, SilverMedalistsReputationWeighted]


class GoldMedalistsAggregation(MedianAggregatorMixin, Aggregation):
    method = "gold_medalists"
    weighting_classes = [RecencyWeighted, GoldMedalistsReputationWeighted]


class ProAggregation(MedianAggregatorMixin, Aggregation):
    method = "metaculus_pros"
    weighting_classes = [RecencyWeighted, ProsFiltered]


class JoinedBeforeDateAggregation(MedianAggregatorMixin, Aggregation):
    method = "joined_before_date"
    weighting_classes = [RecencyWeighted, JoinedBeforeFiltered]


AGGREGATIONS: list[type[Aggregation]] = [
    UnweightedAggregation,
    RecencyWeightedAggregation,
    ReputationWeightedAggregation,
    MedalistsAggregation,
    SilverMedalistsAggregation,
    GoldMedalistsAggregation,
    ProAggregation,
    JoinedBeforeDateAggregation,
]

# Methods that cannot be built without an explicit `joined_before` date
METHODS_REQUIRING_JOINED_BEFORE: list[str] = [
    aggregation.method
    for aggregation in AGGREGATIONS
    if any(
        issubclass(_weighting_class(spec), JoinedBeforeFiltered)
        for spec in aggregation.weighting_classes
    )
]


def get_aggregation_by_name(method: str) -> type[Aggregation]:
    return next(agg for agg in AGGREGATIONS if agg.method == method)


def get_aggregations_at_time(
    question: Question,
    time: datetime,
    aggregation_methods: list[AggregationMethod],
    only_include_user_ids: list[int] | set[int] | None = None,
    include_stats: bool = False,
    histogram: bool = False,
    include_bots: bool = False,
    only_bots: bool = False,
    joined_before: datetime | None = None,
) -> dict[AggregationMethod, AggregateForecast]:
    """set include_stats to True if you want to include num_forecasters, q1s, medians,
    and q3s"""
    forecasts = (
        question.user_forecasts.filter_active_at(time)
        .order_by("start_time")
        .select_related("author")
    )
    if only_include_user_ids:
        forecasts = forecasts.filter(author_id__in=only_include_user_ids)
    elif only_bots:
        forecasts = forecasts.filter(author__is_bot=True)
    else:
        # only include forecasts by non-primary bots or blacklisted users
        # if user ids explicitly specified
        forecasts = forecasts.exclude_non_primary_bots()
        forecasts = forecasts.exclude_blacklisted_users()
        if not include_bots:
            forecasts = forecasts.exclude(author__is_bot=True)
    if len(forecasts) == 0:
        return dict()
    forecast_set = ForecastSet(
        forecasts_values=[forecast.get_prediction_values() for forecast in forecasts],
        timestep=time,
        forecaster_ids=[forecast.author_id for forecast in forecasts],
        timesteps=[forecast.start_time for forecast in forecasts],
    )

    aggregations: dict[AggregationMethod, AggregateForecast] = dict()
    for method in aggregation_methods:
        aggregation_generator = get_aggregation_by_name(method)(
            question=question,
            all_forecaster_ids=set(forecast_set.forecaster_ids),
            joined_before=joined_before,
            forecast_history=[forecast_set],
        )
        new_entry = aggregation_generator.calculate_aggregation_entry(
            forecast_set,
            include_stats=include_stats,
            histogram=histogram,
        )
        if new_entry is not None:
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
    max_size dictates the maximum number of returned datetimes.
    """
    if len(history) <= max_size:
        return history
    now = timezone.now()

    # TODO: make a decision about how many future-dated entries there actually should be
    # defaults to 100 now, but is in addition to max_size, meaning we can output 500 now
    future_index = bisect_right(history, now)
    past = history[:future_index]
    h = [h.timestamp() for h in past]
    future = history[future_index:]
    future_timestamps = [h.timestamp() for h in future]
    # take evenly space future-dated data
    future_timestamps = future_timestamps[:: (len(future_timestamps) // 100) + 1]
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
    return [
        datetime.fromtimestamp(h, tz=dt_timezone.utc) for h in minimized_history
    ] + [datetime.fromtimestamp(f, tz=dt_timezone.utc) for f in future_timestamps]


def get_user_forecast_history(
    forecasts: Sequence[Forecast],
    minimize: bool | int = False,
    latest_time: datetime | None = None,
    earliest_time: datetime | None = None,
) -> list[ForecastSet]:
    if latest_time and earliest_time and latest_time <= earliest_time:
        return []
    relevant_forecasts = [
        forecast
        for forecast in forecasts
        if not (
            (earliest_time and forecast.end_time and forecast.end_time <= earliest_time)
            or (latest_time and forecast.start_time > latest_time)
        )
    ]
    timestep_set: set[datetime] = set()
    for forecast in relevant_forecasts:
        timestep_set.add(
            max(forecast.start_time, earliest_time)
            if earliest_time
            else forecast.start_time
        )
        if forecast.end_time and (not latest_time or forecast.end_time <= latest_time):
            timestep_set.add(forecast.end_time)
    timesteps = sorted(timestep_set)
    if minimize > 1:
        timesteps = minimize_history(timesteps, minimize)
    elif minimize:
        timesteps = minimize_history(timesteps)
    if not timesteps:
        return []

    # Sweep the timesteps once, adding and removing forecasts as they start and
    # end, rather than slicing out each forecast's active timesteps. Active
    # forecasts keep start_time order, which RecencyWeighted relies on.
    events: list[tuple[datetime, int, Forecast]] = []
    for forecast in relevant_forecasts:
        events.append((forecast.start_time, 0, forecast))
        if forecast.end_time and (not latest_time or forecast.end_time <= latest_time):
            events.append((forecast.end_time, 1, forecast))
    events.sort(key=lambda event: event[0])

    # forecast id -> (author_id, prediction values, start_time, start epoch),
    # each computed once per forecast. Values are stored as arrays, which are
    # much cheaper to stack into each timestep's 2D array than lists of floats.
    active: dict[int, tuple[int, np.ndarray, datetime, float]] = {}
    forecast_sets: list[ForecastSet] = []
    event_index = 0
    for timestep in timesteps:
        while event_index < len(events) and events[event_index][0] <= timestep:
            _, is_end, forecast = events[event_index]
            if is_end:
                active.pop(forecast.id, None)
            else:
                active[forecast.id] = (
                    forecast.author_id,
                    np.asarray(forecast.get_prediction_values()),
                    forecast.start_time,
                    forecast.start_time.timestamp(),
                )
            event_index += 1
        entries = list(active.values())
        forecast_sets.append(
            ForecastSet(
                forecasts_values=[entry[1] for entry in entries],
                timestep=timestep,
                forecaster_ids=[entry[0] for entry in entries],
                timesteps=[entry[2] for entry in entries],
                _timesteps_epoch_cache=np.array([entry[3] for entry in entries]),
            )
        )
    return forecast_sets


def add_transition_timesteps(
    forecast_history: list[ForecastSet],
    transition_times: list[datetime],
    latest_time: datetime | None = None,
) -> list[ForecastSet]:
    """Adds an entry at each of transition_times (sorted) that isn't already a
    timestep, holding the forecasts of the entry before it. Times before the
    first entry or after latest_time are skipped."""
    if not transition_times or not forecast_history:
        return forecast_history
    history = list(forecast_history)
    for time in transition_times:
        if latest_time and time > latest_time:
            continue
        index = bisect_right([fs.timestep for fs in history], time)
        if index == 0 or history[index - 1].timestep == time:
            continue
        history.insert(index, replace(history[index - 1], timestep=time))
    return history


@sentry_sdk.trace
def get_aggregation_history(
    question: Question,
    aggregation_methods: list[AggregationMethod],
    forecasts: QuerySet[Forecast] | None = None,
    only_include_user_ids: list[int] | set[int] | None = None,
    minimize: bool | int = True,
    include_stats: bool = True,
    include_bots: bool = False,
    only_bots: bool = False,
    histogram: bool | None = None,
    include_future: bool = True,
    joined_before: datetime | None = None,
    include_pre_predictions: bool = False,
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

        if only_include_user_ids:
            forecasts = forecasts.filter(author_id__in=only_include_user_ids)
        elif only_bots:
            forecasts = forecasts.filter(author__is_bot=True)
        else:
            # only include forecasts by non-primary bots or blacklisted users
            # if user ids explicitly specified
            forecasts = forecasts.exclude_non_primary_bots()
            forecasts = forecasts.exclude_blacklisted_users()
            if not include_bots:
                forecasts = forecasts.exclude(author__is_bot=True)

    if include_pre_predictions:
        earliest_time = None
    else:
        earliest_time = question.open_time

    if include_future:
        latest_time = question.actual_close_time
    else:
        latest_time = min(
            timezone.now(),
            question.scheduled_close_time or timezone.now(),
            question.actual_close_time or timezone.now(),
        )

    with sentry_sdk.start_span(op="compute", name="get_user_forecast_history"):
        forecast_history = get_user_forecast_history(
            forecasts, minimize, latest_time=latest_time, earliest_time=earliest_time
        )

    forecaster_ids = set(forecast.author_id for forecast in forecasts)
    for method in aggregation_methods:
        if method == "geometric_mean":
            if minimize:
                continue  # gomean is useless minimized
            from scoring.score_math import get_geometric_means

            geometric_means = get_geometric_means(forecasts)
            full_summary[method] = []
            previous_forecast = None
            for gm in geometric_means:
                aggregate_forecast = AggregateForecast(
                    question=question,
                    method=method,
                    forecast_values=gm.pmf.tolist(),
                    start_time=datetime.fromtimestamp(gm.timestamp, tz=dt_timezone.utc),
                    end_time=None,
                    forecaster_count=gm.num_forecasters,
                )
                if previous_forecast:
                    previous_forecast.end_time = aggregate_forecast.start_time
                previous_forecast = aggregate_forecast
                full_summary[method].append(aggregate_forecast)
            continue

        if method == AggregationMethod.METACULUS_PREDICTION:
            # saved in the database - not reproducible or updateable
            full_summary[method] = list(
                AggregateForecast.objects.filter(
                    question_id=question.id, method=method
                ).order_by("start_time")
            )
            continue

        aggregation_history: list[AggregateForecast] = []
        aggregation_class = get_aggregation_by_name(method)
        # Added per method so other methods' histories keep their grid
        method_history = add_transition_timesteps(
            forecast_history,
            aggregation_class.transition_times(question),
            latest_time=latest_time,
        )
        with sentry_sdk.start_span(
            op="aggregation.init",
            name=f"init_aggregation_generator:{method}",
        ) as span:
            span.set_data("forecaster_count", len(forecaster_ids))
            AggregationGenerator: Aggregation = aggregation_class(
                question=question,
                all_forecaster_ids=forecaster_ids,
                joined_before=joined_before,
                forecast_history=method_history,
            )

        last_historical_entry_index = -1
        now = timezone.now()
        for entry in method_history:
            if entry.timestep < now:
                last_historical_entry_index += 1
            else:
                break

        with sentry_sdk.start_span(
            op="aggregation.compute",
            name=f"compute_aggregation_entries:{method}",
        ) as span:
            span.set_data("forecast_history_count", len(method_history))
            for i, forecast_set in enumerate(method_history):
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
                        and (i >= last_historical_entry_index)
                    )

                if forecast_set.forecasts_values:
                    new_entry = AggregationGenerator.calculate_aggregation_entry(
                        forecast_set,
                        include_stats=include_stats,
                        histogram=include_histogram,
                    )
                    if new_entry is None:
                        continue
                    if aggregation_history and aggregation_history[-1].end_time is None:
                        aggregation_history[-1].end_time = new_entry.start_time
                    aggregation_history.append(new_entry)
                else:
                    if aggregation_history:
                        aggregation_history[-1].end_time = forecast_set.timestep
        full_summary[method] = aggregation_history

    return full_summary
