from django.db import connection
from django.test.utils import CaptureQueriesContext

from questions.models import Question
from questions.serializers.common import serialize_question
from scoring.constants import ScoreTypes
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_scoring.factories import factory_score


def test_serialize_question_reads_only_aggregate_scores(question_binary, user1):
    method = question_binary.default_aggregation_method
    factory_score(question=question_binary, user=user1, score_type=ScoreTypes.PEER)
    factory_score(
        question=question_binary,
        aggregation_method=method,
        score_type=ScoreTypes.PEER,
        score=3,
    )
    prefetched = Question.objects.prefetch_related("scores", "archived_scores").get(
        pk=question_binary.pk
    )

    with CaptureQueriesContext(connection) as ctx:
        data = serialize_question(question_binary, aggregate_forecasts=[])
        serialize_question(prefetched, aggregate_forecasts=[])

    assert data["aggregations"][method]["score_data"]["peer_score"] == 3
    assert len(ctx.captured_queries) == 2
    assert all('"aggregation_method" IN' in q["sql"] for q in ctx.captured_queries)
