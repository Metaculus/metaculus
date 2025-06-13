from datetime import timedelta
import json  # Add this import at the top
import pytest

from datetime import datetime, timezone as dt_timezone
from django.utils import timezone

from rest_framework.reverse import reverse

from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question

from questions.models import Forecast, Question
from posts.models import Post


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

    @pytest.mark.parametrize(
        "props",
        [
            {"probability_yes_per_category": {"a": 0.1, "b": 0.2, "c": 0.3, "d": 0.4}},
        ],
    )
    def test_forecast_multiple_choice(
        self, post_multiple_choice_public, user1, user1_client, props
    ):
        response = user1_client.post(
            self.url,
            data=json.dumps(
                [{"question": post_multiple_choice_public.question.id, **props}]
            ),
            content_type="application/json",
        )
        assert response.status_code == 201
        forecast = Forecast.objects.filter(
            question=post_multiple_choice_public.question, author=user1
        ).first()
        assert forecast
        assert forecast.probability_yes_per_category == list(
            props.get("probability_yes_per_category").values()
        )

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
        response = user_admin_client.post(
            url,
            data=json.dumps(
                {
                    "resolution": "yes",
                    "actual_resolve_time": datetime.max.strftime("%Y-%m-%dT%H:%M:%S"),
                }
            ),
            content_type="application/json",
        )
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


class TestQuestionForecastExpiration:
    url = reverse("create-forecast")

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

    def test_forecast_expiration(
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
            self.url,
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
            self.url,
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

        community_prediction = response.data["question"]["aggregations"][
            "recency_weighted"
        ]["latest"]
        assert community_prediction["end_time"] is None
