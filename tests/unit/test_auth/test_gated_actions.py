from datetime import timedelta

import pytest
from django.utils import timezone as dj_timezone
from rest_framework.exceptions import ValidationError

from authentication.services.gated_actions import (
    apply_pending_action,
    clear_pending_action,
    pop_pending_action,
    set_pending_action,
    validate_gated_action,
)
from posts.models import PostSubscription, Vote
from questions.models import Forecast, Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


@pytest.fixture
def public_post(user1):
    return factory_post(author=user1)


class TestPendingActionStore:
    def test_set_and_pop(self):
        set_pending_action(1, "post_vote", {"post": 5, "direction": 1})

        entry = pop_pending_action(1)
        assert entry["type"] == "post_vote"
        assert entry["payload"] == {"post": 5, "direction": 1}
        assert entry["requested_at"]

        # pop consumes
        assert pop_pending_action(1) is None

    def test_latest_wins_overwrite(self):
        set_pending_action(1, "post_vote", {"post": 5, "direction": 1})
        set_pending_action(1, "forecast", [{"question": 7, "probability_yes": 0.6}])

        assert pop_pending_action(1)["type"] == "forecast"

    def test_clear(self):
        set_pending_action(1, "post_vote", {"post": 5, "direction": 1})
        clear_pending_action(1)

        assert pop_pending_action(1) is None

    def test_ttl_uses_setting(self, mocker, settings):
        settings.AUTH_EMAIL_LINK_TIMEOUT = 1234
        mock_set = mocker.patch("authentication.services.gated_actions.cache.set")

        set_pending_action(1, "post_vote", {"post": 5, "direction": 1})

        assert mock_set.call_args.kwargs["timeout"] == 1234
        # Stored as a dict; the cache backend handles serialization.
        stored = mock_set.call_args.args[1]
        assert stored["type"] == "post_vote"
        assert stored["payload"] == {"post": 5, "direction": 1}


class TestValidateGatedAction:
    def test_post_vote_valid(self):
        slug, payload = validate_gated_action(
            {"type": "post_vote", "payload": {"post": 1, "direction": 1}}
        )
        assert slug == "post_vote"
        assert payload == {"post": 1, "direction": 1}

    def test_unknown_type(self):
        with pytest.raises(ValidationError):
            validate_gated_action({"type": "nope", "payload": {}})

    def test_bad_direction(self):
        with pytest.raises(ValidationError):
            validate_gated_action(
                {"type": "post_vote", "payload": {"post": 1, "direction": 5}}
            )

    def test_payload_size_cap(self):
        with pytest.raises(ValidationError):
            validate_gated_action(
                {
                    "type": "post_vote",
                    "payload": {"post": 1, "direction": 1, "x": "a" * 70000},
                }
            )


class TestApplyPendingAction:
    def test_applies_vote(self, user1, user2, public_post):
        set_pending_action(
            user2.id, "post_vote", {"post": public_post.pk, "direction": 1}
        )

        apply_pending_action(user2)

        assert Vote.objects.filter(user=user2, post=public_post, direction=1).exists()
        # consumed
        assert pop_pending_action(user2.id) is None

    def test_no_pending_action_is_a_noop(self, user1):
        apply_pending_action(user1)

    def test_failed_on_missing_post(self, user1):
        set_pending_action(user1.id, "post_vote", {"post": 999999, "direction": 1})

        apply_pending_action(user1)

        assert not Vote.objects.filter(user=user1).exists()

    def test_failed_on_invisible_post(self, user1, user2):
        post = factory_post(
            author=user1, default_project=factory_project(default_permission=None)
        )
        set_pending_action(user2.id, "post_vote", {"post": post.pk, "direction": 1})

        apply_pending_action(user2)

        assert not Vote.objects.filter(user=user2).exists()


class TestPostSubscribeAction:
    PAYLOAD_SUBS = [
        {"type": "new_comments", "comments_frequency": 10},
        {"type": "status_change"},
    ]

    def test_validate_ok(self):
        slug, _ = validate_gated_action(
            {
                "type": "post_subscribe",
                "payload": {"post": 1, "subscriptions": self.PAYLOAD_SUBS},
            }
        )
        assert slug == "post_subscribe"

    def test_validate_bad_subscription_type(self):
        with pytest.raises(ValidationError):
            validate_gated_action(
                {
                    "type": "post_subscribe",
                    "payload": {"post": 1, "subscriptions": [{"type": "nope"}]},
                }
            )

    def test_apply_creates_subscriptions(self, user1, user2, public_post):
        set_pending_action(
            user2.id,
            "post_subscribe",
            {"post": public_post.pk, "subscriptions": self.PAYLOAD_SUBS},
        )

        apply_pending_action(user2)

        assert (
            PostSubscription.objects.filter(user=user2, post=public_post).count() == 2
        )


@pytest.fixture
def open_binary_post(user1):
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=dj_timezone.now() - timedelta(days=1),
        scheduled_close_time=dj_timezone.now() + timedelta(days=30),
        scheduled_resolve_time=dj_timezone.now() + timedelta(days=40),
    )
    return factory_post(author=user1, question=question)


class TestForecastAction:
    def test_validate_ok(self, open_binary_post):
        slug, _ = validate_gated_action(
            {
                "type": "forecast",
                "payload": [
                    {
                        "question": open_binary_post.question.pk,
                        "probability_yes": 0.6,
                    }
                ],
            }
        )
        assert slug == "forecast"

    def test_validate_rejects_unknown_question(self):
        with pytest.raises(ValidationError):
            validate_gated_action(
                {
                    "type": "forecast",
                    "payload": [{"question": 999999, "probability_yes": 0.6}],
                }
            )

    def test_validate_caps_items_at_10(self):
        payload = [{"question": i, "probability_yes": 0.6} for i in range(11)]
        with pytest.raises(ValidationError):
            validate_gated_action({"type": "forecast", "payload": payload})

    def test_validate_rejects_empty(self):
        with pytest.raises(ValidationError):
            validate_gated_action({"type": "forecast", "payload": []})

    def test_apply_creates_forecast(self, user2, open_binary_post):
        set_pending_action(
            user2.id,
            "forecast",
            [{"question": open_binary_post.question.pk, "probability_yes": 0.6}],
        )

        apply_pending_action(user2)

        forecast = Forecast.objects.get(
            author=user2, question=open_binary_post.question
        )
        assert forecast.source == Forecast.SourceChoices.UI

    def test_apply_failed_on_closed_question(self, user1, user2, open_binary_post):
        question = open_binary_post.question
        question.scheduled_close_time = dj_timezone.now() - timedelta(days=1)
        question.save()

        set_pending_action(
            user2.id,
            "forecast",
            [{"question": question.pk, "probability_yes": 0.6}],
        )

        apply_pending_action(user2)

        assert not Forecast.objects.filter(author=user2).exists()
