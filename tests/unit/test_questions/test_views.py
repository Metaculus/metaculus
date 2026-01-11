import json  # Add this import at the top
from datetime import timedelta, datetime
from datetime import timezone as dt_timezone
from unittest.mock import patch

import pytest
from django.utils import timezone
from freezegun import freeze_time
from rest_framework.reverse import reverse

from posts.models import Post
from questions.models import Forecast, Question, UserForecastNotification
from questions.types import OptionsHistoryType
from questions.tasks import check_and_schedule_forecast_widrawal_due_notifications
from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question
from users.models import User


class TestQuestionForecast:
    url = reverse("create-forecast")

    @pytest.mark.parametrize(
        "props",
        [
            {"probability_yes": 0.5},
            {"probability_yes": 0.1},
            {"probability_yes": 0.9},
            {"probability_yes": 0.001},
            {"probability_yes": 0.999},
            {"probability_yes": 0.54321},
        ],
    )
    def test_forecast_binary(self, post_binary_public, user1, user1_client, props):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_binary_public.question.id, **props}]),
            content_type="application/json",
        )
        assert response.status_code == 201
        forecast = Forecast.objects.filter(
            question=post_binary_public.question, author=user1
        ).first()
        assert forecast
        assert forecast.probability_yes == props.get("probability_yes")

    @pytest.mark.parametrize(
        "props",
        [
            {"probability_yes": 0},
            {"probability_yes": 1},
            {"probability_yes": -1},
            {"probability_yes": 2},
            {"probability_yes": 0.0000001},
            {"probability_yes": 0.9999999},
            {"probability_yes_per_category": {"a": 0.1, "b": 0.2, "c": 0.3, "d": 0.4}},
            {"continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0]},
            {
                "probability_yes": 0.5,
                "probability_yes_per_category": {
                    "a": 0.1,
                    "b": 0.2,
                    "c": 0.3,
                    "d": 0.4,
                },
                "continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0],
            },
        ],
    )
    def test_forecast_binary_invalid(self, post_binary_public, user1_client, props):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_binary_public.question.id, **props}]),
            content_type="application/json",
        )
        assert response.status_code == 400

    @freeze_time("2025-01-01")
    @pytest.mark.parametrize(
        "options_history,forecast_props,expected",
        [
            (
                [("0001-01-01T00:00:00", ["a", "other"])],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "other": 0.4,
                    },
                    "end_time": "2026-01-01",
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, 0.4],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                ],
            ),  # simple path
            (
                [("0001-01-01T00:00:00", ["a", "b", "other"])],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "b": 0.15,
                        "other": 0.25,
                    },
                    "end_time": "2026-01-01",
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, 0.25],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                ],
            ),  # simple path 3 options
            (
                [
                    ("0001-01-01T00:00:00", ["a", "b", "other"]),
                    (datetime(2024, 1, 1).isoformat(), ["a", "other"]),
                ],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "other": 0.4,
                    },
                    "end_time": "2026-01-01",
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, None, 0.4],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                ],
            ),  # option deletion
            (
                [
                    ("0001-01-01T00:00:00", ["a", "b", "other"]),
                    (datetime(2024, 1, 1).isoformat(), ["a", "b", "c", "other"]),
                ],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "b": 0.15,
                        "c": 0.20,
                        "other": 0.05,
                    },
                    "end_time": "2026-01-01",
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, 0.20, 0.05],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                ],
            ),  # option addition
            (
                [
                    ("0001-01-01T00:00:00", ["a", "b", "other"]),
                    (datetime(2026, 1, 1).isoformat(), ["a", "b", "c", "other"]),
                ],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "b": 0.15,
                        "c": 0.20,
                        "other": 0.05,
                    },
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, None, 0.25],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, 0.20, 0.05],
                        start_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=None,
                        source=Forecast.SourceChoices.AUTOMATIC,
                    ),
                ],
            ),  # forecasting during a grace period
            (
                [
                    ("0001-01-01T00:00:00", ["a", "b", "other"]),
                    (datetime(2026, 1, 1).isoformat(), ["a", "b", "c", "other"]),
                ],
                {
                    "probability_yes_per_category": {
                        "a": 0.6,
                        "b": 0.15,
                        "c": 0.20,
                        "other": 0.05,
                    },
                    "end_time": "2027-01-01",
                },
                [
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, None, 0.25],
                        start_time=datetime(2025, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                    ),
                    Forecast(
                        probability_yes_per_category=[0.6, 0.15, 0.20, 0.05],
                        start_time=datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                        end_time=datetime(2027, 1, 1, tzinfo=dt_timezone.utc),
                        source=Forecast.SourceChoices.AUTOMATIC,
                    ),
                ],
            ),  # forecasting during a grace period with end time
        ],
    )
    def test_forecast_multiple_choice(
        self,
        post_multiple_choice_public: Post,
        user1: User,
        user1_client,
        options_history: OptionsHistoryType,
        forecast_props: dict,
        expected: list[Forecast],
    ):
        question = post_multiple_choice_public.question
        question.options_history = options_history
        question.options = options_history[-1][1]
        question.save()
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": question.id, **forecast_props}]),
            content_type="application/json",
        )
        assert response.status_code == 201
        forecasts = Forecast.objects.filter(
            question=post_multiple_choice_public.question,
            author=user1,
        ).order_by("start_time")
        assert len(forecasts) == len(expected)
        for f, e in zip(forecasts, expected):
            assert f.start_time == e.start_time
            assert f.end_time == e.end_time
            assert f.probability_yes_per_category == e.probability_yes_per_category
            assert f.source == e.source

    @pytest.mark.parametrize(
        "props",
        [
            {"probability_yes_per_category": {"a": 0, "b": 0.2, "c": 0.3, "d": 0.5}},
            {"probability_yes_per_category": {"a": 0.2, "b": 0.2, "c": 0.3, "d": 0.4}},
            {"probability_yes_per_category": {"a": 0.1, "b": 0.2, "c": 0.7}},
            {"probability_yes_per_category": {}},
            {"probability_yes_per_category": [0.1, 0.2, 0.3, 0.4]},
            {"probability_yes_per_category": {"a": -0.1, "b": 0.4, "c": 0.3, "d": 0.4}},
            {"probability_yes": 0.5},
            {"continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0]},
            {
                "probability_yes": 0.5,
                "probability_yes_per_category": {
                    "a": 0.1,
                    "b": 0.2,
                    "c": 0.3,
                    "d": 0.4,
                },
                "continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0],
            },
        ],
    )
    def test_forecast_multiple_choice_invalid(
        self, post_multiple_choice_public, user1_client, props
    ):
        response = user1_client.post(
            self.url,
            data=json.dumps(
                [{"question": post_multiple_choice_public.question.id, **props}]
            ),
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.parametrize(
        "props",
        [
            {"continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0]},
        ],
    )
    def test_forecast_numeric(self, post_numeric_public, user1, user1_client, props):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_numeric_public.question.id, **props}]),
            content_type="application/json",
        )
        assert response.status_code == 201
        forecast = Forecast.objects.filter(
            question=post_numeric_public.question, author=user1
        ).first()
        assert forecast
        assert forecast.continuous_cdf == props.get("continuous_cdf")

    @pytest.mark.parametrize(
        "props",
        [
            {"continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0]},
        ],
    )
    def test_forecast_discrete(self, post_discrete_public, user1, user1_client, props):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_discrete_public.question.id, **props}]),
            content_type="application/json",
        )
        assert response.status_code == 201
        forecast = Forecast.objects.filter(
            question=post_discrete_public.question, author=user1
        ).first()
        assert forecast
        assert forecast.continuous_cdf == props.get("continuous_cdf")

    @pytest.mark.parametrize(
        "props",
        [
            {"continuous_cdf": [0.1, 0.2, 0.5, 0.8, 1.0]},
            {"continuous_cdf": [0, 0.2, 0.5, 0.8, 0.9]},
            {"continuous_cdf": [0, 0.5, 0.5, 0.5, 1.0]},
            {"continuous_cdf": [0, 0.5, 1.0]},
            {"continuous_cdf": [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]},
            {"probability_yes": 0.5},
            {"probability_yes_per_category": {"a": 0.1, "b": 0.2, "c": 0.3, "d": 0.4}},
            {
                "probability_yes": 0.5,
                "probability_yes_per_category": {
                    "a": 0.1,
                    "b": 0.2,
                    "c": 0.3,
                    "d": 0.4,
                },
                "continuous_cdf": [0, 0.2, 0.5, 0.8, 1.0],
            },
        ],
    )
    def test_forecast_numeric_invalid(self, post_numeric_public, user1_client, props):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_numeric_public.question.id, **props}]),
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.parametrize(
        "status_code, q_props, f_props",
        [
            (
                201,
                {},
                {"continuous_cdf": [0.0, 0.2, 0.5, 0.8, 1.0]},
            ),
            (
                400,
                {"open_lower_bound": True},
                {"continuous_cdf": [0.0, 0.2, 0.5, 0.8, 1.0]},
            ),
            (
                201,
                {"open_lower_bound": True},
                {"continuous_cdf": [0.1, 0.2, 0.5, 0.8, 1.0]},
            ),
            (
                400,
                {},
                {"continuous_cdf": [0.1, 0.2, 0.5, 0.8, 1.0]},
            ),
            (
                201,
                {"open_upper_bound": True},
                {"continuous_cdf": [0.0, 0.2, 0.5, 0.8, 0.9]},
            ),
            (
                400,
                {},
                {"continuous_cdf": [0.0, 0.2, 0.5, 0.8, 0.9]},
            ),
            (
                201,
                {"inbound_outcome_count": 3},
                {"continuous_cdf": [0.0, 0.2, 0.5, 1.0]},
            ),
            (
                400,
                {"inbound_outcome_count": 3},
                {"continuous_cdf": [0.0, 0.2, 0.5, 0.8, 1.0]},
            ),
        ],
    )
    def test_forecast_numeric_boundary_test(
        self, post_numeric_public, user1_client, status_code, q_props, f_props
    ):
        for key, value in q_props.items():
            setattr(post_numeric_public.question, key, value)
        post_numeric_public.question.save()
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": post_numeric_public.question.id, **f_props}]),
            content_type="application/json",
        )
        assert response.status_code == status_code


