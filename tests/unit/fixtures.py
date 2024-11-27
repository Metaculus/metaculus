import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from typing import Callable
from users.models import User


@pytest.fixture
def user1() -> User:
    return User.objects.create(email="user@metaculus.com", username="user1")


@pytest.fixture
def user2() -> User:
    return User.objects.create(email="user-second@metaculus.com", username="user2")


@pytest.fixture
def user_admin() -> User:
    return User.objects.create(
        email="admin@metaculus.com", username="admin", is_superuser=True
    )


@pytest.fixture
def create_client_for_user() -> Callable[[User | None], APIClient]:
    def f(user: User | None = None) -> APIClient:
        client = APIClient()

        if user:
            token = Token.objects.create(user=user)
            client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        return client

    return f


@pytest.fixture()
def anon_client(
    create_client_for_user: Callable[[User | None], APIClient]
) -> APIClient:
    return create_client_for_user(None)


@pytest.fixture
def user1_client(
    create_client_for_user: Callable[[User | None], APIClient], user1: User
) -> APIClient:
    return create_client_for_user(user1)


@pytest.fixture
def user2_client(
    create_client_for_user: Callable[[User | None], APIClient], user2: User
) -> APIClient:
    return create_client_for_user(user2)
