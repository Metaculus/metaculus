"""Cron-driven jobs for AI question-link suggestions."""

import logging

import dramatiq
from django.conf import settings

from coherence.services.suggestions.scheduler import run_daily_batch

logger = logging.getLogger(__name__)


# A typical batch finishes well under an hour; the generous limit covers
# rate-limit backoff on constrained API keys and the first-ever catch-up
# run, while staying clear of the next day's schedule. No retries: a
# crashed batch is caught up by tomorrow's run rather than re-spending
# today's budget on repeats.
@dramatiq.actor(time_limit=12 * 60 * 60 * 1000, max_retries=0)
def job_run_daily_suggestion_batch():
    """
    Daily scheduler. Refreshes free signals for every eligible target, then
    runs paid LLM methods on stale targets (most popular first) until the
    daily budget is exhausted.

    Master switch: when SUGGESTIONS_AI_ENABLED is false, the job is a no-op
    — nothing is computed and no money is spent. Free signals are also
    skipped in this state, which is intentional: while the feature is off,
    there's no reason to maintain ~7k CoherenceLinkSuggestion rows daily.
    """
    if not settings.SUGGESTIONS_AI_ENABLED:
        logger.info(
            "job_run_daily_suggestion_batch: SUGGESTIONS_AI_ENABLED=false, skipping"
        )
        return
    report = run_daily_batch()
    logger.info("daily_batch report: %s", report)
