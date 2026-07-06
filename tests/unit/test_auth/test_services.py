import pytest

from django.contrib.auth.tokens import default_token_generator
from rest_framework.exceptions import ValidationError

from authentication.services import check_and_activate_user
from tests.unit.test_users.factories import factory_user


def test_check_and_activate_user__happy_path():
    user = factory_user(is_active=False)
    token = default_token_generator.make_token(user)

    check_and_activate_user(user.id, token)

    user.refresh_from_db()
    assert user.is_active

    # Second activation won't cause an error
    check_and_activate_user(user.id, token)
    user.refresh_from_db()
    assert user.is_active


def test_check_and_activate_user__wrong_token():
    user = factory_user(is_active=False)

    with pytest.raises(ValidationError):
        check_and_activate_user(user.id, "wrong_token")


def test_check_and_activate_user__active_user_invalid_token():
    """
    invalid token must be rejected even for already-active users.
    """
    user = factory_user(is_active=True)

    with pytest.raises(ValidationError, match="Activation Token is expired or invalid"):
        check_and_activate_user(user.id, "garbage_token")


def test_check_and_activate_user__spam_user():
    user = factory_user(is_active=False, is_spam=True)
    token = default_token_generator.make_token(user)

    with pytest.raises(ValidationError):
        check_and_activate_user(user.id, token)
