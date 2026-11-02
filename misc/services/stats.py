from datetime import datetime

from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone

from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from utils.cache import cached_singleton


def get_predictions_by_month(forecasts) -> list[dict]:
    """
    Cumulative prediction count at the end of each complete calendar month.

    Uses the same forecast queryset as the headline "predictions" count, so the
    About page chart and the stat tile under it always agree. The current,
    partial month is left out so the curve ends on a complete month.
    """
    month_start = timezone.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    rows = (
        forecasts.filter(start_time__lt=month_start)
        .annotate(month=TruncMonth("start_time"))
        .values("month")
        .annotate(n=Count("id"))
        .order_by("month")
    )

    series = []
    cumulative = 0
    for row in rows:
        cumulative += row["n"]
        series.append(
            {"month": row["month"].strftime("%Y-%m"), "cumulative": cumulative}
        )
    return series


@cached_singleton(timeout=60 * 60 * 24)
def get_cached_site_stats() -> dict:
    now_year = datetime.now().year
    public_questions = Question.objects.filter_public()
    public_forecasts = Forecast.objects.filter(question__in=public_questions).exclude(
        source=Forecast.SourceChoices.AUTOMATIC
    )

    return {
        "predictions": public_forecasts.count(),
        "questions": public_questions.count(),
        "resolved_questions": (
            public_questions.filter(actual_resolve_time__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .count()
        ),
        "years_of_predictions": now_year - 2015 + 1,
        "predictions_by_month": get_predictions_by_month(public_forecasts),
    }
