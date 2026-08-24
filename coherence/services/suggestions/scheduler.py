"""
Daily scheduler for AI link suggestions.

Build the candidate pool once, then:

1. Refresh the free votes (similar, community_link) for every eligible
   target. Cheap, idempotent, parallelised over a small thread pool.

2. Run the paid LLM methods on every stale target, most popular first,
   until the daily budget would be crossed; the rest wait for tomorrow.
   A target is stale when its last successful paid run is older than
   (100 - popularity_percentile) + 7 days — the most popular questions
   refresh every ~7 days, the least popular every ~107 days.

Paid runs go through a worker pool of PAID_RUN_WORKERS threads.
The first stale target runs alone first: its opening call writes the
shared candidate-pool prefix into OpenAI's prompt cache, so everything
that runs afterwards — in any worker — reads input at the cached rate.
"""

from __future__ import annotations

import logging
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from dataclasses import dataclass
from datetime import datetime

from django.db import close_old_connections
from django.utils import timezone

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import budget
from coherence.services.suggestions.pipeline import (
    refresh_free_votes_for_target,
    run_paid_methods_for_target,
)
from coherence.services.suggestions.pool import Pool, TargetEntry, build_pool
from questions.models import Question

logger = logging.getLogger(__name__)

# Staleness floor: even the most popular question re-runs at most this often.
STALE_BASE_DAYS = 7

# Per-target estimate for the "would the next target cross the daily cap?"
# check. Set above the typical warm-cache cost of a target so it errs
# toward stopping a few targets early rather than overshooting.
ESTIMATED_PER_TARGET_USD = 0.05

# Thread count for the free-vote refresh (pure DB work).
FREE_REFRESH_THREADS = 8

# Concurrent LLM-processed targets (= simultaneous large API calls). There is
# no benefit to finishing the batch faster, so this stays low and polite to
# the API key's rate limits.
PAID_RUN_WORKERS = 4


@dataclass
class BatchReport:
    pool_size: int
    eligible_targets: int
    free_votes_refreshed: int
    paid_runs_attempted: int
    paid_runs_succeeded: int
    paid_runs_errored: int
    stopped_on_budget: bool
    spent_today_usd: float
    headroom_remaining_usd: float


def staleness_days_threshold(percentile: float) -> float:
    """Days a target may go without a paid run before it counts as stale."""
    return (100.0 - max(0.0, min(100.0, percentile))) + STALE_BASE_DAYS


def run_daily_batch() -> BatchReport:
    """The cron entry point."""
    pool = build_pool()
    logger.info(
        "daily_batch start: pool_size=%d eligible=%d hash=%s",
        pool.pool_size,
        len(pool.eligible_targets),
        pool.pool_hash,
    )
    if pool.pool_size == 0:
        logger.warning("daily_batch: empty candidate pool, nothing to do")
        return _report(pool, free=0, attempted=0, ok=0, errored=0, stopped=False)

    free_refreshed = _refresh_free_votes(pool)
    attempted, ok, errored, stopped = _run_paid_methods(pool)
    report = _report(
        pool,
        free=free_refreshed,
        attempted=attempted,
        ok=ok,
        errored=errored,
        stopped=stopped,
    )
    logger.info(
        "daily_batch done: free=%d paid_ok=%d paid_err=%d spent=$%.4f remaining=$%.4f",
        report.free_votes_refreshed,
        report.paid_runs_succeeded,
        report.paid_runs_errored,
        report.spent_today_usd,
        report.headroom_remaining_usd,
    )
    return report


def _refresh_free_votes(pool: Pool) -> int:
    """Phase 1: recompute the free votes for every eligible target."""
    public_candidate_ids = set(pool.candidate_ids)
    questions = Question.objects.filter(
        id__in=[t.question_id for t in pool.eligible_targets]
    ).select_related("post")

    def refresh_one(question: Question) -> bool:
        try:
            refresh_free_votes_for_target(question, public_candidate_ids)
            return True
        except Exception:
            logger.exception("free vote refresh failed for target %s", question.id)
            return False
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=FREE_REFRESH_THREADS) as executor:
        return sum(executor.map(refresh_one, questions.iterator()))


