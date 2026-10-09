from datetime import datetime, timedelta, timezone as dt_timezone
from urllib.parse import parse_qs, urlparse

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils import timezone
from freezegun import freeze_time
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient
from social_django.models import UserSocialAuth

from authentication.jwt_session import revoke_all_user_tokens
from authentication.models import ApiKey
from authentication.services.common import get_tokens_for_user
from tests.unit.test_users.factories import factory_user
from users.models import User
from users.services.email_change import (
    EmailChangeWrongAccountError,
    check_email_change_token,
    confirm_email_change,
    load_rollback_target,
    make_email_change_token,
    make_rollback_token,
    request_email_change,
    rollback_email_change,
)

PASSWORD = "Old-Password-123"


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def user() -> User:
    user = factory_user(email="old@example.com", username="mover", is_active=True)
    user.set_password(PASSWORD)
    user.save()
    return user


def jwt_client(user: User) -> APIClient:
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {get_tokens_for_user(user)['access']}"
    )
    return client


def link_token(link: str) -> str:
    return parse_qs(urlparse(link).query)["token"][0]


def changed_user(user: User, new_email: str = "new@example.com") -> str:
    """Puts the user in the post-change state and returns its rollback token."""
    old_email = user.email
    user.email = new_email
    user.email_changed_at = timezone.now()
    user.save()
    return make_rollback_token(user, old_email)


class TestConfirmToken:
    def test_round_trip(self, user):
        token = make_email_change_token(user, "new@example.com")

        assert check_email_change_token(user, token) == "new@example.com"

    def test_survives_new_login(self, user):
        token = make_email_change_token(user, "new@example.com")
        get_tokens_for_user(user)
        user.refresh_from_db()

        assert check_email_change_token(user, token) == "new@example.com"

    def test_dies_on_password_change(self, user):
        token = make_email_change_token(user, "new@example.com")
        user.set_password("Another-Password-456")
        user.save()

        with pytest.raises(ValidationError):
            check_email_change_token(user, token)

    def test_dies_when_email_changes(self, user):
        token = make_email_change_token(user, "new@example.com")
        user.email = "other@example.com"
        user.save()

        with pytest.raises(ValidationError):
            check_email_change_token(user, token)

    def test_dies_when_email_changed_at_changes(self, user):
        token = make_email_change_token(user, "new@example.com")
        user.email_changed_at = timezone.now()
        user.save()

        with pytest.raises(ValidationError):
            check_email_change_token(user, token)

    def test_expires_after_one_day(self, user):
        with freeze_time("2026-10-09 12:00:00"):
            token = make_email_change_token(user, "new@example.com")

        with freeze_time("2026-10-10 12:00:01"):
            with pytest.raises(ValidationError):
                check_email_change_token(user, token)

    def test_other_user(self, user):
        token = make_email_change_token(user, "new@example.com")
        other = factory_user(is_active=True)

        with pytest.raises(EmailChangeWrongAccountError):
            check_email_change_token(other, token)

    def test_tampered(self, user):
        token = make_email_change_token(user, "new@example.com")

        with pytest.raises(ValidationError):
            check_email_change_token(user, token[:-2] + "xx")

    def test_address_with_colon(self, user):
        new_email = '"a:b"@example.com'
        token = make_email_change_token(user, new_email)

        assert check_email_change_token(user, token) == new_email


class TestRollbackToken:
    def test_round_trip(self, user):
        token = changed_user(user)

        target = load_rollback_target(token)

        assert target.user == user
        assert target.old_email == "old@example.com"
        assert target.new_email == "new@example.com"

    def test_changed_at_keeps_microseconds(self, user):
        user.email = "new@example.com"
        user.email_changed_at = datetime(
            2026, 10, 9, 12, 0, 0, 123456, tzinfo=dt_timezone.utc
        )
        user.save()
        token = make_rollback_token(user, "old@example.com")

        assert load_rollback_target(token).old_email == "old@example.com"

    def test_survives_login_and_password_change(self, user):
        token = changed_user(user)
        get_tokens_for_user(user)
        user.set_password("Attacker-Password-789")
        user.save()

        assert load_rollback_target(token).old_email == "old@example.com"

    def test_invalid_once_email_changed_at_is_cleared(self, user):
        token = changed_user(user)
        user.email_changed_at = None
        user.save()

        with pytest.raises(ValidationError):
            load_rollback_target(token)

    def test_invalid_after_admin_edit(self, user):
        token = changed_user(user)
        user.email = "admin-set@example.com"
        user.save()

        with pytest.raises(ValidationError):
            load_rollback_target(token)

    def test_expires_after_seven_days(self, user):
        with freeze_time("2026-10-01 12:00:00"):
            token = changed_user(user)

        with freeze_time("2026-10-08 12:00:01"):
            with pytest.raises(ValidationError):
                load_rollback_target(token)

    def test_inactive_user(self, user):
        token = changed_user(user)
        user.is_active = False
        user.save()

        with pytest.raises(ValidationError, match="Contact"):
            load_rollback_target(token)


