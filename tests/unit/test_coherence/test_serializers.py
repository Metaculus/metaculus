from django.db import connection
from django.test.utils import CaptureQueriesContext

from coherence.serializers import (
    serialize_aggregate_coherence_link_many,
    serialize_aggregate_coherence_links_questions_map,
)
from questions.models import Question
from tests.unit.test_coherence.factories import factory_aggregate_coherence_link
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.test_questions.conftest import *  # noqa


def test_questions_map_without_links_skips_link_table(question_binary):
    with CaptureQueriesContext(connection) as ctx:
        assert (
            serialize_aggregate_coherence_links_questions_map([question_binary]) == {}
        )

    assert not [
        q for q in ctx.captured_queries if '"coherence_coherencelink"' in q["sql"]
    ]


def question_with_post():
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(question=question)
    return question


def test_aggregate_links_load_questions_outside_link_query():
    center = question_with_post()
    links = [
        factory_aggregate_coherence_link(
            question1=center, question2=question_with_post()
        )
        for _ in range(3)
    ]

    with CaptureQueriesContext(connection) as ctx:
        data = serialize_aggregate_coherence_link_many(links)

    link_sql = next(
        q["sql"]
        for q in ctx.captured_queries
        if q["sql"].startswith('SELECT "coherence_aggregatecoherencelink"."id"')
    )
    assert '"questions_question"."title' not in link_sql
    assert {link["question1"]["id"] for link in data} == {center.id}
    assert [link["question2"]["id"] for link in data] == [
        link.question2_id for link in links
    ]
