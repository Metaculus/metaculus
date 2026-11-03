from datetime import datetime

from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone

from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from utils.cache import cached_singleton


def get_prediction_counts(forecasts) -> tuple[int, list[dict]]:
    """
    Total prediction count, plus the cumulative count at the end of each
    complete calendar month.

    One GROUP BY pass gives both, so the headline "predictions" number and the
    About page chart come from the same rows and always agree. The current,
    partial month counts toward the total but is left out of the series, so
    the curve ends on a complete month.
    """
    month_start = timezone.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    rows = (
        forecasts.annotate(month=TruncMonth("start_time"))
        .values("month")
        .annotate(n=Count("id"))
        .order_by("month")
    )

    total = 0
    series = []
    for row in rows:
        total += row["n"]
        if row["month"] is not None and row["month"] < month_start:
            series.append(
                {"month": row["month"].strftime("%Y-%m"), "cumulative": total}
            )
    return total, series


@cached_singleton(timeout=60 * 60 * 24)
def get_cached_site_stats() -> dict:
    now_year = datetime.now().year
    public_questions = Question.objects.filter_public()
    public_forecasts = Forecast.objects.filter(question__in=public_questions).exclude(
        source=Forecast.SourceChoices.AUTOMATIC
    )

    predictions, predictions_by_month = get_prediction_counts(public_forecasts)

    return {
        "predictions": predictions,
        "questions": public_questions.count(),
        "resolved_questions": (
            public_questions.filter(actual_resolve_time__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .count()
        ),
        "years_of_predictions": now_year - 2015 + 1,
        "predictions_by_month": predictions_by_month,
    }
