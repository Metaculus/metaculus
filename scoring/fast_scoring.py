"""
Fast, cache-friendly scoring engine used by `benchmark_aggregations`.

This bypasses `evaluate_question`/`get_aggregation_history` entirely. Instead
of building full (num_forecasters, pmf_width) arrays at every timestep and
re-deriving the community aggregate's full PMF, it reduces every forecast to
a *single scalar* up front - the PMF value at the question's resolution
bucket - and does all downstream aggregation/scoring work on compact
(num_forecasters, num_timesteps) arrays.

This is only valid for MEAN-based aggregation methods on any question type,
or MEDIAN-based methods as long as multiple_choice questions are excluded:
MC's median computation renormalizes across the *whole* PMF vector (see
`MedianAggregatorMixin.calculate_forecast_values`), so a single bucket's
value isn't enough to reproduce it exactly. See MEAN_BASED_METHODS /
MEDIAN_BASED_METHODS below.
"""

import pickle
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone as dt_timezone
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from django.utils import timezone

from questions.models import QUESTION_CONTINUOUS_TYPES, Forecast, Question
from questions.services.multiple_choice_handlers import get_all_options_from_history
from scoring.constants import ScoreTypes
from scoring.models import MINIMUM_REPUTATION
from utils.the_math.aggregations import (
    AGGREGATIONS,
    GoldMedalistsReputationWeighted,
    JoinedBeforeFiltered,
    MeanAggregatorMixin,
    MedalistsReputationWeighted,
    MedianAggregatorMixin,
    PeerContinuousReputationWeighted,
    PeerScoreReputationWeighted,
    PeerThresholdReputationWeighted,
    ProsFiltered,
    SilverMedalistsReputationWeighted,
    SpotSensitiveReputationWeighted,
    YearPerformanceReputationWeighted,
)
from utils.the_math.formulas import string_location_to_bucket_index

# Which reputation source (a ReputationWeighted subclass's `.reputations`
# dict, looked up the same way by get_reputation_values/preload_reputation_
# history regardless of which bucket below it's in) each reputation-driven
# method needs, keyed by method name.
#
# "decayed": mean-based methods whose weight blends the reputation value
# with RecencyWeighted-style decay via LearnedReputationWeighted's formula
# (see compute_aggregation_series). "spot_sensitive" uses the same source as
# "single_aggregation" (SpotSensitiveReputationWeighted extends
# PeerScoreReputationWeighted) - see _spot_sensitive_ab.
DECAYED_REPUTATION_CLASSES = {
    "single_aggregation": PeerScoreReputationWeighted,
    "year_performance": YearPerformanceReputationWeighted,
    "spot_sensitive": SpotSensitiveReputationWeighted,
    "peer_threshold_-20_coverage_50": PeerThresholdReputationWeighted,
    "peer_continuous_with_coverage": PeerContinuousReputationWeighted,
}
# "raw": median-based methods that multiply the reputation value straight
# into RecencyWeighted's rank-based weight - it's already a plain 0/1
# medal-holder indicator, not a magnitude to blend (see
# compute_median_aggregation_series).
RAW_REPUTATION_CLASSES = {
    "medalists": MedalistsReputationWeighted,
    "silver_medalists": SilverMedalistsReputationWeighted,
    "gold_medalists": GoldMedalistsReputationWeighted,
}
REPUTATION_WEIGHTED_CLASSES = {**DECAYED_REPUTATION_CLASSES, **RAW_REPUTATION_CLASSES}

# Median-based methods that combine RecencyWeighted with a static (not
# time-varying) per-user 0/1 membership mask, computed once for the whole
# batch of forecasters (see preload_static_filter) rather than looked up per
# timestep like the reputation sources above.
STATIC_FILTER_CLASSES = {
    "metaculus_pros": ProsFiltered,
    "joined_before_date": JoinedBeforeFiltered,
}

MEAN_BASED_METHODS = {
    agg.method for agg in AGGREGATIONS if issubclass(agg, MeanAggregatorMixin)
}
MEDIAN_BASED_METHODS = {
    agg.method for agg in AGGREGATIONS if issubclass(agg, MedianAggregatorMixin)
}

# Arbitrarily early: only used as an anchor point for PeerScoreReputationWeighted's
# "reputation as of the very start" baseline entry when preloading (see
# preload_reputation_history) - must just be earlier than any real Score.
_EARLY_ANCHOR = datetime(2015, 1, 1, tzinfo=dt_timezone.utc)

ReputationArrays = dict[int, tuple[np.ndarray, np.ndarray]]


