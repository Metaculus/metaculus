import datetime

import pytest
from freezegun import freeze_time

from posts.models import Post
from projects.models import Project, ProjectIndexQuestion
from projects.services.indexes import calculate_project_index_timeline
from questions.models import Question, AggregateForecast
from questions.types import AggregationMethod
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware


@pytest.fixture
def index_project():
    return factory_project(type=Project.ProjectTypes.INDEX)


@freeze_time("2025-01-10")
def test_calculate_project_index_timeline(index_project):
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        scheduled_close_time=datetime_aware(2025, 1, 7),
        actual_close_time=datetime_aware(2025, 1, 7),
        # TODO: what if resolve time < close time?
        actual_resolve_time=datetime_aware(2025, 1, 8),
    )
    factory_post(
        question=question,
        curation_status=Post.CurationStatus.APPROVED,
        default_project=index_project,
    )
    ProjectIndexQuestion.objects.create(
        question=question, project=index_project, weight=1
    )

    AggregateForecast(
        question=question,
        start_time=datetime_aware(2025, 1, 4),
        end_time=datetime_aware(2025, 1, 5),
        method=AggregationMethod.RECENCY_WEIGHTED,
        centers=[0.6, 0.4],
        forecast_values=[0.6, 0.4],
    ).save()
    AggregateForecast(
        question=question,
        start_time=datetime_aware(2025, 1, 5),
        end_time=datetime_aware(2025, 1, 6),
        method=AggregationMethod.RECENCY_WEIGHTED,
        centers=[0.4, 0.6],
        forecast_values=[0.4, 0.6],
    ).save()
    AggregateForecast(
        question=question,
        start_time=datetime_aware(2025, 1, 6),
        method=AggregationMethod.RECENCY_WEIGHTED,
        centers=[0.25, 0.75],
        forecast_values=[0.25, 0.75],
    ).save()

    data = calculate_project_index_timeline(index_project)

    def find_point(dt: datetime.datetime):
        return next(x for x in data if x["x"] == dt.timestamp())["y"]

    assert find_point(datetime_aware(2025, 1, 4)) == pytest.approx(-20)
    assert find_point(datetime_aware(2025, 1, 5)) == pytest.approx(20)
    assert find_point(datetime_aware(2025, 1, 6)) == pytest.approx(50)
