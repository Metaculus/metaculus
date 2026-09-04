"""
Daily USD budget guard for the paid (LLM) suggestion methods.

Spend is the sum of `paid_run_cost_usd` across rows whose paid run started
today (UTC calendar day) — the same F()-bumped field the pipeline maintains,
so a crashed worker still contributes its partial spend.

The scheduler checks `headroom_usd()` before each target and stops for the
day when it dips below the per-target estimate.
"""

from __future__ import annotations

from datetime import UTC, datetime, time

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone


def spent_today_usd() -> float:
    """USD spent by paid runs that started today."""
    from coherence.models import CoherenceLinkSuggestion

    total = (
        CoherenceLinkSuggestion.objects.filter(paid_run_started_at__gte=_start_of_day())
        .aggregate(s=Sum("paid_run_cost_usd"))
        .get("s")
    )
    return float(total or 0.0)


def headroom_usd() -> float:
    return max(0.0, float(settings.SUGGESTIONS_LIMIT_USD_DAILY) - spent_today_usd())


def _start_of_day() -> datetime:
    utc_now = timezone.now().astimezone(UTC)
    return datetime.combine(utc_now.date(), time.min, tzinfo=UTC)
