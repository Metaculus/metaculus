"""
Observability numbers for the suggestion_stats management command.
Written for someone who doesn't know the code: every key is a sentence.
"""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import budget
from coherence.services.suggestions.pool import eligible_targets_by_popularity
from coherence.services.suggestions.scheduler import staleness_days_threshold


def overview_stats() -> dict:
    now = timezone.now()
    done = CoherenceLinkSuggestion.PaidRunStatus.DONE

    eligible = eligible_targets_by_popularity()
    eligible_ids = {e.question_id for e in eligible}

    recently_run_ids = (
        set(
            CoherenceLinkSuggestion.objects.filter(
                paid_run_status=done,
                paid_run_started_at__gte=now - timedelta(days=15),
            ).values_list("target_question_id", flat=True)
        )
        & eligible_ids
    )
    coverage = len(recently_run_ids) / len(eligible) if eligible else 0.0

    spent_7d = (
        CoherenceLinkSuggestion.objects.filter(
            paid_run_started_at__gte=now - timedelta(days=7)
        ).aggregate(s=Sum("paid_run_cost_usd"))["s"]
        or 0
    )

    # Stale = never had a successful paid run, or had one longer ago than the
    # popularity-aware threshold allows. Counted across all eligible targets;
    # the least popular ones may sit here for a while by design.
    last_done_run = dict(
        CoherenceLinkSuggestion.objects.filter(paid_run_status=done).values_list(
            "target_question_id", "paid_run_started_at"
        )
    )
    stale_pending = 0
    for entry in eligible:
        last = last_done_run.get(entry.question_id)
        if last is None:
            stale_pending += 1
            continue
        age_days = (now - last).total_seconds() / 86400
        if age_days > staleness_days_threshold(entry.popularity_percentile):
            stale_pending += 1

    # "Today" numbers come from the budget module so they always agree with
    # what the scheduler actually enforces (UTC calendar day).
    return {
        "total_eligible_questions": len(eligible),
        "questions_with_recent_ai_data_pct": round(coverage * 100, 1),
        "questions_with_recent_ai_data_count": len(recently_run_ids),
        "questions_pending_refresh": stale_pending,
        "daily_budget_usd": float(settings.SUGGESTIONS_LIMIT_USD_DAILY),
        "spent_today_usd": round(budget.spent_today_usd(), 4),
        "spent_last_7_days_usd": round(float(spent_7d), 4),
        "budget_headroom_today_usd": round(budget.headroom_usd(), 4),
    }
