import dramatiq
import pytest


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
