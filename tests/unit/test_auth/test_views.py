from rest_framework.reverse import reverse

from tests.unit.fixtures import *  # noqa
from users.models import User


class TestVerifyEmail:
    url = reverse("auth-signup")

    def test_signup__verify_email(self, anon_client, mocker):
        mock_send_activation_email = mocker.patch(
            "authentication.views.common.send_activation_email"
        )

        response = anon_client.post(
            self.url,
            {
                "email": "user@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "is_bot": False,
            },
        )

        user = User.objects.get(username="new_user")

        assert response.status_code == 201
        assert response.data["is_active"] == user.is_active == False
        assert not response.data["token"]
        assert not user.last_login
        mock_send_activation_email.assert_called_once()

    def test_signup__do_not_verify_email(self, anon_client, mocker):
        mocker.patch("django.conf.settings.AUTH_VERIFY_EMAIL", False)
        mock_send_activation_email = mocker.patch(
            "authentication.views.common.send_activation_email"
        )

        response = anon_client.post(
            self.url,
            {
                "email": "user@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "is_bot": False,
            },
        )

        user = User.objects.get(username="new_user")

        assert response.status_code == 201
        assert response.data["is_active"] == user.is_active == True
        assert user.last_login
        assert response.data["token"]
        mock_send_activation_email.assert_not_called()
