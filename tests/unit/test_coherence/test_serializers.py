from django.db import connection
from django.test.utils import CaptureQueriesContext

from coherence.serializers import serialize_aggregate_coherence_links_questions_map
from tests.unit.test_coherence.factories import factory_aggregate_coherence_link
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa


def test_questions_map_without_links_skips_link_table(question_binary):
    with CaptureQueriesContext(connection) as ctx:
        assert (
            serialize_aggregate_coherence_links_questions_map([question_binary]) == {}
        )

    assert not [
        q for q in ctx.captured_queries if '"coherence_coherencelink"' in q["sql"]
    ]


def test_questions_map_loads_linked_questions_once_without_descriptions(
    question_binary, question_numeric, question_multiple_choice
):
    for question in (question_binary, question_numeric, question_multiple_choice):
        factory_post(question=question)
    factory_aggregate_coherence_link(
        question1=question_binary, question2=question_numeric
    )
    factory_aggregate_coherence_link(
        question1=question_multiple_choice, question2=question_binary
    )

    with CaptureQueriesContext(connection) as ctx:
        links_map = serialize_aggregate_coherence_links_questions_map([question_binary])

    assert len(links_map[question_binary]) == 2
    assert not [q for q in ctx.captured_queries if '"description' in q["sql"]]
    assert len(ctx.captured_queries) == 5
