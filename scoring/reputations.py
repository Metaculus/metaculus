"""
Builds and maintains Reputation rows.

AVERAGE_PEER_SCORE is the only type. For each user it is a running average of
their peer scores, shrunk toward zero by a prior of PRIOR_COVERAGE questions:

    value        = score_sum / (PRIOR_COVERAGE + coverage_sum)
    contribution = coverage_sum

A score enters a user's reputation at its question's actual_resolve_time, when
it was achieved, even if the question is resolved (or re-resolved) later with a
resolve time in the past.

Scores sharing a reputation time are bundled into one row per user, so there is
never more than one row per (user, type, time).
"""

import logging
from collections import defaultdict
from datetime import datetime
from typing import Iterable

import numpy as np
from django.db import connection, transaction
from django.db.models import F, QuerySet, Sum

from questions.models import Forecast, Question
from scoring.constants import ScoreTypes
from scoring.models import Reputation, Score
from utils.models import ModelBatchCreator

logger = logging.getLogger(__name__)

PRIOR_COVERAGE = 30
BATCH_SIZE = 5000
# Arbitrary constant identifying the reputation refresh's advisory lock
REFRESH_LOCK_KEY = 7_301_552


def question_counts_toward_reputation(question: Question) -> bool:
    post = question.get_post()
    return post is not None and post.default_project.default_permission is not None


def reputation_peer_scores() -> QuerySet[Score]:
    """Peer scores that count toward reputation, annotated with the time each
    one enters it"""
    return Score.objects.filter(
        score_type=ScoreTypes.PEER,
        user__isnull=False,
        question__post__default_project__default_permission__isnull=False,
    ).annotate(reputation_time=F("question__actual_resolve_time"))


def _replay_peer_scores(
    scores: Iterable[tuple[int, float, float, datetime]],
    totals_by_user: dict[int, list[float]],
    creator: ModelBatchCreator,
) -> int:
    """Accumulates (user_id, score, coverage, reputation_time) tuples, which
    must be ordered by reputation_time, onto totals_by_user's running
    [score_sum, coverage_sum], emitting one row per user per distinct
    reputation_time. Returns the number of rows emitted."""
    rows = 0
    bundle_time = None
    # dict, not set: keeps row order deterministic within a bundle
    bundle_user_ids: dict[int, None] = {}

    def flush():
        nonlocal rows
        for user_id in bundle_user_ids:
            score_sum, coverage_sum = totals_by_user[user_id]
            creator.append(
                Reputation(
                    user_id=user_id,
                    time=bundle_time,
                    type=Reputation.ReputationTypes.AVERAGE_PEER_SCORE,
                    value=score_sum / (PRIOR_COVERAGE + coverage_sum),
                    contribution=coverage_sum,
                )
            )
        rows += len(bundle_user_ids)

    for user_id, score, coverage, reputation_time in scores:
        if bundle_time is not None and reputation_time != bundle_time:
            flush()
            bundle_user_ids = {}
        bundle_time = reputation_time
        totals = totals_by_user.setdefault(user_id, [0.0, 0.0])
        totals[0] += score
        totals[1] += coverage
        bundle_user_ids[user_id] = None
    if bundle_time is not None:
        flush()
    return rows


def _ordered_score_tuples(scores: QuerySet[Score]):
    return (
        scores.order_by("reputation_time", "edited_at", "id")
        .values_list("user_id", "score", "coverage", "reputation_time")
        .iterator(chunk_size=BATCH_SIZE)
    )


def rebuild_peer_reputations() -> int:
    """Recomputes every AVERAGE_PEER_SCORE row from scratch. Returns the
    number of rows written."""
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [REFRESH_LOCK_KEY])
        Reputation.objects.filter(
            type=Reputation.ReputationTypes.AVERAGE_PEER_SCORE
        ).delete()
        with ModelBatchCreator(
            model_class=Reputation, batch_size=BATCH_SIZE
        ) as creator:
            return _replay_peer_scores(
                _ordered_score_tuples(reputation_peer_scores()), {}, creator
            )


def refresh_peer_reputations(
    user_ids: Iterable[int], since: datetime
) -> tuple[int, int]:
    """Recomputes the given users' AVERAGE_PEER_SCORE rows at or after `since`.
    Rows before `since` only depend on scores that entered reputation before
    it, so they are left alone and their totals seed the replay. Returns
    (rows deleted, rows written)."""
    user_ids = list(set(user_ids))
    if not user_ids:
        return 0, 0
    scores = reputation_peer_scores().filter(user_id__in=user_ids)
    with transaction.atomic():
        # Refreshes for questions sharing forecasters would otherwise
        # interleave their deletes and writes. Waits rather than failing, so a
        # burst of resolutions queues up instead of dropping refreshes.
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [REFRESH_LOCK_KEY])
        totals_by_user: dict[int, list[float]] = {
            row["user_id"]: [row["score_sum"], row["coverage_sum"]]
            for row in scores.filter(reputation_time__lt=since)
            .order_by()
            .values("user_id")
            .annotate(score_sum=Sum("score"), coverage_sum=Sum("coverage"))
        }
        deleted, _ = Reputation.objects.filter(
            user_id__in=user_ids,
            type=Reputation.ReputationTypes.AVERAGE_PEER_SCORE,
            time__gte=since,
        ).delete()
        with ModelBatchCreator(
            model_class=Reputation, batch_size=BATCH_SIZE
        ) as creator:
            written = _replay_peer_scores(
                _ordered_score_tuples(scores.filter(reputation_time__gte=since)),
                totals_by_user,
                creator,
            )
    return deleted, written


