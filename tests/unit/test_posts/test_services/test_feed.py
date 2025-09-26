import pytest
from freezegun import freeze_time
from rest_framework.exceptions import PermissionDenied

from posts.models import PostUserSnapshot, Post
from posts.services.feed import get_posts_feed
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question, factory_forecast
from tests.unit.utils import datetime_aware


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


@freeze_time("2025-01-10")
def test_get_posts_feed__exclude_unpublished(user1):
    post_pending = factory_post(
        author=user1,
        published_at=datetime_aware(2025, 1, 10),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime_aware(2025, 1, 10),
            scheduled_close_time=datetime_aware(2025, 2, 10),
            scheduled_resolve_time=datetime_aware(2025, 2, 15),
        ),
        curation_status=Post.CurationStatus.PENDING,
    )

    # Future post, should not be visible
    factory_post(
        author=user1,
        published_at=datetime_aware(2025, 1, 11),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime_aware(2025, 1, 11),
        ),
    )

    post_active = factory_post(
        author=user1,
        published_at=datetime_aware(2025, 1, 10),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime_aware(2025, 1, 10),
        ),
    )

    # Should show only active posts by default
    posts = get_posts_feed()
    assert len(posts) == 1
    assert posts[0].id == post_active.id

    # But return pending if explicitly called
    posts = get_posts_feed(statuses=[Post.CurationStatus.PENDING])
    assert len(posts) == 1
    assert posts[0].id == post_pending.id