@pytest.fixture
def mock_send(mocker):
    return mocker.patch("users.services.email_change.send_account_email_with_template")


class TestRequestEmailChange:
    url = "/api/users/me/email/"

    def post(self, client, email, password=PASSWORD):
        return client.post(
            self.url, {"email": email, "password": password}, format="json"
        )

    def test_mails_confirm_link_to_new_address(self, user, mock_send):
        response = self.post(jwt_client(user), "new@example.com")

        assert response.status_code == 204
        args, kwargs = mock_send.call_args
        assert args[0] == "new@example.com"
        assert args[2] == "emails/email_change_confirm.html"
        user.refresh_from_db()
        assert user.email == "old@example.com"
        token = link_token(kwargs["context"]["confirm_link"])
        assert check_email_change_token(user, token) == "new@example.com"

    def test_wrong_password(self, user, mock_send):
        response = self.post(jwt_client(user), "new@example.com", password="nope")

        assert response.status_code == 400
        assert "password" in response.data
        mock_send.assert_not_called()

    def test_same_address_any_case(self, user, mock_send):
        response = self.post(jwt_client(user), "OLD@example.com")

        assert response.status_code == 400
        mock_send.assert_not_called()

    def test_address_held_by_active_account(self, user, mock_send):
        factory_user(email="taken@example.com", is_active=True)

        response = self.post(jwt_client(user), "Taken@example.com")

        assert response.status_code == 400
        assert "already in use" in str(response.data)
        mock_send.assert_not_called()

    def test_never_activated_holder_does_not_block(self, user, mock_send):
        factory_user(email="new@example.com", is_active=False, last_login=None)

        response = self.post(jwt_client(user), "new@example.com")

        assert response.status_code == 204

    def test_locked_after_recent_change(self, user, mock_send):
        user.email_changed_at = timezone.now() - timedelta(days=6)
        user.save()

        response = self.post(jwt_client(user), "new@example.com")

        assert response.status_code == 400
        assert "You can change your email again after" in str(response.data)
        mock_send.assert_not_called()

    def test_lock_expires(self, user, mock_send):
        user.email_changed_at = timezone.now() - timedelta(days=8)
        user.save()

        response = self.post(jwt_client(user), "new@example.com")

        assert response.status_code == 204

    def test_api_key_refused(self, user, create_client_for_user, mock_send):
        response = self.post(create_client_for_user(user), "new@example.com")

        assert response.status_code == 401
        mock_send.assert_not_called()

    def test_django_session_refused(self, user, mock_send):
        client = APIClient()
        client.force_login(user)

        response = self.post(client, "new@example.com")

        assert response.status_code == 401
        mock_send.assert_not_called()

    def test_too_long_address(self, user, mock_send):
        response = self.post(jwt_client(user), f"{'a' * 250}@example.com")

        assert response.status_code == 400
        mock_send.assert_not_called()