def _reputation_to_arrays(reputations: dict[int, list]) -> ReputationArrays:
    """Converts a `get_reputation_history()`-shaped dict (user_id -> list of
    Reputation model instances) into a much more compact (user_id -> (times
    epoch array, values array)) form, and drops the Django objects.

    This matters well beyond a constant-factor speedup: `benchmark_
    aggregations --workers N` hands a preloaded reputation_history dict to
    every worker process via ProcessPoolExecutor's initargs (fork start
    method - see _init_worker there). A large batch's *full* per-user
    Reputation history (every historical score-update event, potentially
    thousands per active forecaster) held as live Django model instances is
    reference-counted Python objects throughout; under fork, every read
    touches each object's refcount field, which forces copy-on-write page
    duplication *per worker process* even for purely read-only access - in
    practice this alone can multiply peak memory by roughly the worker
    count and OOM-kill the run. Plain numpy arrays don't have this problem
    (only the array object itself is refcounted, not each element), and are
    far smaller per element besides. Converting once, immediately after
    fetching - before the data is ever pickled to a worker or reused across
    many questions - avoids rebuilding these arrays from Reputation objects
    on every single lookup too (get_reputation_values/compute_spot_scores
    used to do this once per question).
    """
    return {
        user_id: (
            np.array([r.time.timestamp() for r in history]),
            np.array([r.value for r in history]),
        )
        for user_id, history in reputations.items()
    }


def preload_reputation_history(
    method: str, user_ids: list[int], end_time: datetime | None = None
) -> ReputationArrays:
    """Computes one method's full reputation history for every user in
    `user_ids` *once*, instead of the (very expensive - a full historical
    Score/Reputation query per call) per-question reconstruction
    get_reputation_values would otherwise do for every single question in a
    batch, even though the same active forecasters reappear across most of
    them.

    Safe because reputation histories are monotonically built up over
    calendar time regardless of which question "asked" for them: querying
    with an artificially early start bound produces the same per-timestamp
    values a narrower, question-specific bound would have - every consumer
    only ever looks up "the latest entry at or before my query time"
    (bisect/searchsorted), which ignores anything outside its own
    question's real window anyway.

    `end_time` should be the *latest* close time among the questions this
    preload will actually be used for (callers scoring a batch of questions
    should pass the max across the batch) - defaulting to "now" fetches
    every relevant Score/Reputation row regardless of how far in the past
    the batch's questions actually resolved, which is wasted work for
    batches of older questions.
    """
    weighted_class = REPUTATION_WEIGHTED_CLASSES[method]
    # Every ReputationWeighted subclass's get_reputation_history touches
    # `question.open_time`/`scheduled_close_time` in some form - directly
    # (the "raw"/medal classes use them as the reputation-history window) or
    # via LearnedReputationWeighted.__init__'s question_duration_seconds
    # (the "decayed" classes) - so the fake question needs both regardless
    # of which bucket `method` falls into. default_score_type=None (never
    # equal to spot_peer) short-circuits SpotSensitiveReputationWeighted.
    # __init__'s spot_scoring_time lookup, which this fake question has no
    # sensible value for anyway - harmless, since preloading only ever reads
    # get_reputation_history()'s dict, never calls calculate_weights().
    fake_question = SimpleNamespace(
        open_time=_EARLY_ANCHOR,
        scheduled_close_time=end_time or timezone.now(),
        default_score_type=None,
    )
    reputations = weighted_class(
        question=fake_question, all_forecaster_ids=list(user_ids)
    ).reputations
    return _reputation_to_arrays(reputations)


def preload_static_filter(
    method: str, user_ids: list[int], joined_before: datetime | None = None
) -> set[int]:
    """Precomputes one static-filter method's full qualifying user_id subset
    of `user_ids` *once* for a whole batch of questions, instead of
    reconstructing it (a fresh User query) for every single question -
    membership doesn't depend on which question is asking.

    `joined_before` is only used by "joined_before_date" - ignored (accepted
    and discarded by Filtered.__init__'s **kwargs) for other methods.
    """
    filter_class = STATIC_FILTER_CLASSES[method]
    return filter_class(
        all_forecaster_ids=list(user_ids), joined_before=joined_before
    ).filter

# Data-reduction cache: keyed by question id, invalidated wholesale by bumping
# CACHE_VERSION if the reduction logic below changes.
CACHE_DIR = Path(__file__).resolve().parent / "_fast_scoring_cache"
CACHE_VERSION = 1


@dataclass
class QuestionScoringData:
    """The minimal data needed to compute any mean-based aggregation and
    peer/baseline score for one question - reduced to one scalar per
    forecast (the PMF value at the resolution bucket) rather than the full
    PMF/CDF vector.
    """

    question_id: int
    question_type: str
    resolution_bucket: int
    pmf_length: int  # len(get_pmf()) would be for this question - 2 for
    # binary, num_categories for MC, inbound_outcome_count + 2 for continuous
    user_ids: np.ndarray  # (U,) int - forecaster author_id per row
    timesteps: np.ndarray  # (T,) float epoch seconds; T == 1 for spot scoring
    values: np.ndarray  # (U, T) float, nan where that forecaster is inactive
    start_epochs: np.ndarray  # (U, T) float, nan where inactive - the active
    # forecast's own start_time, for recency-style decay weighting
    forecast_horizon_start: float
    forecast_horizon_end: float
    actual_close_time: float
    open_bounds_count: int
    is_spot: bool
    spot_timestamp: float | None
    # Populated on demand outside the cached bundle (see get_reputation_values
    # in this module) since Reputation rows can be added between runs even
    # when the underlying resolved question's forecasts never change.
    reputation_values: dict[str, np.ndarray] = field(default_factory=dict)


