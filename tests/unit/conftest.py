from typing import Callable

import dramatiq
import pytest
from authentication.models import ApiToken
from rest_framework.test import APIClient

from users.models import User


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture
def broker():
    broker = dramatiq.get_broker()
    broker.flush_all()
    return broker


@pytest.fixture
def worker(broker):
    worker = dramatiq.Worker(broker, worker_timeout=100)
    worker.start()
    yield worker
    worker.stop()


@pytest.fixture
def await_queue(broker, worker):
    """
    Helper Fixture that waits for all the messages on the given queue to be processed
    https://dramatiq.io/reference.html#dramatiq.brokers.rabbitmq.RabbitmqBroker.join
    """

    def f():
        broker.join("default")
        worker.join()

    return f


@pytest.fixture
def user1() -> User:
    user, _ = User.objects.get_or_create(email="user@metaculus.com", username="user1")
    return user


@pytest.fixture
def user2() -> User:
    user, _ = User.objects.get_or_create(
        email="user-second@metaculus.com", username="user2"
    )
    return user


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
            token = ApiToken.objects.create(user=user)
            client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        return client

    return f


@pytest.fixture()
def anon_client(
    create_client_for_user: Callable[[User | None], APIClient],
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


@pytest.fixture
def user_admin_client(
    create_client_for_user: Callable[[User | None], APIClient], user_admin: User
) -> APIClient:
    return create_client_for_user(user_admin)