def refresh_reputations_for_question(
    question: Question, previous_resolve_time: datetime | None
) -> tuple[int, int]:
    """Brings reputations up to date after `question`'s scores changed
    (resolution, unresolution or re-resolution). `previous_resolve_time` is the
    question's actual_resolve_time from before the change, which is where its
    old scores entered reputation."""
    if not question_counts_toward_reputation(question):
        return 0, 0
    candidates = [t for t in [previous_resolve_time, question.actual_resolve_time] if t]
    if not candidates:
        return 0, 0
    # Every user whose scores could have changed has forecast on the question
    user_ids = (
        Forecast.objects.filter(question=question, author__isnull=False)
        .values_list("author_id", flat=True)
        .distinct()
    )
    return refresh_peer_reputations(user_ids, min(candidates))


# Reputation formulas ##########################################
#
# How a stored (value, contribution) pair is read as a reputation. Applied at
# use time rather than stored, so rho and gamma are free parameters of the
# aggregation consuming them.

# Smoothing width of the continuous formula: scale * softplus(x / scale)
# approximates max(x, 0), exactly as scale -> 0
CONTINUOUS_SOFTPLUS_SCALE = 1e-6


def _softplus(x: np.ndarray) -> np.ndarray:
    """Numerically stable log(1 + exp(x))"""
    return np.where(
        x > 0,
        x + np.log1p(np.exp(-np.abs(x))),
        np.log1p(np.exp(-np.abs(x))),
    )


def raw_reputation(
    values: np.ndarray, contributions: np.ndarray, rho: float, gamma: float
) -> np.ndarray:
    """The stored value, untouched"""
    return values


def threshold_reputation(
    values: np.ndarray, contributions: np.ndarray, rho: float, gamma: float
) -> np.ndarray:
    """0 for anyone below rho or with less than gamma coverage, otherwise the
    excess over rho"""
    return np.where((values < rho) | (contributions < gamma), 0.0, values - rho)


def continuous_reputation(
    values: np.ndarray, contributions: np.ndarray, rho: float, gamma: float
) -> np.ndarray:
    """A smooth threshold: shrinks the value toward rho with weight gamma
    against the user's coverage, then takes the (softplus) excess over rho.
    Thin-coverage users are pulled toward rho rather than cut off at it."""
    denominator = gamma + contributions
    with np.errstate(invalid="ignore", divide="ignore"):
        blend = np.where(
            denominator == 0,
            rho,
            (gamma * rho + contributions * values) / denominator,
        )
    scale = CONTINUOUS_SOFTPLUS_SCALE
    return scale * _softplus((blend - rho) / scale)


def reputations_at_forecast_time(
    forecasts: Iterable[Forecast],
    reputation_type: str = Reputation.ReputationTypes.AVERAGE_PEER_SCORE,
) -> dict[int, tuple[float, float]]:
    """Forecast id -> (value, contribution) of its author's reputation when the
    forecast was made, (0.0, 0.0) if they had none: what reputation_weighted
    weights the forecast by"""
    forecasts = list(forecasts)
    if not forecasts:
        return {}
    rows = (
        Reputation.objects.filter(
            user_id__in={f.author_id for f in forecasts},
            type=reputation_type,
            time__lte=max(f.start_time for f in forecasts),
        )
        .order_by("user_id", "time")
        .values_list("user_id", "time", "value", "contribution")
    )
    histories: dict[int, list[tuple[float, float, float]]] = defaultdict(list)
    for user_id, time, value, contribution in rows:
        histories[user_id].append((time.timestamp(), value, contribution))
    by_author: dict[int, list[Forecast]] = defaultdict(list)
    for forecast in forecasts:
        by_author[forecast.author_id].append(forecast)
    result = {}
    for author_id, author_forecasts in by_author.items():
        history = np.array(histories.get(author_id, []), dtype=float).reshape(-1, 3)
        starts = [f.start_time.timestamp() for f in author_forecasts]
        indexes = np.searchsorted(history[:, 0], starts, side="right") - 1
        for forecast, index in zip(author_forecasts, indexes):
            result[forecast.id] = (
                (float(history[index, 1]), float(history[index, 2]))
                if index >= 0
                else (0.0, 0.0)
            )
    return result


REPUTATION_FORMULAS = {
    "none": raw_reputation,
    "threshold": threshold_reputation,
    "continuous": continuous_reputation,
}
