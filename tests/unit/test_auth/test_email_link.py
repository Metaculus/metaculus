import datetime
import re

from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from rest_framework.reverse import reverse

from authentication.services.email_link import (
    EmailLinkTokenGenerator,
    email_link_token_generator,
)
from authentication.services.gated_actions import (
    pop_pending_action,
    set_pending_action,
)
from posts.models import Vote
from tests.unit.test_posts.factories import factory_post
from users.models import User


class TestEmailLinkTokenGenerator:
    # Base token behavior (roundtrip, sign-in invalidation, salt scoping,
    # garbage) is covered by ScopedTokenGenerator's suite in test_tokens.py;
    # the salt separation is exercised end-to-end by the verify-endpoint tests
    # below. Here we only pin the email-link-specific TTL wiring.
    def test_expired_by_email_link_timeout(self, user1, mocker, settings):
        settings.AUTH_EMAIL_LINK_TIMEOUT = 3600
        token = email_link_token_generator.make_token(user1)

        mocker.patch.object(
            EmailLinkTokenGenerator,
            "_now",
            return_value=datetime.datetime.now() + datetime.timedelta(seconds=3700),
        )
        assert not email_link_token_generator.check_token(user1, token)


class TestEmailLinkRequest:
    url = reverse("auth-email-link")

    VOTE_ACTION = {"type": "post_vote", "payload": {"post": 1, "direction": 1}}

    def _post(self, client, **overrides):
        data = {
            "email": "fresh@example.com",
            "gated_action": self.VOTE_ACTION,
            "redirect_url": "/questions/1/",
            **overrides,
        }
        return client.post(self.url, data, format="json")

    def test_creates_unverified_user(self, anon_client, mocker):
        mock_send = mocker.patch(
            "authentication.views.email_link.send_email_link_auth_email"
        )

        response = self._post(anon_client)

        assert response.status_code == 204
        user = User.objects.get(email="fresh@example.com")
        assert not user.is_active
        assert not user.has_usable_password()
        assert not user.is_bot
        assert user.metadata["signup_details"] == {
            "method": "email_link",
            "action_type": "post_vote",
        }
        assert re.fullmatch(r"^\w([\w.@+-]*\w)?$", user.username)
        assert "fresh" not in user.username.lower()
        mock_send.assert_called_once_with(user, "/questions/1/")

        entry = pop_pending_action(user.id)
        assert entry["type"] == "post_vote"

    def test_existing_active_user_reused(self, anon_client, user1, mocker):
        mock_send = mocker.patch(
            "authentication.views.email_link.send_email_link_auth_email"
        )

        response = self._post(anon_client, email=user1.email)

        assert response.status_code == 204
        assert User.objects.filter(email__iexact=user1.email).count() == 1
        user1.refresh_from_db()
        assert user1.metadata is None  # no signup_details for existing users
        mock_send.assert_called_once()

    def test_limbo_user_reused(self, anon_client, mocker):
        mocker.patch("authentication.views.email_link.send_email_link_auth_email")
        limbo = User.objects.create_user(
            username="limbo_user", email="limbo@example.com", is_active=False
        )

        response = self._post(anon_client, email="limbo@example.com")

        assert response.status_code == 204
        assert User.objects.filter(email__iexact="limbo@example.com").count() == 1
        assert pop_pending_action(limbo.id)["type"] == "post_vote"

    def test_blocked_accounts_get_silent_204(self, anon_client, mocker):
        mock_send = mocker.patch(
            "authentication.views.email_link.send_email_link_auth_email"
        )
        deactivated = User.objects.create_user(
            username="deactivated_user",
            email="deactivated@example.com",
            is_active=False,
        )
        deactivated.last_login = timezone.now()
        deactivated.save(update_fields=["last_login"])

        response = self._post(anon_client, email="deactivated@example.com")

        assert response.status_code == 204
        mock_send.assert_not_called()
        assert pop_pending_action(deactivated.id) is None

    def test_action_null_clears_pending_action(self, anon_client, user1, mocker):
        mocker.patch("authentication.views.email_link.send_email_link_auth_email")
        set_pending_action(user1.id, "post_vote", {"post": 1, "direction": 1})

        response = self._post(anon_client, email=user1.email, gated_action=None)

        assert response.status_code == 204
        assert pop_pending_action(user1.id) is None

    def test_invalid_email_400(self, anon_client):
        assert self._post(anon_client, email="not-an-email").status_code == 400

    def test_unknown_action_400_and_no_user_created(self, anon_client):
        response = self._post(anon_client, gated_action={"type": "nope", "payload": {}})
        assert response.status_code == 400
        assert not User.objects.filter(email="fresh@example.com").exists()


