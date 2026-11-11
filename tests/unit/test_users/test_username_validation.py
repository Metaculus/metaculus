import pytest
from rest_framework.exceptions import ValidationError

from users.models import User
from users.serializers import validate_username


@pytest.mark.parametrize("username", ["metac-gpt-5", "METAC-gpt-5", "Metac-Foo"])
def test_validate_username_rejects_reserved_prefix(username: str) -> None:
    with pytest.raises(ValidationError, match="reserved for Metaculus bots"):
        validate_username(username)


@pytest.mark.parametrize("username", ["metac", "metaculus_fan", "my-metac-bot"])
def test_validate_username_allows_near_misses(username: str) -> None:
    assert validate_username(username) == username


def test_orm_can_create_reserved_prefix_username() -> None:
    user = User.objects.create_user(username="metac-shell-bot", email="m@example.com")

    assert user.username == "metac-shell-bot"
