from django.db import connection
from django.test.utils import CaptureQueriesContext

from posts.models import Post
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question


def test_deferred_by_default_field__skipped_in_joins(user1):
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(author=user1, question=question)

    with CaptureQueriesContext(connection) as ctx:
        post = Question.objects.select_related("post").get(pk=question.pk).post

    assert "embedding_vector" not in ctx.captured_queries[0]["sql"]
    assert "embedding_vector" in post.get_deferred_fields()


def test_deferred_by_default_field__loaded_when_named(user1):
    post = factory_post(author=user1)

    with CaptureQueriesContext(connection) as ctx:
        Post.objects.only("embedding_vector").get(pk=post.pk)

    assert "embedding_vector" in ctx.captured_queries[0]["sql"]
