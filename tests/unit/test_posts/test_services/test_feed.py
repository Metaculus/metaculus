import pytest
from freezegun import freeze_time
from rest_framework.exceptions import PermissionDenied

from posts.models import PostUserSnapshot, Post
from posts.services.feed import get_posts_feed
from projects.models import Project
from projects.services.common import get_site_main_project
from questions.models import Question
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
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


def test_get_posts_feed__commented_by(user1, user2):
    post_1 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )
    post_2 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )
    post_3 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    factory_comment(author=user1, on_post=post_1)
    factory_comment(author=user2, on_post=post_2)
    # Soft-deleted comments don't count
    factory_comment(author=user1, on_post=post_3, is_soft_deleted=True)

    posts = get_posts_feed(user=user1, commented_by=user1.id)
    assert len(posts) == 1
    assert posts[0].id == post_1.id

    posts = get_posts_feed(user=user2, commented_by=user2.id)
    assert len(posts) == 1
    assert posts[0].id == post_2.id

    with pytest.raises(PermissionDenied):
        get_posts_feed(user=user1, commented_by=user2.id)

    with pytest.raises(PermissionDenied):
        get_posts_feed(user=None, commented_by=user1.id)


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


def test_get_posts_feed__pending_main_feed_excludes_tournament_posts(user1):
    """
    The main-feed pending queue should only include posts attached to site_main,
    not pending posts submitted into tournaments with visibility=NORMAL.
    """

    site_main = get_site_main_project()
    tournament = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        visibility=Project.Visibility.NORMAL,
    )

    post_pending_main = factory_post(
        author=user1,
        default_project=site_main,
        question=create_question(question_type=Question.QuestionType.BINARY),
        curation_status=Post.CurationStatus.PENDING,
    )
    post_pending_main_via_m2m = factory_post(
        author=user1,
        default_project=tournament,
        projects=[site_main],
        question=create_question(question_type=Question.QuestionType.BINARY),
        curation_status=Post.CurationStatus.PENDING,
    )
    post_pending_tournament_only = factory_post(
        author=user1,
        default_project=tournament,
        question=create_question(question_type=Question.QuestionType.BINARY),
        curation_status=Post.CurationStatus.PENDING,
    )

    # Main-feed pending queue: only the site_main-attached posts show up
    posts = get_posts_feed(
        user=user1,
        for_main_feed=True,
        statuses=[Post.CurationStatus.PENDING],
    )
    post_ids = {p.id for p in posts}
    assert post_ids == {post_pending_main.id, post_pending_main_via_m2m.id}
    assert post_pending_tournament_only.id not in post_ids

    # Without for_main_feed, the tournament-only pending post is included
    posts = get_posts_feed(
        user=user1,
        statuses=[Post.CurationStatus.PENDING],
    )
    post_ids = {p.id for p in posts}
    assert post_pending_tournament_only.id in post_ids
