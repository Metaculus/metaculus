from datetime import datetime, timezone as dt_timezone

from posts.models import PostSubscription
from projects.models import ProjectSubscription
from projects.permissions import ObjectPermission
from projects.services.subscriptions import (
    subscribe_project,
    unsubscribe_project,
    follow_new_project_post,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.test_users.factories import factory_user
from tests.unit.test_projects.factories import factory_project


def test_subscribe_with_follow_questions(user1):
    """Subscribing with follow_questions=True creates PostSubscriptions for all questions."""
    project = factory_project(default_permission=ObjectPermission.FORECASTER)
    post1 = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_close_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_resolve_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
        ),
    )
    post1.update_pseudo_materialized_fields()
    post2 = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_close_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_resolve_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
        ),
    )
    post2.update_pseudo_materialized_fields()

    subscribe_project(project=project, user=user1, follow_questions=True)

    # User should be subscribed to the project
    sub = ProjectSubscription.objects.get(project=project, user=user1)
    assert sub.follow_questions is True

    # User should have default subscriptions on both posts
    for post in [post1, post2]:
        post_subs = PostSubscription.objects.filter(
            user=user1, post=post, is_global=False
        )
        sub_types = set(post_subs.values_list("type", flat=True))
        assert sub_types == {
            PostSubscription.SubscriptionType.NEW_COMMENTS,
            PostSubscription.SubscriptionType.STATUS_CHANGE,
            PostSubscription.SubscriptionType.MILESTONE,
            PostSubscription.SubscriptionType.CP_CHANGE,
        }


def test_subscribe_without_follow_questions(user1):
    """Subscribing without follow_questions does not create PostSubscriptions."""
    project = factory_project(default_permission=ObjectPermission.FORECASTER)
    factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    subscribe_project(project=project, user=user1, follow_questions=False)

    assert ProjectSubscription.objects.filter(project=project, user=user1).exists()
    assert not PostSubscription.objects.filter(user=user1, is_global=False).exists()


def test_subscribe_follow_questions_skips_already_followed(user1):
    """If user already follows a post, subscribing with follow_questions skips it."""
    project = factory_project(default_permission=ObjectPermission.FORECASTER)
    post = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    # Manually follow the post first
    PostSubscription.objects.create(
        user=user1,
        post=post,
        type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        comments_frequency=5,
    )

    subscribe_project(project=project, user=user1, follow_questions=True)

    # Should still have only the original subscription (not overwritten with defaults)
    post_subs = PostSubscription.objects.filter(user=user1, post=post, is_global=False)
    assert post_subs.count() == 1
    assert post_subs.first().comments_frequency == 5


def test_unsubscribe_with_unfollow_questions(user1):
    """Unsubscribing with unfollow_questions=True removes all PostSubscriptions."""
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user1]
    )
    post = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    # Create some subscriptions
    PostSubscription.objects.create(
        user=user1,
        post=post,
        type=PostSubscription.SubscriptionType.STATUS_CHANGE,
    )

    unsubscribe_project(project=project, user=user1, unfollow_questions=True)

    assert not ProjectSubscription.objects.filter(project=project, user=user1).exists()
    assert not PostSubscription.objects.filter(
        user=user1, post=post, is_global=False
    ).exists()


def test_unsubscribe_without_unfollow_questions(user1):
    """Unsubscribing without unfollow_questions keeps PostSubscriptions."""
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user1]
    )
    post = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    PostSubscription.objects.create(
        user=user1,
        post=post,
        type=PostSubscription.SubscriptionType.STATUS_CHANGE,
    )

    unsubscribe_project(project=project, user=user1, unfollow_questions=False)

    assert not ProjectSubscription.objects.filter(project=project, user=user1).exists()
    assert PostSubscription.objects.filter(
        user=user1, post=post, is_global=False
    ).exists()


def test_follow_new_project_post(user1, user2):
    """When a new post is added, users with follow_questions get auto-subscribed."""
    project = factory_project(default_permission=ObjectPermission.FORECASTER)

    # user1 subscribes with follow_questions
    subscribe_project(project=project, user=user1, follow_questions=True)
    # user2 subscribes without follow_questions
    subscribe_project(project=project, user=user2, follow_questions=False)

    # New post added to project
    new_post = factory_post(
        author=factory_user(),
        default_project=project,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=datetime(2024, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_close_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
            scheduled_resolve_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
        ),
    )
    new_post.update_pseudo_materialized_fields()

    follow_new_project_post(new_post, project)

    # user1 should have subscriptions on the new post
    assert PostSubscription.objects.filter(
        user=user1, post=new_post, is_global=False
    ).exists()

    # user2 should not
    assert not PostSubscription.objects.filter(
        user=user2, post=new_post, is_global=False
    ).exists()


def test_resubscribe_updates_follow_questions(user1):
    """Re-subscribing updates the follow_questions preference."""
    project = factory_project(default_permission=ObjectPermission.FORECASTER)

    subscribe_project(project=project, user=user1, follow_questions=False)
    sub = ProjectSubscription.objects.get(project=project, user=user1)
    assert sub.follow_questions is False

    subscribe_project(project=project, user=user1, follow_questions=True)
    sub.refresh_from_db()
    assert sub.follow_questions is True
