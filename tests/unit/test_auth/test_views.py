from django.conf import settings
from rest_framework.reverse import reverse

from authentication.services import SignupInviteService
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
        mocker.patch("django.conf.settings.AUTH_SIGNUP_VERIFY_EMAIL", False)
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

    def test_signup_invitation(self, anon_client):
        settings.PUBLIC_ALLOW_SIGNUP = False
        token = SignupInviteService()._generate_token("invitedUser@metaculus.com")

        # Wrong email + token
        response = anon_client.post(
            self.url,
            {
                "email": "user@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "is_bot": False,
            },
        )
        assert response.status_code == 400
        assert "token" in response.data["non_field_errors"][0]

        # Wrong email
        response = anon_client.post(
            self.url,
            {
                "email": "user@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "invite_token": token,
                "is_bot": False,
            },
        )
        assert response.status_code == 400
        assert "signup invitation" in response.data["non_field_errors"][0]

        # Successful signup
        response = anon_client.post(
            self.url,
            {
                "email": "InvitedUser@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "invite_token": token,
                "is_bot": False,
            },
        )
        assert response.status_code == 201
        assert response.data["is_active"] == True
        assert response.data["token"]
