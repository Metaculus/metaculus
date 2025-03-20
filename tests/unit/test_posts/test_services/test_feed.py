import pytest
from rest_framework.exceptions import PermissionDenied

from posts.models import PostUserSnapshot
from posts.services.feed import get_posts_feed
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question, factory_forecast


def test_get_posts_feed__forecaster_id(user1, user2):
    post_1 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )
    PostUserSnapshot.update_last_forecast_date(post=post_1, user=user1)

    post_2 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )
    PostUserSnapshot.update_last_forecast_date(post=post_2, user=user2)

    factory_forecast(question=post_1.question, author=user1)
    factory_forecast(question=post_2.question, author=user2)

    posts = get_posts_feed(user=user1, forecaster_id=user1.id)
    assert len(posts) == 1
    assert posts[0].id == post_1.id

    posts = get_posts_feed(user=user2, forecaster_id=user2.id)
    assert len(posts) == 1
    assert posts[0].id == post_2.id

    with pytest.raises(PermissionDenied):
        get_posts_feed(user=user1, forecaster_id=user2.id)

    with pytest.raises(PermissionDenied):
        get_posts_feed(user=user2, forecaster_id=user1.id)
