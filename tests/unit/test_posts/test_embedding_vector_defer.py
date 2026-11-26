import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from coherence.serializers import (
    serialize_aggregate_coherence_link_many,
    serialize_coherence_link_many,
)
from comments.models import KeyFactorDriver
from comments.serializers.key_factors import serialize_key_factors_many
from posts.serializers import serialize_post_many
from tests.unit.test_coherence.factories import (
    factory_aggregate_coherence_link,
    factory_coherence_link,
)
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post


@pytest.fixture()
def posted_questions(user1, question_binary, question_numeric):
    factory_post(author=user1, question=question_binary)
    factory_post(author=user1, question=question_numeric)

    return question_binary, question_numeric


def embedding_vector_queries(serialize):
    with CaptureQueriesContext(connection) as ctx:
        assert serialize()

    return [q["sql"] for q in ctx.captured_queries if "embedding_vector" in q["sql"]]


def test_serialize_key_factors_many__defers_post_embedding_vector(user1):
    key_factor = factory_key_factor(
        comment=factory_comment(author=user1, on_post=factory_post(author=user1)),
        driver=KeyFactorDriver.objects.create(text_en="Driver"),
    )

    assert not embedding_vector_queries(
        lambda: serialize_key_factors_many([key_factor])
    )


def test_serialize_coherence_link_many__defers_post_embedding_vector(
    user1, posted_questions
):
    question1, question2 = posted_questions
    link = factory_coherence_link(question1=question1, question2=question2, user=user1)

    assert not embedding_vector_queries(lambda: serialize_coherence_link_many([link]))


def test_serialize_aggregate_coherence_link_many__defers_post_embedding_vector(
    posted_questions,
):
    question1, question2 = posted_questions
    link = factory_aggregate_coherence_link(question1=question1, question2=question2)

    assert not embedding_vector_queries(
        lambda: serialize_aggregate_coherence_link_many([link])
    )


def test_serialize_post_many__defers_condition_post_embedding_vector(
    user1, posted_questions, conditional_1
):
    post = factory_post(author=user1, conditional=conditional_1)

    assert not embedding_vector_queries(lambda: serialize_post_many([post]))