def _reduced_pmf_value(forecast: Forecast, resolution_bucket: int) -> float:
    """The forecast's PMF value at `resolution_bucket`, matching
    Forecast.get_pmf()[resolution_bucket] (falling back to the last "Other"
    bucket if that entry is None/NaN) - without materializing the full PMF
    for continuous questions.

    Mean (and geometric mean, and median) are all columnwise-independent
    operations, so reducing each forecast to this one value before
    aggregating gives identical results to aggregating full PMF vectors and
    then extracting the bucket - the PMF/CDF distinction is why continuous
    needs the two-value difference below rather than a single CDF lookup.
    """
    if forecast.probability_yes or forecast.probability_yes_per_category:
        # binary/MC: get_prediction_values() and get_pmf() are identical, and
        # both are already tiny (2 or a handful of categories) - no benefit
        # to hand-rolling this case.
        pmf = forecast.get_pmf()
        value = pmf[resolution_bucket]
        return value if not np.isnan(value) else pmf[-1]

    # continuous: pmf[i] = cdf[i] - cdf[i-1] (pmf[0] = cdf[0], pmf[-1] = 1 -
    # cdf[-1]) - only ever need at most 2 raw cdf floats, never the full
    # (inbound_outcome_count + 1)-wide array.
    cdf = forecast.continuous_cdf
    n_cdf = len(cdf)
    if resolution_bucket == 0:
        return cdf[0]
    if resolution_bucket == n_cdf:
        return 1 - cdf[-1]
    return cdf[resolution_bucket] - cdf[resolution_bucket - 1]


def _pmf_length(question: Question) -> int:
    if question.type == Question.QuestionType.BINARY:
        return 2
    if question.type == Question.QuestionType.MULTIPLE_CHOICE:
        return len(get_all_options_from_history(question.options_history))
    return question.get_inbound_outcome_count() + 2


def _gather_forecasts(question: Question):
    forecasts = question.user_forecasts.all()
    forecasts = forecasts.exclude_non_primary_bots()
    forecasts = forecasts.exclude_blacklisted_users()
    if not question.include_bots_in_aggregates:
        forecasts = forecasts.exclude(author__is_bot=True)
    return list(forecasts.order_by("start_time"))


