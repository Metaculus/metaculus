from datetime import datetime

from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from utils.cache import cached_singleton


@cached_singleton(timeout=60 * 60 * 24)
def get_cached_site_stats() -> dict:
    now_year = datetime.now().year
    public_questions = Question.objects.filter_public()

    return {
        "predictions": (
            Forecast.objects.filter(question__in=public_questions)
            .exclude(source=Forecast.SourceChoices.AUTOMATIC)
            .count()
        ),
        "questions": public_questions.count(),
        "resolved_questions": (
            public_questions.filter(actual_resolve_time__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .count()
        ),
        "years_of_predictions": now_year - 2015 + 1,
    }