def _run_paid_methods(pool: Pool) -> tuple[int, int, int, bool]:
    """
    Phase 2: paid LLM runs on stale targets, most popular first, in a
    worker pool. Submission is budget-gated: overshoot is bounded by the
    number of in-flight workers. Returns (attempted, ok, errored, stopped).
    """
    last_done_run = _last_done_run_by_target()
    now = timezone.now()
    stale = [
        entry
        for entry in pool.eligible_targets
        if _is_stale(entry.question_id, entry.popularity_percentile, last_done_run, now)
    ]
    if not stale:
        return 0, 0, 0, False

    def run_one(entry: TargetEntry) -> bool:
        try:
            row = run_paid_methods_for_target(
                entry.question_id, pool.candidate_ids, pool.pool_hash
            )
            return row is not None and bool(row.paid_run_methods_succeeded)
        finally:
            close_old_connections()

    attempted = ok = errored = 0
    stopped = False

    def note(success: bool) -> None:
        nonlocal ok, errored
        if success:
            ok += 1
        else:
            errored += 1

    if budget.headroom_usd() < ESTIMATED_PER_TARGET_USD:
        logger.info("daily_batch: no budget headroom, skipping paid runs")
        return 0, 0, 0, True

    # The first target runs alone: its opening call populates the prompt
    # cache with the shared pool prefix, so all later calls (in any worker)
    # pay the cached input rate instead of racing to be first.
    attempted += 1
    try:
        note(run_one(stale[0]))
    except Exception:
        logger.exception("paid run crashed for target %s", stale[0].question_id)
        errored += 1

    remaining = iter(stale[1:])
    with ThreadPoolExecutor(max_workers=PAID_RUN_WORKERS) as executor:
        in_flight = {}
        while True:
            # Keep submitting while there's budget headroom and free workers.
            while len(in_flight) < PAID_RUN_WORKERS and not stopped:
                entry = next(remaining, None)
                if entry is None:
                    break
                if budget.headroom_usd() < ESTIMATED_PER_TARGET_USD:
                    # The fetched entry is dropped; it simply stays stale.
                    stopped = True
                    logger.info(
                        "daily_batch: budget reached after %d paid runs "
                        "(headroom=$%.4f)",
                        attempted,
                        budget.headroom_usd(),
                    )
                    break
                attempted += 1
                in_flight[executor.submit(run_one, entry)] = entry
            if not in_flight:
                break
            done, _ = wait(in_flight, return_when=FIRST_COMPLETED)
            for future in done:
                entry = in_flight.pop(future)
                try:
                    note(future.result())
                except Exception:
                    logger.exception(
                        "paid run crashed for target %s", entry.question_id
                    )
                    errored += 1

    return attempted, ok, errored, stopped


def _report(pool: Pool, *, free, attempted, ok, errored, stopped) -> BatchReport:
    return BatchReport(
        pool_size=pool.pool_size,
        eligible_targets=len(pool.eligible_targets),
        free_votes_refreshed=free,
        paid_runs_attempted=attempted,
        paid_runs_succeeded=ok,
        paid_runs_errored=errored,
        stopped_on_budget=stopped,
        spent_today_usd=budget.spent_today_usd(),
        headroom_remaining_usd=budget.headroom_usd(),
    )


def _last_done_run_by_target() -> dict[int, datetime]:
    """When each target's last successful paid run started. One query."""
    return dict(
        CoherenceLinkSuggestion.objects.filter(
            paid_run_status=CoherenceLinkSuggestion.PaidRunStatus.DONE
        ).values_list("target_question_id", "paid_run_started_at")
    )


def _is_stale(
    question_id: int,
    percentile: float,
    last_done_run: dict[int, datetime],
    now: datetime,
) -> bool:
    last = last_done_run.get(question_id)
    if last is None:
        return True
    age_days = (now - last).total_seconds() / 86400.0
    return age_days > staleness_days_threshold(percentile)