def _build_interval_data(
    question: Question,
    forecasts: list[Forecast],
    resolution_bucket: int,
    forecast_horizon_start: float,
    actual_close_time: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Builds the (user_ids, timesteps, values, start_epochs) tuple for
    interval (non-spot) scoring, clamped to [forecast_horizon_start,
    actual_close_time] exactly like evaluate_forecasts_peer_accuracy does.
    """
    clamped: list[tuple[Forecast, float, float, float]] = []
    grid: set[float] = set()
    for forecast in forecasts:
        raw_start = forecast.start_time.timestamp()
        start = max(raw_start, forecast_horizon_start)
        end = (
            actual_close_time
            if forecast.end_time is None
            else min(forecast.end_time.timestamp(), actual_close_time)
        )
        if end <= start:
            continue
        clamped.append((forecast, start, end, raw_start))
        grid.add(start)
        grid.add(end)

    # Always include the horizon end, even if every included forecast
    # stopped predicting before then - otherwise the final "no one is
    # forecasting anymore" gap wouldn't be representable, and interval
    # integration in step 3 needs this as its last boundary regardless.
    grid.add(actual_close_time)

    timesteps = np.array(sorted(grid))
    user_ids = np.array(sorted({f.author_id for f, *_ in clamped}))
    user_row: dict[int, int] = {uid: i for i, uid in enumerate(user_ids)}

    n_users = len(user_ids)
    n_timesteps = len(timesteps)
    values = np.full((n_users, n_timesteps), np.nan)
    start_epochs = np.full((n_users, n_timesteps), np.nan)

    for forecast, start, end, raw_start in clamped:
        row = user_row[forecast.author_id]
        start_idx = np.searchsorted(timesteps, start)
        end_idx = np.searchsorted(timesteps, end)
        value = _reduced_pmf_value(forecast, resolution_bucket)
        values[row, start_idx:end_idx] = value
        start_epochs[row, start_idx:end_idx] = raw_start

    return user_ids, timesteps, values, start_epochs


def get_reputation_values(
    data: "QuestionScoringData",
    question: Question,
    method: str,
    reputation_history: ReputationArrays | None = None,
) -> np.ndarray:
    """Reputation value per (user, timestep) for the reputation source
    `method`'s weighting needs, cached on `data.reputation_values` per
    method so multiple methods sharing a source only compute it once.

    Not part of the on-disk cache: unlike the forecast reduction (which
    never changes once a question is resolved), Reputation rows can be
    added between runs, so this is always recomputed fresh. `question` is
    passed in separately (rather than stored on QuestionScoringData) so the
    cached bundle stays a plain-array/scalar structure, not a Django model.

    Pass `reputation_history` (from preload_reputation_history) when scoring
    many questions in one run - each user's full history only needs
    fetching once, not once per question they happen to appear in.
    """
    if method in data.reputation_values:
        return data.reputation_values[method]

    if reputation_history is not None:
        reputation_arrays = reputation_history
    else:
        weighted_class = REPUTATION_WEIGHTED_CLASSES[method]
        # Constructing directly (without forecast_history) just to reuse
        # get_reputation_history() - we do our own batched fill below rather
        # than going through get_reputations()/calculate_weights().
        reputations = weighted_class(
            question=question, all_forecaster_ids=data.user_ids.tolist()
        ).reputations
        reputation_arrays = _reputation_to_arrays(reputations)

    result = np.full(data.values.shape, MINIMUM_REPUTATION)
    for row, user_id in enumerate(data.user_ids):
        arrays = reputation_arrays.get(int(user_id))
        if not arrays:
            continue
        history_times, history_values = arrays
        indexes = np.searchsorted(history_times, data.timesteps, side="right") - 1
        found = indexes >= 0
        result[row, found] = history_values[np.clip(indexes[found], 0, None)]

    data.reputation_values[method] = result
    return result


def _spot_sensitive_ab(
    question: Question,
    timesteps: np.ndarray,
    a: float,
    b: float,
    b_spot: float | None,
) -> tuple[np.ndarray, np.ndarray]:
    """Per-timestep (1, T) a/b arrays for "spot_sensitive": a_spot=0/b_spot
    (defaulting to `b`) at any timestep strictly before the question's spot
    scoring time, when it's spot_peer-scored and has one set - the normal
    a/b everywhere else. Vectorized equivalent of
    SpotSensitiveReputationWeighted.calculate_weights.
    """
    b_spot = b if b_spot is None else b_spot
    a_row = np.full(timesteps.shape, a)
    b_row = np.full(timesteps.shape, b)
    if question.default_score_type == ScoreTypes.SPOT_PEER:
        spot_time = question.get_spot_scoring_time()
        if spot_time is not None:
            before_spot = timesteps < spot_time.timestamp()
            a_row[before_spot] = SpotSensitiveReputationWeighted.a_spot
            b_row[before_spot] = b_spot
    return a_row[None, :], b_row[None, :]


def compute_aggregation_series(
    data: "QuestionScoringData",
    question: Question,
    method: str,
    a: float = 0.5,
    b: float = 6.0,
    b_spot: float | None = None,
    reputation_history: ReputationArrays | None = None,
) -> np.ndarray:
    """The aggregate's PMF-at-resolution_bucket value at every timestep,
    for one mean-based aggregation method. NaN at timesteps with zero
    active forecasters (mirrors the "no forecasters -> no aggregation
    entry" gap-handling in get_aggregation_history).

    `b_spot` is only used by "spot_sensitive" (see _spot_sensitive_ab) -
    ignored for every other method.
    """
    if method not in MEAN_BASED_METHODS:
        raise NotImplementedError(
            f"compute_aggregation_series only supports mean-based methods, "
            f"got {method!r}"
        )

    if method in DECAYED_REPUTATION_CLASSES:
        reputation = get_reputation_values(data, question, method, reputation_history)
        duration_seconds = data.forecast_horizon_end - data.forecast_horizon_start
        decay_ratio = -(data.timesteps[None, :] - data.start_epochs) / duration_seconds
        decays = np.exp(decay_ratio)
        if method == "spot_sensitive":
            a_row, b_row = _spot_sensitive_ab(question, data.timesteps, a, b, b_spot)
            weights = (decays**a_row * reputation ** (1 - a_row)) ** b_row
        else:
            weights = (decays**a * reputation ** (1 - a)) ** b
    else:
        weights = np.ones_like(data.values)

    active = ~np.isnan(data.values)
    masked_values = np.where(active, data.values, 0.0)
    masked_weights = np.where(active, weights, 0.0)
    weight_sum = masked_weights.sum(axis=0)
    with np.errstate(invalid="ignore", divide="ignore"):
        series = (masked_values * masked_weights).sum(axis=0) / weight_sum
    series[weight_sum == 0] = np.nan
    return series


def _weighted_percentile_masked(
    values: np.ndarray,
    weights: np.ndarray,
    active: np.ndarray,
    percentile: float = 50.0,
) -> np.ndarray:
    """Generalized version of utils.the_math.measures.weighted_percentile_2d
    that accepts a weight *matching values' own shape* (one weight per cell,
    not just per row) - needed because RecencyWeighted's weight varies per
    (forecaster, timestep), not just per forecaster. `active` marks which
    cells actually have a value; inactive cells are excluded from every
    column's percentile independently (columns can have different active
    counts).
    """
    col_idx = np.arange(values.shape[1])[None, :]
    # Inactive cells sort last within their own column (like NaN would),
    # so they never affect the percentile of the active subset.
    sort_keys = np.where(active, values, np.inf)
    order = np.argsort(sort_keys, axis=0)
    sorted_values = values[order, col_idx]
    sorted_weights = np.where(active, weights, 0.0)[order, col_idx]

    cumulative_weights = np.cumsum(sorted_weights, axis=0)
    total_weight = cumulative_weights[-1]
    with np.errstate(invalid="ignore", divide="ignore"):
        normalized = cumulative_weights / total_weight
    target = percentile / 100.0
    right_indexes = np.argmax(normalized > target, axis=0)
    left_indexes = np.argmax(normalized >= target, axis=0)
    flat_col = np.arange(values.shape[1])
    result = 0.5 * (
        sorted_values[left_indexes, flat_col] + sorted_values[right_indexes, flat_col]
    )
    result[total_weight == 0] = np.nan
    return result


def compute_median_aggregation_series(
    data: "QuestionScoringData",
    question: Question,
    method: str,
    reputation_history: ReputationArrays | None = None,
    static_filter: set[int] | None = None,
) -> np.ndarray:
    """The aggregate's PMF-at-resolution_bucket value at every timestep, for
    a median-based method - only valid when multiple_choice questions are
    excluded from the run (see module docstring / MEDIAN_BASED_METHODS).

    Every method other than "unweighted" starts from RecencyWeighted's
    rank-based weight. "medalists"/"silver_medalists"/"gold_medalists"
    additionally multiply in a medal-holder reputation value (0/1, looked up
    exactly like the mean-based reputation sources - see
    RAW_REPUTATION_CLASSES / get_reputation_values); pass `reputation_history`
    from preload_reputation_history when scoring a batch. "metaculus_pros"/
    "joined_before_date" instead multiply in a static per-user membership
    mask - pass `static_filter` from preload_static_filter.
    """
    if method not in MEDIAN_BASED_METHODS:
        raise NotImplementedError(
            f"compute_median_aggregation_series only supports median-based "
            f"methods, got {method!r}"
        )
    if data.question_type == Question.QuestionType.MULTIPLE_CHOICE:
        raise NotImplementedError(
            "Median-based aggregation isn't valid for multiple_choice "
            "questions in this fast path - see module docstring."
        )

    active = ~np.isnan(data.values)
    counts = active.sum(axis=0)

    if method == "unweighted":
        weights = np.ones_like(data.values)
    elif method in (
        {"recency_weighted"} | RAW_REPUTATION_CLASSES.keys() | STATIC_FILTER_CLASSES.keys()
    ):
        # RecencyWeighted.calculate_weights: exp(sqrt(rank) - sqrt(N)) where
        # rank is the forecaster's 1-indexed position among the currently
        # active ones, ordered by ascending start_time - and no weighting
        # at all (uniform weight) once there are <= 2 active. Shared base
        # for every method below - see docstring above for what each one
        # multiplies in on top of it.
        sort_keys = np.where(active, data.start_epochs, np.inf)
        order = np.argsort(sort_keys, axis=0)
        col_idx = np.arange(data.values.shape[1])[None, :]
        ranks = np.empty(data.values.shape, dtype=float)
        row_idx = np.arange(data.values.shape[0])[:, None] + 1  # 1-indexed rank
        ranks[order, col_idx] = np.broadcast_to(row_idx, data.values.shape)
        n = counts[None, :]
        with np.errstate(invalid="ignore"):
            weights = np.exp(np.sqrt(ranks) - np.sqrt(n))
        weights = np.where(counts[None, :] <= 2, 1.0, weights)

        if method in RAW_REPUTATION_CLASSES:
            reputation = get_reputation_values(data, question, method, reputation_history)
            weights = weights * reputation
        elif method in STATIC_FILTER_CLASSES:
            if static_filter is None:
                raise ValueError(
                    f"{method!r} requires static_filter - see preload_static_filter"
                )
            member_ids = np.fromiter(
                static_filter, dtype=data.user_ids.dtype, count=len(static_filter)
            )
            mask = np.isin(data.user_ids, member_ids).astype(float)
            weights = weights * mask[:, None]
    else:
        raise NotImplementedError(f"No median aggregation implementation for {method!r}")

    if data.question_type in QUESTION_CONTINUOUS_TYPES:
        # MedianAggregatorMixin.calculate_forecast_values's "continuous"
        # branch actually uses a weighted *mean* (np.average), not a
        # median, regardless of which weighting scheme is plugged in.
        masked_values = np.where(active, data.values, 0.0)
        masked_weights = np.where(active, weights, 0.0)
        weight_sum = masked_weights.sum(axis=0)
        with np.errstate(invalid="ignore", divide="ignore"):
            series = (masked_values * masked_weights).sum(axis=0) / weight_sum
        series[weight_sum == 0] = np.nan
        return series

    return _weighted_percentile_masked(data.values, weights, active, 50.0)


def build_question_data(question: Question) -> "QuestionScoringData | None":
    """Step 1: builds the minimal (user_ids, timesteps, values, start_epochs)
    bundle for interval (non-spot) scoring of `question`. Returns None if the
    question's resolution can't be mapped to a bucket (ambiguous/annulled/
    unresolved - callers should already be filtering these out, but this
    mirrors evaluate_question's graceful no-op for them).
    """
    resolution_bucket = string_location_to_bucket_index(question.resolution, question)
    if resolution_bucket is None:
        return None

    forecast_horizon_start = question.open_time.timestamp()
    actual_close_time = question.actual_close_time.timestamp()
    forecast_horizon_end = question.scheduled_close_time.timestamp()
    open_bounds_count = bool(question.open_upper_bound) + bool(question.open_lower_bound)
    pmf_length = _pmf_length(question)

    forecasts = _gather_forecasts(question)
    user_ids, timesteps, values, start_epochs = _build_interval_data(
        question,
        forecasts,
        resolution_bucket,
        forecast_horizon_start,
        actual_close_time,
    )

    return QuestionScoringData(
        question_id=question.id,
        question_type=question.type,
        resolution_bucket=resolution_bucket,
        pmf_length=pmf_length,
        user_ids=user_ids,
        timesteps=timesteps,
        values=values,
        start_epochs=start_epochs,
        forecast_horizon_start=forecast_horizon_start,
        forecast_horizon_end=forecast_horizon_end,
        actual_close_time=actual_close_time,
        open_bounds_count=open_bounds_count,
        is_spot=False,
        spot_timestamp=None,
    )


def compute_geometric_mean_series(
    data: "QuestionScoringData",
) -> tuple[np.ndarray, np.ndarray]:
    """Per-timestep (geometric mean of active forecasters' values, count of
    active forecasters) - the "community" baseline peer scoring compares
    every candidate (individual forecaster or aggregate) against.
    """
    counts = (~np.isnan(data.values)).sum(axis=0)
    # A count of exactly 1 is reported as 0, not 1 - matching
    # get_geometric_means's `predictors if predictors > 1 else 0`. This
    # makes the peer-score weighting factor n/(n-1) evaluate to a clean 0
    # (not a 1/0 division) when there's only one forecaster to compare
    # against - you can't out-peer-score a community of just yourself.
    counts = np.where(counts > 1, counts, 0)
    with np.errstate(divide="ignore", invalid="ignore"):
        gm = np.exp(np.nanmean(np.log(data.values), axis=0))
    return gm, counts


def _interval_durations(data: "QuestionScoringData") -> tuple[np.ndarray, float]:
    """(duration of each [timesteps[t], timesteps[t+1]) span, total_duration)
    - shared by every interval (non-spot) score function below."""
    total_duration = data.forecast_horizon_end - data.forecast_horizon_start
    durations = data.timesteps[1:] - data.timesteps[:-1]
    return durations, total_duration


def score_peer(
    data: "QuestionScoringData",
    series: np.ndarray,
    gm_series: np.ndarray,
    gm_counts: np.ndarray,
) -> tuple[float, float]:
    """Vectorized port of evaluate_forecasts_peer_accuracy: valid for every
    question type (the "/2 for continuous" adjustment is applied below)."""
    durations, total_duration = _interval_durations(data)
    p = series[:-1]
    gmp = gm_series[:-1]
    n = gm_counts[:-1]
    active = ~np.isnan(p)
    if not active.any():
        return 0.0, 0.0

    with np.errstate(divide="ignore", invalid="ignore"):
        interval_scores = 100 * (n / (n - 1)) * np.log(p / gmp)
    if data.question_type in QUESTION_CONTINUOUS_TYPES:
        interval_scores = interval_scores / 2

    weighted = interval_scores * durations / total_duration
    score = float(np.sum(weighted[active]))
    coverage = float(np.sum(durations[active]) / total_duration)
    return score, coverage


def get_or_build_question_data(
    question: Question, rebuild_cache: bool = False
) -> "QuestionScoringData | None":
    """Cached wrapper around build_question_data: the forecast-reduction
    step never changes for a resolved question, so subsequent runs (e.g.
    scipy.optimize iterating on `a`/`b`) can skip straight to the cheap
    aggregation/scoring steps. reputation_values is deliberately not
    persisted (see QuestionScoringData) - always recomputed after loading.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / f"q_{question.id}_v{CACHE_VERSION}.pkl"

    if not rebuild_cache and cache_path.exists():
        with open(cache_path, "rb") as fh:
            data = pickle.load(fh)
        data.reputation_values = {}
        return data

    data = build_question_data(question)
    if data is not None:
        with open(cache_path, "wb") as fh:
            pickle.dump(data, fh)
    return data


# Timestep subsampling, for --sample-timesteps in benchmark_aggregations #####

MAX_SAMPLED_TIMESTEPS = 100


def subsample_timesteps(
    data: "QuestionScoringData", max_points: int = MAX_SAMPLED_TIMESTEPS
) -> "QuestionScoringData":
    """Approximates `data`'s full timestep grid by evenly subsampling it down
    to at most `max_points` grid points, for fast/rough iteration on questions
    with dense forecast histories - conceptually similar to how
    `minimize_history` subsamples a display timeline, but a plain evenly
    -spaced pick rather than that function's density-aware bucketing.

    This is lossy, not integral-preserving: values are piecewise-constant
    between the *original* grid points, so a value change at a dropped grid
    point is invisible to whichever merged interval swallows it - scores
    computed this way are an approximation, not an exact match to the full
    grid's score. Applied post-build (not baked into the on-disk cache) so
    the same cached QuestionScoringData is reusable for both sampled and
    full-precision runs.
    """
    n = len(data.timesteps)
    if n <= max_points:
        return data
    indexes = np.linspace(0, n - 1, max_points).astype(int)
    return replace(
        data,
        timesteps=data.timesteps[indexes],
        values=data.values[:, indexes],
        start_epochs=data.start_epochs[:, indexes],
        reputation_values={},
    )


# Spot scoring ###############################################################
# Structurally different enough from interval scoring (no duration/coverage
# integration - just a single instant) that it gets its own, simpler,
# self-contained path rather than being shoehorned into QuestionScoringData's
# grid. This is also the "T=1, don't compute more than needed" case the
# interval path would otherwise waste work on.


def compute_spot_scores(
    question: Question,
    method: str,
    score_type: str,
    a: float = 0.5,
    b: float = 6.0,
    reputation_history: ReputationArrays | None = None,
) -> tuple[float, float]:
    """End-to-end spot peer/baseline score for one mean-based aggregation
    method, evaluated at question.get_spot_scoring_time()."""
    if method in RAW_REPUTATION_CLASSES or method in STATIC_FILTER_CLASSES:
        raise NotImplementedError(
            f"Spot scoring isn't implemented for {method!r} - its weight "
            "formula (RecencyWeighted combined with a medal/filter "
            "multiplier) isn't the single blended decay/reputation formula "
            "this spot-scoring path uses for single_aggregation/"
            "year_performance - use interval (peer/baseline) scoring for "
            "this method instead."
        )
    resolution_bucket = string_location_to_bucket_index(question.resolution, question)
    if resolution_bucket is None:
        return 0.0, 0.0
    spot_timestamp = question.get_spot_scoring_time()
    if spot_timestamp is None:
        return 0.0, 0.0
    # matches evaluate_question's own clamp - get_spot_scoring_time() can
    # fall back to scheduled_close_time, which may be after the question
    # actually resolved.
    spot_timestamp = min(
        spot_timestamp.timestamp(), question.actual_close_time.timestamp()
    )

    forecasts = _gather_forecasts(question)
    reduced = [
        (
            f.author_id,
            f.start_time.timestamp(),
            float("inf") if f.end_time is None else f.end_time.timestamp(),
            _reduced_pmf_value(f, resolution_bucket),
            f,
        )
        for f in forecasts
    ]

    # Candidate (individual forecaster, and thus the aggregate too) activity:
    # inclusive of its own start - matches evaluate_forecasts_*_spot_forecast's
    # own `start <= spot_timestamp < end` check.
    candidates = [r for r in reduced if r[1] <= spot_timestamp < r[2]]
    if not candidates:
        return 0.0, 0.0

    user_ids = np.array([r[0] for r in candidates])
    values = np.array([r[3] for r in candidates])
    start_epochs = np.array([r[1] for r in candidates])

    if method in DECAYED_REPUTATION_CLASSES:
        # The aggregate's decay/reputation weighting is evaluated as of the
        # grid timestep that "created" the entry covering spot_timestamp -
        # i.e. the most recent forecast start/end at or before
        # spot_timestamp across *all* included forecasts (not just the ones
        # currently active) - not spot_timestamp itself. These only
        # coincide by chance, since spot_timestamp (cp_reveal_time /
        # actual_close_time / etc) is rarely exactly when someone's
        # forecast started or ended.
        open_time = question.open_time.timestamp()
        grid_points = {
            max(r[1], open_time)
            for r in reduced
            if max(r[1], open_time) <= spot_timestamp
        } | {r[2] for r in reduced if r[2] != float("inf") and r[2] <= spot_timestamp}
        aggregate_now = max(grid_points) if grid_points else spot_timestamp

        if reputation_history is not None:
            reputation_arrays = reputation_history
        else:
            weighted_class = DECAYED_REPUTATION_CLASSES[method]
            reputations = weighted_class(
                question=question, all_forecaster_ids=user_ids.tolist()
            ).reputations
            reputation_arrays = _reputation_to_arrays(reputations)
        reputation = np.full(values.shape, MINIMUM_REPUTATION)
        for i, uid in enumerate(user_ids):
            arrays = reputation_arrays.get(int(uid))
            if not arrays:
                continue
            history_times, history_values = arrays
            idx = np.searchsorted(history_times, aggregate_now, side="right") - 1
            if idx >= 0:
                reputation[i] = history_values[idx]
        duration_seconds = (
            question.scheduled_close_time.timestamp() - question.open_time.timestamp()
        )
        decays = np.exp(-(aggregate_now - start_epochs) / duration_seconds)
        weights = (decays**a * reputation ** (1 - a)) ** b
    else:
        weights = np.ones_like(values)

    aggregate_value = float(np.sum(values * weights) / np.sum(weights))

    if score_type == "spot_peer":
        # GM baseline uses the *last grid point strictly before*
        # spot_timestamp - mirrors evaluate_forecasts_peer_spot_forecast's
        # `for gm in geometric_mean_forecasts[::-1]: if gm.timestamp <
        # spot_forecast_timestamp: ...` - not the same instant as the
        # candidate's own (inclusive) activity check above.
        grid_points = sorted(
            {r[1] for r in reduced} | {r[2] for r in reduced if r[2] != float("inf")}
        )
        earlier_points = [t for t in grid_points if t < spot_timestamp]
        if not earlier_points:
            return 0.0, 0.0
        gm_asof = earlier_points[-1]
        gm_active = [r for r in reduced if r[1] <= gm_asof < r[2]]
        n = len(gm_active)
        n = n if n > 1 else 0
        gm_values = np.array([r[3] for r in gm_active])
        with np.errstate(divide="ignore", invalid="ignore"):
            gm = float(np.exp(np.mean(np.log(gm_values))))
            score = 100 * (n / (n - 1)) * np.log(aggregate_value / gm)
        if question.type in QUESTION_CONTINUOUS_TYPES:
            score = score / 2
        return score, 1.0

    if score_type == "spot_baseline":
        if question.type == Question.QuestionType.MULTIPLE_CHOICE:
            raise NotImplementedError(
                "Baseline scoring for multiple_choice questions needs the "
                "full PMF - use evaluate_question for this case."
            )
        if question.type == Question.QuestionType.BINARY:
            with np.errstate(divide="ignore", invalid="ignore"):
                score = 100 * np.log(aggregate_value * 2) / np.log(2)
        else:
            pmf_len = _pmf_length(question)
            if resolution_bucket in (0, pmf_len - 1):
                baseline = 0.05
            else:
                open_bounds_count = bool(question.open_upper_bound) + bool(
                    question.open_lower_bound
                )
                baseline = (1 - 0.05 * open_bounds_count) / (pmf_len - 2)
            with np.errstate(divide="ignore", invalid="ignore"):
                score = 100 * np.log(aggregate_value / baseline) / 2
        return float(score), 1.0

    raise ValueError(f"Unsupported spot score_type: {score_type!r}")


def score_baseline(data: "QuestionScoringData", series: np.ndarray) -> tuple[float, float]:
    """Vectorized port of evaluate_forecasts_baseline_accuracy. Only
    implemented for binary/continuous: multiple_choice's baseline formula
    depends on `options_at_time` (how many categories are non-null for the
    scored candidate at each moment), which our single-scalar-per-forecast
    reduction doesn't retain - see module docstring."""
    if data.question_type == Question.QuestionType.MULTIPLE_CHOICE:
        raise NotImplementedError(
            "Baseline scoring for multiple_choice questions needs the full "
            "PMF (to count available options at each moment), which this "
            "fast path doesn't retain - use evaluate_question for this case."
        )

    durations, total_duration = _interval_durations(data)
    p = series[:-1]
    active = ~np.isnan(p)
    if not active.any():
        return 0.0, 0.0

    if data.question_type == Question.QuestionType.BINARY:
        # options_at_time is always 2 for binary (both pmf entries are
        # always populated - never None).
        with np.errstate(divide="ignore", invalid="ignore"):
            interval_scores = 100 * np.log(p * 2) / np.log(2)
    else:
        pmf_len = data.pmf_length
        if data.resolution_bucket in (0, pmf_len - 1):
            baseline = 0.05
        else:
            baseline = (1 - 0.05 * data.open_bounds_count) / (pmf_len - 2)
        with np.errstate(divide="ignore", invalid="ignore"):
            interval_scores = 100 * np.log(p / baseline) / 2

    weighted = interval_scores * durations / total_duration
    score = float(np.sum(weighted[active]))
    coverage = float(np.sum(durations[active]) / total_duration)
    return score, coverage
