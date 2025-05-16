from datetime import timedelta
import json  # Add this import at the top
from django.utils import timezone

from rest_framework.reverse import reverse

from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question


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
