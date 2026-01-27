import pytest
from django.test import override_settings
from rest_framework.reverse import reverse

from authentication.services import SignupInviteService
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
        assert not response.data["tokens"]
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
        assert response.data["tokens"]
        mock_send_activation_email.assert_not_called()

    @override_settings(PUBLIC_ALLOW_SIGNUP=False)
    def test_signup_invitation(self, anon_client):
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
        assert response.data["tokens"]

    @pytest.mark.parametrize(
        "params,expected_language",
        [
            [{"language": "unknown"}, None],
            [{"language": None}, None],
            [{"language": "en"}, "en"],
        ],
    )
    def test_signup__language_variations(
        self, anon_client, mocker, params, expected_language
    ):
        mocker.patch("authentication.views.common.send_activation_email")

        response = anon_client.post(
            self.url,
            data={
                "email": "user@metaculus.com",
                "username": "new_user",
                "password": "StrongPassword@1",
                "is_bot": False,
                **params,
            },
            format="json",
        )
        assert response.status_code == 201
        user = User.objects.get(username="new_user")
        assert user.language == expected_language


class TestLogout:
    url = "/api/auth/logout/"

    def test_logout_with_token_revokes_session(self, anon_client, user1):
        from authentication.services import get_tokens_for_user
        from authentication.jwt_session import (
            SessionAccessToken,
            get_session_enforce_at,
        )

        # Get tokens for the user
        tokens = get_tokens_for_user(user1)
        access_token = tokens["access"]

        # Extract session_id from access token
        token = SessionAccessToken(access_token, verify=False)
        session_id = token.get("session_id")

        # Verify session is not revoked before logout
        assert session_id
        assert get_session_enforce_at(session_id) is None

        # Perform logout with explicit Authorization header
        anon_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = anon_client.post(self.url)
        assert response.status_code == 204

        # Verify session is now revoked (enforce_at = 0)
        assert get_session_enforce_at(session_id) == 0
