import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from users.models import User


@pytest.fixture
def user1():
    return User.objects.create(email="user@metaculus.com")


@pytest.fixture
def create_client_for_user():
    def f(user: User = None):
        client = APIClient()

        if user:
            token = Token.objects.create(user=user)
            client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        return client

    return f


@pytest.fixture()
def anon_client(create_client_for_user):
    return create_client_for_user()


@pytest.fixture
def user1_client(create_client_for_user, user1):
    return create_client_for_user(user=user1)
