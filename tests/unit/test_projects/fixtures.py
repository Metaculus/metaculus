import pytest

from tests.unit.test_projects.factories import TagFactory


@pytest.fixture
def tag1():
    return TagFactory()