class TestConfirmEmailChange:
    url = "/api/users/me/email/confirm/"

    def test_get_checks_without_applying(self, user):
        token = make_email_change_token(user, "new@example.com")

        response = jwt_client(user).get(self.url, {"token": token})

        assert response.status_code == 200
        assert response.data == {"new_email": "new@example.com"}
        user.refresh_from_db()
        assert user.email == "old@example.com"
        assert user.email_changed_at is None

    def test_get_with_another_users_token(self, user):
        token = make_email_change_token(user, "new@example.com")
        other = factory_user(is_active=True)

        response = jwt_client(other).get(self.url, {"token": token})

        assert response.status_code == 400
        assert response.data["error_code"] == "WRONG_ACCOUNT"

    def test_get_with_garbage_token(self, user):
        response = jwt_client(user).get(self.url, {"token": "garbage"})

        assert response.status_code == 400

    def test_get_without_token(self, user):
        response = jwt_client(user).get(self.url)

        assert response.status_code == 400

    def test_post_applies_change(
        self, user, mock_send, django_capture_on_commit_callbacks
    ):
        with freeze_time("2026-10-09 12:00:00"):
            client = jwt_client(user)
            token = make_email_change_token(user, "new@example.com")

        with freeze_time("2026-10-09 12:00:10"):
            with django_capture_on_commit_callbacks(execute=True):
                response = client.post(self.url, {"token": token}, format="json")

            assert response.status_code == 200
            assert set(response.data) == {"access", "refresh"}
            assert client.get("/api/users/me/").status_code == 403

            user.refresh_from_db()
            assert user.email == "new@example.com"
            assert user.email_changed_at is not None

            args, kwargs = mock_send.call_args
            assert args[0] == "old@example.com"
            assert args[2] == "emails/email_change_notice.html"
            target = load_rollback_target(
                link_token(kwargs["context"]["rollback_link"])
            )
            assert target.old_email == "old@example.com"
            assert target.new_email == "new@example.com"

    def test_never_activated_holder_is_cleared(self, user):
        holder = factory_user(email="NEW@example.com", is_active=False, last_login=None)
        token = make_email_change_token(user, "new@example.com")

        response = jwt_client(user).post(self.url, {"token": token}, format="json")

        assert response.status_code == 200
        holder.refresh_from_db()
        assert holder.email == ""

    def test_active_holder_blocks(self, user):
        token = make_email_change_token(user, "new@example.com")
        factory_user(email="new@example.com", is_active=True)

        response = jwt_client(user).post(self.url, {"token": token}, format="json")

        assert response.status_code == 400
        assert "already in use" in str(response.data)

    def test_applying_one_token_kills_the_others(self, user):
        token_1 = make_email_change_token(user, "one@example.com")
        token_2 = make_email_change_token(user, "two@example.com")

        first = jwt_client(user).post(self.url, {"token": token_1}, format="json")
        second = jwt_client(user).post(self.url, {"token": token_2}, format="json")

        assert first.status_code == 200
        assert second.status_code == 400

    def test_same_link_twice(self, user):
        token = make_email_change_token(user, "new@example.com")

        first = jwt_client(user).post(self.url, {"token": token}, format="json")
        second = jwt_client(user).post(self.url, {"token": token}, format="json")

        assert first.status_code == 200
        assert second.status_code == 400

    def test_stale_user_object_cannot_apply_a_second_token(self, user):
        token_1 = make_email_change_token(user, "one@example.com")
        token_2 = make_email_change_token(user, "two@example.com")
        confirm_email_change(user, token_1)

        with pytest.raises(ValidationError):
            confirm_email_change(user, token_2)

    def test_api_key_refused(self, user, create_client_for_user):
        token = make_email_change_token(user, "new@example.com")
        client = create_client_for_user(user)

        assert client.get(self.url, {"token": token}).status_code == 401
        assert client.post(self.url, {"token": token}, format="json").status_code == 401

    def test_django_session_refused(self, user):
        token = make_email_change_token(user, "new@example.com")
        client = APIClient()
        client.force_login(user)

        assert client.get(self.url, {"token": token}).status_code == 401
        assert client.post(self.url, {"token": token}, format="json").status_code == 401
        user.refresh_from_db()
        assert user.email == "old@example.com"


NEW_PASSWORD = "Fresh-Password-456"