class TestQuestionWithdraw:
    url = reverse("create-withdraw")

    def test_withdraw_forecast(
        self, question_binary_with_forecast_user_1, user1_client
    ):
        response = user1_client.post(
            self.url,
            data=json.dumps([{"question": question_binary_with_forecast_user_1.id}]),
            content_type="application/json",
        )
        assert response.status_code == 201

    def test_cant_withdraw_forecast_if_no_forecast(
        self, question_binary_with_forecast_user_1, user2_client
    ):
        response = user2_client.post(
            self.url,
            data=json.dumps([{"question": question_binary_with_forecast_user_1.id}]),
            content_type="application/json",
        )
        assert response.status_code == 400


class TestQuestionResolve:

    def test_resolve_binary(self, post_binary_public, user_admin_client):
        url = reverse("question-resolve", args=[post_binary_public.question.id])
        payload = {
            "resolution": "yes",
            "actual_resolve_time": datetime.max.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        response = user_admin_client.post(url, data=payload, format="json")
        assert response.status_code == 200
        question = Question.objects.get(id=post_binary_public.question.id)
        assert question.resolution == "yes"
        assert question.actual_close_time
        assert question.actual_resolve_time
        assert question.resolution_set_time
        post = question.get_post()
        assert post.resolved
        assert post.status == Post.PostStatusChange.RESOLVED
        assert post.actual_close_time

        # Ensure we can't trigger resolution again
        response = user_admin_client.post(url, data=payload, format="json")
        assert response.status_code == 400

    def test_resolve_multiple_choice(
        self, post_multiple_choice_public, user_admin_client
    ):
        url = reverse(
            "question-resolve", args=[post_multiple_choice_public.question.id]
        )
        response = user_admin_client.post(
            url,
            data=json.dumps(
                {
                    "resolution": "a",
                    "actual_resolve_time": datetime.max.strftime("%Y-%m-%dT%H:%M:%S"),
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 200
        question = Question.objects.get(id=post_multiple_choice_public.question.id)
        assert question.resolution == "a"
        assert question.actual_close_time
        assert question.actual_resolve_time
        assert question.resolution_set_time
        post = question.get_post()
        assert post.resolved
        assert post.status == Post.PostStatusChange.RESOLVED
        assert post.actual_close_time

    @pytest.mark.parametrize(
        "status_code, q_props, resolution",
        [
            (
                200,
                {
                    "type": Question.QuestionType.NUMERIC,
                    "range_min": 10,
                    "range_max": 13,
                },
                "10",
            ),
            (
                200,
                {
                    "type": Question.QuestionType.DISCRETE,
                    "range_min": 9.5,
                    "range_max": 13.5,
                },
                "11",
            ),
            (
                200,
                {
                    "type": Question.QuestionType.DATE,
                    "range_min": datetime(2020, 1, 1).timestamp(),
                    "range_max": datetime(2025, 1, 1).timestamp(),
                },
                datetime(2021, 1, 1, tzinfo=dt_timezone.utc).strftime(
                    "%Y-%m-%dT%H:%M:%S"
                ),
            ),
            (  # fail at resolving below closed lower bound
                400,
                {
                    "type": Question.QuestionType.NUMERIC,
                    "range_min": 10,
                    "range_max": 13,
                    "open_lower_bound": False,
                    "open_upper_bound": False,
                },
                "9",
            ),
            (  # succeed at resolving below open lower bound
                200,
                {
                    "type": Question.QuestionType.NUMERIC,
                    "range_min": 10,
                    "range_max": 13,
                    "open_lower_bound": True,
                    "open_upper_bound": True,
                },
                "9",
            ),
            (  # fail at resolving above closed upper bound
                400,
                {
                    "type": Question.QuestionType.NUMERIC,
                    "range_min": 10,
                    "range_max": 13,
                    "open_lower_bound": False,
                    "open_upper_bound": False,
                },
                "14",
            ),
            (  # succeed at resolving above open upper bound
                200,
                {
                    "type": Question.QuestionType.NUMERIC,
                    "range_min": 10,
                    "range_max": 13,
                    "open_lower_bound": True,
                    "open_upper_bound": True,
                },
                "14",
            ),
        ],
    )
    def test_resolve_continuous(
        self, post_numeric_public, user_admin_client, status_code, q_props, resolution
    ):
        for key, value in q_props.items():
            setattr(post_numeric_public.question, key, value)
        post_numeric_public.question.save()
        url = reverse("question-resolve", args=[post_numeric_public.question.id])
        response = user_admin_client.post(
            url,
            data=json.dumps(
                {
                    "resolution": resolution,
                    "actual_resolve_time": datetime.max.strftime("%Y-%m-%dT%H:%M:%S"),
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == status_code


class TestQuestionForecastAutoWithdrawal:
    create_forecast_url = reverse("create-forecast")
    withdraw_forecast_url = reverse("create-withdraw")

    @staticmethod
    def build_forecast_data(question_id, forecast_end_time):
        return [
            {
                "question": question_id,
                "continuous_cdf": None,
                "probability_yes": 0.8,
                "probability_yes_per_category": None,
                "distribution_input": None,
                "source": "ui",
                "end_time": (
                    forecast_end_time.isoformat() if forecast_end_time else None
                ),
            }
        ]

    def test_simple_forecast_auto_withdrawal(
        self, transactional_db, user1, user2, user1_client, user2_client, await_queue
    ):
        question_binary = create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=timezone.now() - timedelta(days=1),
            scheduled_close_time=timezone.now() + timedelta(days=1),
        )

        question_binary.open_time = timezone.now() - timedelta(days=1)
        post = factory_post(question=question_binary)

        question_binary.user_forecasts.create(
            author=user1,
            probability_yes=0.6,
            start_time=timezone.now() - timedelta(days=1),
        )

        user1_forecast_end_time = timezone.now() + timedelta(days=1)
        response = user1_client.post(
            self.create_forecast_url,
            data=json.dumps(
                self.build_forecast_data(question_binary.id, user1_forecast_end_time)
            ),
            content_type="application/json",
        )
        assert response.status_code == 201

        await_queue()

        # Verify through the question details endpoint
        detail_url = reverse("post-detail", kwargs={"pk": post.id})
        response = user1_client.get(detail_url + "?with_cp=true")
        assert response.status_code == 200

        user_prediction = response.data["question"]["my_forecasts"]["latest"]
        assert user_prediction["end_time"] == user1_forecast_end_time.timestamp()

        community_prediction = response.data["question"]["aggregations"][
            "recency_weighted"
        ]["latest"]
        assert community_prediction["end_time"] == user1_forecast_end_time.timestamp()

        # User two creates a forecast
        response = user2_client.post(
            self.create_forecast_url,
            data=json.dumps(self.build_forecast_data(question_binary.id, None)),
            content_type="application/json",
        )
        assert response.status_code == 201
        await_queue()

        # Verify through the question details endpoint
        detail_url = reverse("post-detail", kwargs={"pk": post.id})
        response = user2_client.get(detail_url + "?with_cp=true")
        assert response.status_code == 200

        user_prediction = response.data["question"]["my_forecasts"]["latest"]
        assert user_prediction["end_time"] is None

    def test_forecast_auto_withdrawal_notification(
        self, transactional_db, user1, user2, user1_client, user2_client
    ):
        question1 = create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=timezone.now() - timedelta(days=1),
            scheduled_close_time=timezone.now() + timedelta(days=200),
        )

        question2 = create_question(
            question_type=Question.QuestionType.BINARY,
            open_time=timezone.now() - timedelta(days=1),
            scheduled_close_time=timezone.now() + timedelta(days=29),
        )
        factory_post(question=question1)
        factory_post(question=question2)
        base_time = timezone.now()

        with freeze_time(base_time):
            # Create forecasts with different lifetimes for user1
            # Long forecast (30 days) - should trigger 1 week before end
            user1_forecast1_end_time = base_time + timedelta(days=30)
            response = user1_client.post(
                self.create_forecast_url,
                data=json.dumps(
                    self.build_forecast_data(question1.id, user1_forecast1_end_time)
                ),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Short forecast (5 days) - should trigger 1 day before end
            user1_forecast2_end_time = base_time + timedelta(days=5)
            response = user1_client.post(
                self.create_forecast_url,
                data=json.dumps(
                    self.build_forecast_data(question2.id, user1_forecast2_end_time)
                ),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Create forecasts for user2
            # Long forecast (25 days) - should trigger 1 week before end
            user2_forecast1_end_time = base_time + timedelta(days=25)
            response = user2_client.post(
                self.create_forecast_url,
                data=json.dumps(
                    self.build_forecast_data(question1.id, user2_forecast1_end_time)
                ),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Short forecast (3 days) - should trigger 1 day before end
            user2_forecast2_end_time = base_time + timedelta(days=3)
            response = user2_client.post(
                self.create_forecast_url,
                data=json.dumps(
                    self.build_forecast_data(question2.id, user2_forecast2_end_time)
                ),
                content_type="application/json",
            )
            assert response.status_code == 201

        # Verify notifications were created with correct trigger times
        notifications = UserForecastNotification.objects.all()
        assert notifications.count() == 4

        # Check trigger times
        user1_q1_notification = UserForecastNotification.objects.get(
            user=user1, question=question1
        )
        user1_q2_notification = UserForecastNotification.objects.get(
            user=user1, question=question2
        )
        user2_q1_notification = UserForecastNotification.objects.get(
            user=user2, question=question1
        )
        user2_q2_notification = UserForecastNotification.objects.get(
            user=user2, question=question2
        )

        # Long forecasts should trigger 1 week before end
        assert user1_q1_notification.trigger_time == base_time + timedelta(
            days=23
        )  # 30 - 7
        assert user2_q1_notification.trigger_time == base_time + timedelta(
            days=18
        )  # 25 - 7

        # Short forecasts should trigger 1 day before end
        assert user1_q2_notification.trigger_time == base_time + timedelta(
            days=4
        )  # 5 - 1
        assert user2_q2_notification.trigger_time == base_time + timedelta(
            days=2
        )  # 3 - 1

        with patch(
            "questions.tasks.send_forecast_autowidrawal_notification"
        ) as mock_send:
            # Test 0: Freeze time after forecasts end, or questions are closed, no notifications should be sent
            # questions closed
            with freeze_time(base_time + timedelta(days=300)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()
                # No notifications should be sent yet
                mock_send.assert_not_called()

            # user's second forecasts withdrawn, but not their first forecasts.
            with freeze_time(base_time + timedelta(days=10)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()
                # No notifications should be sent yet
                mock_send.assert_not_called()

            # Test 1: Freeze time before any notifications should be sent
            with freeze_time(base_time + timedelta(days=1)):
                check_and_schedule_forecast_widrawal_due_notifications()

                # No notifications should be sent yet
                mock_send.reset_mock()
                mock_send.assert_not_called()

            # Test 2: Freeze time when user2's short forecast notification should be sent
            with freeze_time(base_time + timedelta(days=1, hours=1)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()

                # Should be called once for user2
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]["user"].email == user2.email
                assert len(call_args[1]["posts_data"]) == 1
                assert call_args[1]["posts_data"][0]["title"] == question2.title

                # call one more time, no notifications should be sent again
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()
                mock_send.assert_not_called()

            # Test 3: Freeze time when user1's short forecast notification should be sent
            with freeze_time(base_time + timedelta(days=3, hours=1)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()

                # Should be called once for user1 (user2's notification already sent)
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]["user"].email == user1.email
                assert len(call_args[1]["posts_data"]) == 1
                assert call_args[1]["posts_data"][0]["title"] == question2.title

            # Test 4: Freeze time when user2's long forecast notification should be sent
            with freeze_time(base_time + timedelta(days=17, hours=1)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()

                # Should be called once for user2
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]["user"].email == user2.email
                assert len(call_args[1]["posts_data"]) == 1
                assert call_args[1]["posts_data"][0]["title"] == question1.title

            # Test 5: Freeze time when user1's long forecast notification should be sent
            with freeze_time(base_time + timedelta(days=22, hours=1)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()

                # Should be called once for user1
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]["user"].email == user1.email
                assert len(call_args[1]["posts_data"]) == 1
                assert call_args[1]["posts_data"][0]["title"] == question1.title

            # Test 6: Verify no duplicate notifications are sent
            with freeze_time(base_time + timedelta(days=30)):
                mock_send.reset_mock()
                check_and_schedule_forecast_widrawal_due_notifications()

                # No more notifications should be sent (all already sent)
                mock_send.assert_not_called()

        # Verify all notifications have been marked as sent
        notifications = UserForecastNotification.objects.filter(email_sent=True)
        assert notifications.count() == 4

        # Test deletion of notifications when forecast is withdrawn
        with freeze_time(base_time + timedelta(days=1)):
            # Withdraw user1's forecast for question1 by creating a new forecast without end_time
            response = user1_client.post(
                self.withdraw_forecast_url,
                data=json.dumps([{"question": question1.id}]),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Notification should be deleted
            assert not UserForecastNotification.objects.filter(
                user=user1, question=question1
            ).exists()

            # Other notifications should still exist
            assert UserForecastNotification.objects.filter(
                user=user1, question=question2
            ).exists()
            assert UserForecastNotification.objects.filter(
                user=user2, question=question1
            ).exists()
            assert UserForecastNotification.objects.filter(
                user=user2, question=question2
            ).exists()

            # Withdraw user2's forecast for question2
            response = user2_client.post(
                self.withdraw_forecast_url,
                data=json.dumps([{"question": question2.id}]),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Notification for user2's question2 should be deleted
            assert not UserForecastNotification.objects.filter(
                user=user2, question=question2
            ).exists()

            # Withdraw user1's forecast for question2
            response = user1_client.post(
                self.withdraw_forecast_url,
                data=json.dumps([{"question": question2.id}]),
                content_type="application/json",
            )
            assert response.status_code == 201

            # Notification for user1's question2 should be deleted
            assert not UserForecastNotification.objects.filter(
                user=user1, question=question2
            ).exists()

            # Only user2's notification for question1 should remain
            assert UserForecastNotification.objects.filter(
                user=user2, question=question1
            ).exists()
            assert not UserForecastNotification.objects.filter(
                user=user1, question=question1
            ).exists()
            assert not UserForecastNotification.objects.filter(
                user=user1, question=question2
            ).exists()
            assert not UserForecastNotification.objects.filter(
                user=user2, question=question2
            ).exists()
