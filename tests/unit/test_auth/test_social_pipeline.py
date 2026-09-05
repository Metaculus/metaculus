from unittest.mock import Mock

import pytest
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from authentication.social_pipeline import associate_by_email, create_user
from authentication.views.social import SocialCodeAuth
from tests.unit.test_users.factories import factory_user
from users.models import User

EMAIL = "pending@example.com"


def details(email=EMAIL):
    return {"email": email, "username": "social_user"}


def user_with_email(email=EMAIL, **kwargs):
    """A signup awaiting its activation email unless overridden."""
    kwargs.setdefault("is_active", False)
    kwargs.setdefault("last_login", None)
    kwargs.setdefault("is_spam", False)

    return factory_user(email=email, **kwargs)


class TestAssociateByEmail:
    """
    Social login must reuse the account that already owns the email instead of
    creating a duplicate. social_core's own step only looks at active users, so
    a pending signup was invisible to it and every such login minted a second
    account.
    """

    def test_claims_pending_signup(self):
        existing = user_with_email()

        result = associate_by_email(Mock(), details())

        existing.refresh_from_db()
        assert result == {"user": existing, "is_new": False}
        assert existing.is_active
        assert User.objects.count() == 1

    @pytest.mark.parametrize(
        "state",
        [{"last_login": timezone.now()}, {"is_spam": True}],
        ids=["deactivated", "spam"],
    )
    def test_refuses_unavailable_account(self, state):
        user_with_email(**state)

        with pytest.raises(ValidationError):
            associate_by_email(Mock(), details())

    def test_associates_active_account(self):
        existing = user_with_email(is_active=True)

        result = associate_by_email(Mock(), details())

        assert result == {"user": existing, "is_new": False}

    def test_matches_email_case_insensitively(self):
        existing = user_with_email(email="Mixed@Example.com")

        result = associate_by_email(Mock(), details("mixed@example.com"))

        assert result["user"] == existing

    def test_picks_last_when_email_is_duplicated(self):
        user_with_email(is_active=True, date_joined=timezone.now())
        newest = user_with_email(is_active=True)

        result = associate_by_email(Mock(), details())

        assert result["user"] == newest

    def test_ignores_unknown_email(self):
        assert associate_by_email(Mock(), details("nobody@example.com")) is None

    def test_ignores_login_without_email(self):
        # Bots and cleaned-up accounts share the empty email and must not match
        factory_user(email="", is_active=True)

        assert associate_by_email(Mock(), {"username": "social_user"}) is None

    def test_ignores_already_associated_login(self):
        user_with_email()

        assert associate_by_email(Mock(), details(), user=factory_user()) is None


class TestCreateUser:
    """
    Provider profiles must not name accounts: social_core derives a username
    from the email local part, publishing a fragment of the address.
    """

    def test_username_comes_from_the_generator(self):
        result = create_user(Mock(), details(), Mock())

        assert result["is_new"]
        assert result["user"].email == EMAIL
        assert result["user"].username != details()["username"]
        # Generated, not chosen, so it carries no human-set stamp.
        assert result["user"].username_set_at is None

    def test_pipeline_does_not_run_the_username_deriving_step(self):
        assert (
            "social_core.pipeline.user.get_username"
            not in settings.SOCIAL_AUTH_PIPELINE
        )


class TestSocialAuthResponse:
    """
    social_core stamps is_new on the user the pipeline returns. The response has
    to carry it through, or the client cannot tell a signup from a sign-in and
    every Google login would count as a registration.
    """

    def test_reports_a_signup(self):
        user = factory_user()
        user.is_new = True

        assert SocialCodeAuth.TokenSerializer(instance=user).data["is_new"] is True

    def test_reports_a_sign_in(self):
        # No attribute at all, which is what an existing account arrives with
        assert (
            SocialCodeAuth.TokenSerializer(instance=factory_user()).data["is_new"]
            is False
        )