class TestSendEmailLinkAuthEmail:
    def test_builds_link_and_sends(self, user1, mocker):
        from authentication.services.email_link import send_email_link_auth_email

        mock_send = mocker.patch(
            "authentication.services.email_link.send_account_email_with_template"
        )

        send_email_link_auth_email(user1, "/questions/1/")

        assert mock_send.call_count == 1
        args, kwargs = mock_send.call_args
        assert args[0] == user1.email
        assert args[2] == "emails/email_link_auth.html"
        link = kwargs["context"]["email_link"]
        assert "/auth/email?" in link
        assert f"user_id={user1.id}" in link
        assert "token=" in link
        assert "redirect_url=" in link


class TestEmailLinkVerify:
    url = reverse("auth-email-link-verify")

    def _request_link(self, client, email, action):
        return client.post(
            reverse("auth-email-link"),
            {"email": email, "gated_action": action},
            format="json",
        )

    def test_new_user_journey_vote_applied(self, anon_client, user1, mocker):
        mocker.patch("authentication.views.email_link.send_email_link_auth_email")
        post = factory_post(author=user1)

        self._request_link(
            anon_client,
            "fresh@example.com",
            {"type": "post_vote", "payload": {"post": post.pk, "direction": 1}},
        )
        user = User.objects.get(email="fresh@example.com")
        token = email_link_token_generator.make_token(user)

        response = anon_client.post(
            self.url, {"user_id": user.id, "token": token}, format="json"
        )

        assert response.status_code == 200
        assert response.data["tokens"]["access"]
        assert response.data["tokens"]["refresh"]
        assert response.data["user"]["id"] == user.id
        assert "action_result" not in response.data
        user.refresh_from_db()
        assert user.is_active
        assert user.last_login
        assert Vote.objects.filter(user=user, post=post, direction=1).exists()

    def test_existing_active_user_signs_in(self, anon_client, user1, mocker):
        mocker.patch("authentication.views.email_link.send_email_link_auth_email")
        self._request_link(anon_client, user1.email, None)
        token = email_link_token_generator.make_token(user1)

        response = anon_client.post(
            self.url, {"user_id": user1.id, "token": token}, format="json"
        )

        assert response.status_code == 200
        user1.refresh_from_db()
        assert user1.last_login

    def test_single_use(self, anon_client, user1):
        token = email_link_token_generator.make_token(user1)

        first = anon_client.post(
            self.url, {"user_id": user1.id, "token": token}, format="json"
        )
        second = anon_client.post(
            self.url, {"user_id": user1.id, "token": token}, format="json"
        )

        assert first.status_code == 200
        assert second.status_code == 400  # last_login change invalidated it

    def test_action_failure_still_signs_in(self, anon_client, user1):
        set_pending_action(user1.id, "post_vote", {"post": 999999, "direction": 1})
        token = email_link_token_generator.make_token(user1)

        response = anon_client.post(
            self.url, {"user_id": user1.id, "token": token}, format="json"
        )

        assert response.status_code == 200
        assert response.data["tokens"]["access"]

    def test_wrong_generator_token_rejected(self, anon_client, user1):
        token = default_token_generator.make_token(user1)

        response = anon_client.post(
            self.url, {"user_id": user1.id, "token": token}, format="json"
        )

        assert response.status_code == 400

    def test_email_link_token_rejected_by_password_reset(self, anon_client, user1):
        token = email_link_token_generator.make_token(user1)

        response = anon_client.get(
            f"/api/auth/password-reset/change/?user_id={user1.id}&token={token}"
        )

        assert response.status_code == 400

    def test_blocked_accounts_generic_error(self, anon_client):
        deactivated = User.objects.create_user(
            username="deactivated_user2",
            email="deactivated2@example.com",
            is_active=False,
        )
        deactivated.last_login = timezone.now()
        deactivated.save(update_fields=["last_login"])
        token = email_link_token_generator.make_token(deactivated)

        response = anon_client.post(
            self.url, {"user_id": deactivated.id, "token": token}, format="json"
        )

        assert response.status_code == 400
