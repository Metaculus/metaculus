from datetime import timedelta

from django.utils import timezone

from notifications.models import Notification
from posts.jobs import job_check_post_open_event
from posts.models import Post
from projects.permissions import ObjectPermission
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


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

    post.question.refresh_from_db()
    assert post.question.published_at_triggered is True
    # Question is still Upcoming — open_time has not passed
    assert post.question.open_time_triggered is False

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
    assert notifications.first().params["event"] == "open"


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

    post.question.refresh_from_db()
    assert post.question.published_at_triggered is True
    assert post.question.open_time_triggered is True

    # One tournament notification (from publish event) + one post status
    # change notification (from open event). Tournament followers should not
    # be notified twice.
    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
