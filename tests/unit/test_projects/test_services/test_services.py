from datetime import timedelta

from django.utils import timezone

from notifications.models import Notification
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.subscriptions import (
    notify_post_added_to_project,
    notify_project_subscriptions_post_open,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post, factory_notebook
from tests.unit.test_questions.factories import create_question
from tests.unit.test_users.factories import factory_user
from tests.unit.test_projects.factories import factory_project


def test_notify_project_subscriptions_post_open_notification(user1, user2):
    user3 = factory_user()
    project_default = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user1, user2]
    )
    project_1 = factory_project(subscribers=[user1, user3])
    project_2 = factory_project(subscribers=[user1])

    post = factory_post(
        author=factory_user(),
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_1, project_2],
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    # Post is located in 2 projects
    notify_project_subscriptions_post_open(
        post, event=Post.PostStatusChange.PUBLISHED, question=post.question
    )

    assert (
        Notification.objects.filter(recipient=user1, type="post_status_change").count()
        == 1
    )
    assert (
        Notification.objects.filter(recipient=user2, type="post_status_change").count()
        == 1
    )
    assert (
        Notification.objects.filter(recipient=user3, type="post_status_change").count()
        == 1
    )

    notification = Notification.objects.filter(
        recipient=user1, type="post_status_change"
    ).first()

    assert notification.params["event"] == "published"
    assert notification.params["project"]
    assert notification.params["post"]


def test_notify_project_subscriptions_post_open__private_question(user1, user2):
    project_default_private = factory_project(
        default_permission=None,
        override_permissions={user1.pk: ObjectPermission.FORECASTER},
    )
    project_public = factory_project(
        subscribers=[user1, user2], default_permission=ObjectPermission.FORECASTER
    )

    post = factory_post(
        author=factory_user(),
        default_project=project_default_private,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_public],
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    # Post is located in 2 projects
    notify_project_subscriptions_post_open(
        post, event=Post.PostStatusChange.PUBLISHED, question=post.question
    )

    assert set(
        Notification.objects.filter(type="post_status_change").values_list(
            "recipient_id", flat=True
        )
    ) == {user1.pk}


def test_notify_project_subscriptions_post_open__news_category(user1, mocker):
    project_default = factory_project(subscribers=[user1])
    project_1 = factory_project(
        subscribers=[user1], type=Project.ProjectTypes.NEWS_CATEGORY
    )
    project_2 = factory_project(subscribers=[user1])

    post = factory_post(
        author=factory_user(),
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_1, project_2],
        notebook=factory_notebook(),
    )
    mock_send = mocker.patch(
        "projects.services.subscriptions.send_news_category_notebook_publish_notification"
    )

    # Notebook should be sent in separate email
    # Since it has News Category project type
    notify_project_subscriptions_post_open(
        post, event=Post.PostStatusChange.PUBLISHED, notebook=post.notebook
    )
    mock_send.assert_called_once_with(user1, post)

    assert not Notification.objects.filter(
        recipient=user1, type="post_status_change"
    ).exists()


def test_notify_project_subscriptions_post_open__notebook(user1, mocker):
    project_default = factory_project(subscribers=[user1])
    project_2 = factory_project(subscribers=[user1])

    post = factory_post(
        author=factory_user(),
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_2],
        notebook=factory_notebook(),
    )
    mock_send = mocker.patch(
        "projects.services.subscriptions.send_news_category_notebook_publish_notification"
    )

    # Notebook should be sent in separate email
    # Since it has News Category project type
    notify_project_subscriptions_post_open(
        post, event=Post.PostStatusChange.PUBLISHED, notebook=post.notebook
    )
    mock_send.assert_not_called()

    assert set(
        Notification.objects.filter(type="post_status_change").values_list(
            "recipient_id", flat=True
        )
    ) == {user1.pk}


def test_notify_post_added_to_project__upcoming_question_sends_published(user1, user2):
    """
    When the question is published but open_time hasn't passed yet, adding
    the post to a project should notify subscribers with the PUBLISHED event.
    """

    project_default = factory_project(default_permission=ObjectPermission.FORECASTER)
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )
    future_open = timezone.now() + timedelta(days=7)

    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=future_open,
        scheduled_close_time=future_open + timedelta(days=30),
        scheduled_resolve_time=future_open + timedelta(days=60),
    )
    question.published_at_triggered = True
    question.save(update_fields=["published_at_triggered"])

    post = factory_post(
        author=user1,
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project],
        question=question,
    )

    notify_post_added_to_project(post, project)

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
    assert notifications.first().params["event"] == "published"


def test_notify_post_added_to_project__open_question_sends_open(user1, user2):
    """
    When the question is already OPEN, adding the post to a project should
    notify subscribers with the OPEN event (not PUBLISHED).
    """

    project_default = factory_project(default_permission=ObjectPermission.FORECASTER)
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user2]
    )
    past_open = timezone.now() - timedelta(days=1)

    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=past_open,
        scheduled_close_time=past_open + timedelta(days=30),
        scheduled_resolve_time=past_open + timedelta(days=60),
    )
    question.published_at_triggered = True
    question.open_time_triggered = True
    question.save(update_fields=["published_at_triggered", "open_time_triggered"])

    post = factory_post(
        author=user1,
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project],
        question=question,
    )

    notify_post_added_to_project(post, project)

    notifications = Notification.objects.filter(
        recipient=user2, type="post_status_change"
    )
    assert notifications.count() == 1
    assert notifications.first().params["event"] == "open"
