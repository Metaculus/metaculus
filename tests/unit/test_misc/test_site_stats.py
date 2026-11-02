from datetime import datetime, timezone as dt_timezone

from freezegun import freeze_time

from misc.services.stats import get_cached_site_stats, get_predictions_by_month
from questions.models import Forecast, Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


def _question(public: bool = True) -> Question:
    question = create_question(question_type=Question.QuestionType.BINARY)
    project = factory_project() if public else factory_project(default_permission=None)
    factory_post(question=question, default_project=project)
    return question


def _forecast(question, author, when, source=Forecast.SourceChoices.UI):
    return question.user_forecasts.create(
        author=author,
        probability_yes=0.5,
        start_time=when,
        source=source,
    )


def utc(*args):
    return datetime(*args, tzinfo=dt_timezone.utc)


@freeze_time("2026-03-15")
def test_predictions_by_month_is_cumulative_and_skips_current_month(user1):
    question = _question()
    _forecast(question, user1, utc(2026, 1, 3))
    _forecast(question, user1, utc(2026, 1, 20))
    _forecast(question, user1, utc(2026, 2, 10))
    _forecast(question, user1, utc(2026, 3, 1))  # current month, excluded

    series = get_predictions_by_month(Forecast.objects.all())

    assert series == [
        {"month": "2026-01", "cumulative": 2},
        {"month": "2026-02", "cumulative": 3},
    ]


@freeze_time("2026-03-15")
def test_site_stats_series_uses_the_same_filters_as_the_total(user1):
    public = _question()
    private = _question(public=False)
    _forecast(public, user1, utc(2026, 1, 3))
    _forecast(public, user1, utc(2026, 2, 3))
    _forecast(public, user1, utc(2026, 2, 4), source=Forecast.SourceChoices.AUTOMATIC)
    _forecast(private, user1, utc(2026, 2, 5))

    # Bypass the Redis-backed cache; this test is about the computation.
    stats = get_cached_site_stats.__wrapped__()

    assert stats["predictions"] == 2
    assert stats["predictions_by_month"] == [
        {"month": "2026-01", "cumulative": 1},
        {"month": "2026-02", "cumulative": 2},
    ]
    assert stats["predictions_by_month"][-1]["cumulative"] <= stats["predictions"]
