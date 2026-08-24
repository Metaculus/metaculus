"""
The two write paths for a target's CoherenceLinkSuggestion row:

  - run_paid_methods_for_target: one LLM pass (the three paid methods,
    serially so later calls ride the prompt cache), plus audit fields.
  - refresh_free_votes_for_target: recompute the two free methods from
    live data.

Each writer replaces only its own method group's votes via
CoherenceLinkSuggestion.replace_votes, so neither can clobber the other.

Cost is committed with an atomic F() bump after each method finishes, so a
worker crash mid-run still leaves accurate spend on record.
"""

from __future__ import annotations

import logging
import time
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import methods, prompts
from questions.models import Question

logger = logging.getLogger(__name__)

Method = CoherenceLinkSuggestion.Method
PaidRunStatus = CoherenceLinkSuggestion.PaidRunStatus

# llm_broad runs first and warms the prompt cache with the full pool block;
# llm_strict rides that prefix. llm_similar_only sends its own small
# shortlist prompt, so its position doesn't matter.
PAID_METHOD_ORDER = [
    Method.LLM_BROAD,
    Method.LLM_STRICT,
    Method.LLM_SIMILAR_ONLY,
]


def run_paid_methods_for_target(
    target_id: int,
    candidate_ids: list[int],
    pool_hash: str,
) -> CoherenceLinkSuggestion | None:
    """
    Run the paid methods for one target and update its suggestion row in
    place. Returns the row, or None if the target doesn't exist.
    """
    target = (
        Question.objects.filter(id=target_id)
        .values("id", "title", "type", "description", "resolution_criteria")
        .first()
    )
    if target is None:
        logger.warning("run_paid_methods: target %s not found", target_id)
        return None

    # The target stays IN the pool: that keeps the pool block byte-identical
    # across every target in a batch, so the prompt cache is shared between
    # targets, not just between the methods of one target. Self-votes are
    # dropped by replace_votes.
    candidates = _load_candidates(candidate_ids)
    # Truncate once so every method sees the same pool (same cached prefix).
    candidates, truncated = prompts.fit_pool_to_context(candidates, target)
    if truncated:
        logger.warning(
            "run_paid_methods: pool truncated to %d candidates for target %s",
            len(candidates),
            target_id,
        )

    started = time.time()
    row, _ = CoherenceLinkSuggestion.objects.get_or_create(target_question_id=target_id)
    # Resetting cost assumes at most one run per target per day: the budget
    # sums current row values, so a same-day re-run would drop the earlier
    # run's spend from today's total.
    CoherenceLinkSuggestion.objects.filter(pk=row.pk).update(
        paid_run_status=PaidRunStatus.PENDING,
        paid_run_started_at=timezone.now(),
        paid_run_cost_usd=Decimal("0"),
        paid_run_methods_attempted=PAID_METHOD_ORDER,
        paid_run_methods_succeeded=[],
        paid_run_pool_hash=pool_hash,
        paid_run_pool_size=len(candidate_ids),
        paid_run_elapsed_s=None,
        paid_run_error_message="",
    )

    succeeded: list[str] = []
    errors: list[str] = []
    votes: dict[int, list[str]] = {}

    for method_name in PAID_METHOD_ORDER:
        try:
            result = methods.PAID_METHODS[method_name](target, candidates)
        except Exception as exc:
            logger.exception("%s crashed for target %s", method_name, target_id)
            errors.append(f"{method_name}: {exc};")
            continue

        # Commit cost before inspecting the result, so a crash on the next
        # line still leaves the spend on record.
        _add_cost(row.pk, result.cost_usd)

        if result.error:
            errors.append(f"{method_name}: {result.error};")
        else:
            succeeded.append(method_name)
        for cid in result.candidate_ids:
            votes.setdefault(cid, []).append(method_name)

    error_message = " ".join(errors)[:2000]

    try:
        with transaction.atomic():
            # Reload under lock to merge with any concurrent free-vote refresh.
            row = CoherenceLinkSuggestion.objects.select_for_update().get(pk=row.pk)
            # Replace only the succeeded methods' votes: a method that failed
            # (or a whole run lost to an API outage) keeps its previous votes
            # — stale suggestions beat none.
            row.replace_votes(frozenset(succeeded), votes)
            row.paid_run_status = (
                PaidRunStatus.DONE if succeeded else PaidRunStatus.ERROR
            )
            row.paid_run_methods_succeeded = succeeded
            row.paid_run_elapsed_s = int(time.time() - started)
            row.paid_run_error_message = error_message
            row.save(
                update_fields=[
                    "methods_by_candidate",
                    "paid_run_status",
                    "paid_run_methods_succeeded",
                    "paid_run_elapsed_s",
                    "paid_run_error_message",
                    "edited_at",
                ]
            )
    except CoherenceLinkSuggestion.DoesNotExist:
        # The question (and, by cascade, our row) was deleted while the LLM
        # calls were in flight. Discard the results.
        logger.info("run_paid_methods: target %s deleted mid-run", target_id)
        return None

    logger.info(
        "run_paid_methods target=%s ok=%s errors=%d cost=$%.4f elapsed=%ds",
        target_id,
        succeeded,
        len(errors),
        float(row.paid_run_cost_usd),
        row.paid_run_elapsed_s,
    )
    return row


def refresh_free_votes_for_target(
    target: Question, public_candidate_ids: set[int]
) -> None:
    """
    Recompute the free methods for one target from live data and replace
    their votes on its suggestion row. Paid votes are untouched.
    """
    votes: dict[int, list[str]] = {}
    for cid in methods.similar_candidates(target, public_candidate_ids):
        votes.setdefault(cid, []).append(Method.SIMILAR)
    for cid in methods.community_link_candidates(target.id, public_candidate_ids):
        votes.setdefault(cid, []).append(Method.COMMUNITY_LINK)

    try:
        with transaction.atomic():
            row, _ = CoherenceLinkSuggestion.objects.get_or_create(
                target_question=target
            )
            row = CoherenceLinkSuggestion.objects.select_for_update().get(pk=row.pk)
            row.replace_votes(Method.FREE, votes)
            row.free_refreshed_at = timezone.now()
            row.save(
                update_fields=["methods_by_candidate", "free_refreshed_at", "edited_at"]
            )
    except (CoherenceLinkSuggestion.DoesNotExist, IntegrityError):
        logger.info("refresh_free_votes: target %s deleted mid-refresh", target.id)


def _load_candidates(candidate_ids: list[int]) -> list[dict]:
    """Fetch candidate rows, preserving the given order."""
    rows = Question.objects.filter(id__in=candidate_ids).values("id", "title", "type")
    by_id = {r["id"]: r for r in rows}
    return [by_id[i] for i in candidate_ids if i in by_id]


def _add_cost(row_pk: int, delta_usd: float) -> None:
    if delta_usd <= 0:
        return
    CoherenceLinkSuggestion.objects.filter(pk=row_pk).update(
        paid_run_cost_usd=F("paid_run_cost_usd") + Decimal(f"{delta_usd:.6f}"),
    )
