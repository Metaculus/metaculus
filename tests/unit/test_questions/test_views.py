import json  # Add this import at the top

from rest_framework.reverse import reverse

from tests.unit.test_questions.conftest import *  # noqa


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