class TestEmailChangeRollback:
    url = "/api/auth/email-change/rollback/"

    def post(self, client, token, password=NEW_PASSWORD):
        return client.post(
            self.url, {"token": token, "password": password}, format="json"
        )

    def test_get_checks_without_consuming(self, user, anon_client):
        token = changed_user(user)

        response = anon_client.get(self.url, {"token": token})

        assert response.status_code == 200
        assert response.data == {
            "old_email": "old@example.com",
            "new_email": "new@example.com",
        }
        user.refresh_from_db()
        assert user.email == "new@example.com"

    def test_get_with_garbage_token(self, anon_client):
        assert anon_client.get(self.url, {"token": "garbage"}).status_code == 400

    def test_get_without_token(self, anon_client):
        assert anon_client.get(self.url).status_code == 400

    def test_post_restores_and_secures(
        self, user, anon_client, mock_send, django_capture_on_commit_callbacks
    ):
        with freeze_time("2026-10-09 12:00:00"):
            old_client = jwt_client(user)
            ApiKey.objects.create(user=user)
            token = changed_user(user)

        with freeze_time("2026-10-09 12:00:10"):
            with django_capture_on_commit_callbacks(execute=True):
                response = self.post(anon_client, token)

            assert response.status_code == 200
            assert set(response.data["tokens"]) == {"access", "refresh"}
            assert old_client.get("/api/users/me/").status_code == 403

        user.refresh_from_db()
        assert user.email == "old@example.com"
        assert user.email_changed_at is None
        assert user.check_password(NEW_PASSWORD)
        assert not user.check_password(PASSWORD)
        assert not ApiKey.objects.filter(user=user).exists()
        args, _ = mock_send.call_args
        assert args[0] == "new@example.com"
        assert args[2] == "emails/email_change_rolled_back.html"

    def test_single_use(self, user, anon_client):
        token = changed_user(user)

        assert self.post(anon_client, token).status_code == 200
        assert self.post(anon_client, token, "Another-Password-789").status_code == 400

    def test_survives_attacker_login_and_password_change(self, user, anon_client):
        token = changed_user(user)
        get_tokens_for_user(user)
        user.set_password("Attacker-Password-789")
        user.save()

        assert self.post(anon_client, token).status_code == 200

    def test_same_password_rejected_and_link_kept(self, user, anon_client):
        token = changed_user(user)

        response = self.post(anon_client, token, PASSWORD)

        assert response.status_code == 400
        assert "password" in response.data
        user.refresh_from_db()
        assert user.email == "new@example.com"
        assert anon_client.get(self.url, {"token": token}).status_code == 200

    def test_weak_password_rejected(self, user, anon_client):
        token = changed_user(user)

        response = self.post(anon_client, token, "123")

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email == "new@example.com"

    def test_never_activated_holder_is_cleared(self, user, anon_client):
        token = changed_user(user)
        holder = factory_user(email="old@example.com", is_active=False, last_login=None)

        assert self.post(anon_client, token).status_code == 200
        holder.refresh_from_db()
        assert holder.email == ""

    def test_active_holder_blocks(self, user, anon_client):
        token = changed_user(user)
        factory_user(email="OLD@example.com", is_active=True)

        response = self.post(anon_client, token)

        assert response.status_code == 400
        assert "already in use" in str(response.data)
        assert anon_client.get(self.url, {"token": token}).status_code == 400

    def test_works_with_a_revoked_bearer_header(self, user):
        with freeze_time("2026-10-09 12:00:00"):
            client = jwt_client(user)
            token = changed_user(user)

        with freeze_time("2026-10-09 12:00:10"):
            revoke_all_user_tokens(user)
            response = self.post(client, token)

        assert response.status_code == 200

    def test_removes_in_window_social_links_keeps_older_links_and_bots(
        self, user, anon_client
    ):
        with freeze_time("2026-10-09 12:00:00") as frozen:
            UserSocialAuth.objects.create(
                user=user, provider="google-oauth2", uid="old@example.com"
            )
            frozen.tick(timedelta(seconds=10))
            token = changed_user(user)
            frozen.tick(timedelta(seconds=10))
            UserSocialAuth.objects.create(
                user=user, provider="google-oauth2", uid="attacker@gmail.com"
            )
            bot = factory_user(is_bot=True, bot_owner=user, email="")
            ApiKey.objects.create(user=bot)
            frozen.tick(timedelta(seconds=10))

            response = self.post(anon_client, token)

        assert response.status_code == 200
        assert set(
            UserSocialAuth.objects.filter(user=user).values_list("uid", flat=True)
        ) == {"old@example.com"}
        assert ApiKey.objects.filter(user=bot).exists()

    def test_confirm_links_from_before_the_change_die(self, user, anon_client):
        stale_confirm = make_email_change_token(user, "other@example.com")
        token = changed_user(user)

        assert self.post(anon_client, token).status_code == 200
        user.refresh_from_db()
        with pytest.raises(ValidationError):
            check_email_change_token(user, stale_confirm)

    def test_reset_link_for_new_address_dies(self, user, anon_client):
        token = changed_user(user)
        reset_token = default_token_generator.make_token(user)

        assert self.post(anon_client, token).status_code == 200
        user.refresh_from_db()
        assert not default_token_generator.check_token(user, reset_token)

    def test_lock_is_cleared(self, user, anon_client, mock_send):
        token = changed_user(user)
        assert self.post(anon_client, token).status_code == 200
        user.refresh_from_db()

        request_email_change(user, NEW_PASSWORD, "another@example.com")

        mock_send.assert_called_once()


# pytest-django's per-test transaction masks a missing @transaction.atomic
@pytest.mark.django_db(transaction=True)
class TestTransactionBoundary:
    def test_confirm_runs_outside_a_test_transaction(self, user, mock_send):
        token = make_email_change_token(user, "new@example.com")

        confirm_email_change(user, token)

        user.refresh_from_db()
        assert user.email == "new@example.com"

    def test_failed_rollback_keeps_the_never_activated_holder(self, user):
        token = changed_user(user)
        holder = factory_user(email="old@example.com", is_active=False, last_login=None)

        with pytest.raises(ValidationError):
            rollback_email_change(token, PASSWORD)

        holder.refresh_from_db()
        user.refresh_from_db()
        assert holder.email == "old@example.com"
        assert user.email == "new@example.com"
