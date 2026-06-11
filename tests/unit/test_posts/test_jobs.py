from datetime import timedelta

from django.utils import timezone

from notifications.models import Notification
from posts.jobs import job_check_post_open_event
from posts.models import Post
from projects.permissions import ObjectPermission
from questions.models import Question
from tests.unit.test_posts.factories import factory_post, factory_notebook
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


def test_job_check_post_open_event__fires_publish_notification_before_open_time(
    user1, user2
):
    """
    A user following a tournament should be notified at publish time
    (i.e., when the question is set to Upcoming) — before `open_time` passes.
    """

    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )
    future_open = timezone.now() + timedelta(days=7)

    post = factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=timezone.now() - timedelta(minutes=5),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=future_open,
            scheduled_close_time=future_open + timedelta(days=30),
            scheduled_resolve_time=future_open + timedelta(days=60),
        ),
    )

    job_check_post_open_event()

    post.refresh_from_db()
    post.question.refresh_from_db()
    assert post.published_at_triggered is True
    # Question is still Upcoming — open_time has not passed
    assert post.question.open_time_triggered is False

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
    assert notifications.first().params["event"] == "published"


def test_job_check_post_open_event__publish_notification_is_idempotent(user1, user2):
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )
    future_open = timezone.now() + timedelta(days=7)

    factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=timezone.now() - timedelta(minutes=5),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=future_open,
            scheduled_close_time=future_open + timedelta(days=30),
            scheduled_resolve_time=future_open + timedelta(days=60),
        ),
    )

    job_check_post_open_event()
    job_check_post_open_event()

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1


def test_job_check_post_open_event__no_double_publish_on_open(user1, user2):
    """
    When a post's open_time also passes, the publish event must not fire a
    second tournament notification for the same question.
    """

    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )

    post = factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=timezone.now() - timedelta(days=2),
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=timezone.now() - timedelta(minutes=5),
            scheduled_close_time=timezone.now() + timedelta(days=30),
            scheduled_resolve_time=timezone.now() + timedelta(days=60),
        ),
    )

    job_check_post_open_event()

    post.refresh_from_db()
    post.question.refresh_from_db()
    assert post.published_at_triggered is True
    assert post.question.open_time_triggered is True

    # One tournament notification (from publish event) + one post status
    # change notification (from open event). Tournament followers should not
    # be notified twice.
    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1


def test_job_check_post_open_event__adding_question_to_published_post_does_not_refire(
    user1, user2
):
    """
    Publishing is a Post-level event. Once it has fired, adding a new question
    to an already-published group post must NOT re-fire a publish notification
    to tournament / project followers.
    """

    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )
    future_open = timezone.now() + timedelta(days=7)

    group = factory_group_of_questions()
    factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=timezone.now() - timedelta(minutes=5),
        group_of_questions=group,
    )
    create_question(
        question_type=Question.QuestionType.BINARY,
        group=group,
        open_time=future_open,
        scheduled_close_time=future_open + timedelta(days=30),
        scheduled_resolve_time=future_open + timedelta(days=60),
    )

    job_check_post_open_event()

    assert (
        Notification.objects.filter(recipient=user2, type="post_status_change").count()
        == 1
    )

    # A new subquestion is added to the already-published group later on.
    create_question(
        question_type=Question.QuestionType.BINARY,
        group=group,
        open_time=future_open,
        scheduled_close_time=future_open + timedelta(days=30),
        scheduled_resolve_time=future_open + timedelta(days=60),
    )

    job_check_post_open_event()

    # No second tournament notification for the same (already-published) post.
    assert (
        Notification.objects.filter(recipient=user2, type="post_status_change").count()
        == 1
    )


def test_job_check_post_open_event__notebook_publish_fires_once(user1, user2):
    """
    Notebook posts have no open vs. publish distinction, so the publish event
    fires once when the notebook post is published, and is idempotent.
    """

    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )

    post = factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=timezone.now() - timedelta(minutes=5),
        notebook=factory_notebook(),
    )

    job_check_post_open_event()
    job_check_post_open_event()

    post.refresh_from_db()
    assert post.published_at_triggered is True

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
    assert notifications.first().params["event"] == "published"


def test_warm_default_feed_response(settings):
    from django.core.cache import cache as django_cache
    from rest_framework.test import APIClient

    from posts.services.feed_cache import (
        DEFAULT_FEED_QUERY,
        warm_default_feed_response,
    )

    settings.FEED_RESPONSE_CACHE_ENABLED = True
    settings.CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }
    django_cache.clear()
    warm_default_feed_response()
    locmem = django_cache._cache
    assert sum(1 for k in locmem if "feed_resp:" in k) == 1

    # an identical anonymous request must hit the warmed key, not add a second
    response = APIClient().get("/api/posts/", DEFAULT_FEED_QUERY)
    assert response.status_code == 200
    assert sum(1 for k in locmem if "feed_resp:" in k) == 1
