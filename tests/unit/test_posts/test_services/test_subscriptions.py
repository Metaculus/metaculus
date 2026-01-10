from datetime import datetime, timedelta

from django.utils import timezone
from django.utils.timezone import make_aware
from freezegun import freeze_time

from notifications.models import Notification
from posts.services.subscriptions import (
    create_subscription_new_comments,
    notify_new_comments,
    create_subscription_specific_time,
    notify_date,
    get_users_with_active_forecasts_for_questions,
)
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question, factory_forecast
from questions.models import Question


def test_notify_new_comments(user1, user2):
    post = factory_post(author=user1)
    subscription = create_subscription_new_comments(
        user=user1, post=post, comments_frequency=1
    )

    # Nothing should happen
    notify_new_comments(post)

    assert Notification.objects.filter(recipient=user1).count() == 0

    # Self-posted comment
    factory_comment(author=user1, on_post=post, text="Comment 1")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 0

    # Comment by other user
    c_2 = factory_comment(author=user2, on_post=post, text="Comment 2")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    notification = Notification.objects.filter(recipient=user1).first()

    assert notification.params["post"]["post_id"] == post.id
    assert notification.params["new_comment_ids"] == [c_2.id]
    assert notification.params["new_comments_count"] == 1

    # Update frequency to 3
    subscription.comments_frequency = 3
    subscription.save(update_fields=["comments_frequency"])

    c_3 = factory_comment(author=user2, on_post=post, text="Comment 3")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    c_4 = factory_comment(author=user2, on_post=post, text="Comment 4")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    c_5 = factory_comment(author=user2, on_post=post, text="Comment 5")

    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 2
    notification = Notification.objects.filter(recipient=user1).last()

    assert notification.params["post"]["post_id"] == post.id
    assert set(notification.params["new_comment_ids"]) == {c_3.id, c_4.id, c_5.id}
    assert notification.params["new_comments_count"] == 3


class TestNotifyDate:
    def test_notify_date__no_recurrence(self, user1):
        post = factory_post(author=user1)

        create_subscription_specific_time(
            user=user1, post=post, next_trigger_datetime=datetime(2024, 9, 17, 12, 45)
        )

        assert Notification.objects.filter(recipient=user1).count() == 0

        # Before expected date
        with freeze_time("2024-09-17T12:44Z"):
            notify_date()

        assert Notification.objects.filter(recipient=user1).count() == 0

        # After expected date
        with freeze_time("2024-09-17T12:46Z"):
            notify_date()

        assert Notification.objects.filter(recipient=user1).count() == 1

        # Shouldn't fire again
        with freeze_time("2024-09-17T13:46Z"):
            notify_date()

        assert Notification.objects.filter(recipient=user1).count() == 1

    def test_notify_date__daily(self, user1):
        post = factory_post(author=user1)

        sub = create_subscription_specific_time(
            user=user1,
            post=post,
            next_trigger_datetime=make_aware(datetime(2024, 9, 17, 12, 45)),
            recurrence_interval=timedelta(days=1),
        )

        assert Notification.objects.filter(recipient=user1).count() == 0

        # Before expected date
        with freeze_time("2024-09-17T12:44Z"):
            notify_date()
            assert Notification.objects.filter(recipient=user1).count() == 0

        # After expected date
        with freeze_time("2024-09-17T12:46Z"):
            notify_date()
            assert Notification.objects.filter(recipient=user1).count() == 1
            sub.refresh_from_db()
            assert sub.next_trigger_datetime == make_aware(
                datetime(2024, 9, 18, 12, 45)
            )

        # Shouldn't fire again until the next day
        with freeze_time("2024-09-17T13:46Z"):
            notify_date()
            assert Notification.objects.filter(recipient=user1).count() == 1

        # Fire again until the next day
        with freeze_time("2024-09-18T13:46Z"):
            notify_date()
            assert Notification.objects.filter(recipient=user1).count() == 2


class TestGetUsersWithActiveForecasts:
    def test_returns_users_with_active_forecasts(self, user1, user2):
        """Users with active forecasts (end_time=None) should be returned"""
        question = create_question(question_type=Question.QuestionType.BINARY)
        factory_post(author=user1, question=question)

        # User1 has an active forecast (end_time=None)
        factory_forecast(author=user1, question=question)

        result = get_users_with_active_forecasts_for_questions([question.pk])

        assert user1.pk in result
        assert user2.pk not in result

    def test_excludes_users_with_withdrawn_forecasts(self, user1):
        """Users with withdrawn forecasts (end_time set in past) should be excluded"""
        question = create_question(question_type=Question.QuestionType.BINARY)
        factory_post(author=user1, question=question)

        # User1 has a withdrawn forecast (end_time in the past)
        factory_forecast(
            author=user1,
            question=question,
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() - timedelta(hours=1),
        )

        result = get_users_with_active_forecasts_for_questions([question.pk])

        assert user1.pk not in result

    def test_includes_users_with_future_end_time(self, user1):
        """Users with end_time in the future are still considered active"""
        question = create_question(question_type=Question.QuestionType.BINARY)
        factory_post(author=user1, question=question)

        # User1 has a forecast that will be withdrawn in the future
        factory_forecast(
            author=user1,
            question=question,
            end_time=timezone.now() + timedelta(hours=1),
        )

        result = get_users_with_active_forecasts_for_questions([question.pk])

        assert user1.pk in result

    def test_user_with_one_active_one_withdrawn(self, user1):
        """User with at least one active forecast should be included"""
        question1 = create_question(question_type=Question.QuestionType.BINARY)
        question2 = create_question(question_type=Question.QuestionType.BINARY)
        factory_post(author=user1, question=question1)
        factory_post(author=user1, question=question2)

        # User1 has one withdrawn and one active forecast
        factory_forecast(
            author=user1,
            question=question1,
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() - timedelta(hours=1),
        )
        factory_forecast(author=user1, question=question2)

        result = get_users_with_active_forecasts_for_questions(
            [question1.pk, question2.pk]
        )

        assert user1.pk in result
