import pytest

from projects.models import Project
from tests.unit.test_projects.factories import factory_project


@pytest.fixture
def community_public():
    return factory_project(
        type=Project.ProjectTypes.COMMUNITY,
        name="Metaculus Community",
        slug="community_public",
    )


@pytest.fixture
def community_unlisted():
    return factory_project(
        type=Project.ProjectTypes.COMMUNITY,
        name="Metaculus Community",
        visibility=Project.Visibility.UNLISTED,
        slug="community_unlisted",
    )


@pytest.fixture
def community_private():
    return factory_project(
        type=Project.ProjectTypes.COMMUNITY,
        name="Metaculus Community",
        default_permission=None,
        visibility=Project.Visibility.UNLISTED,
        slug="community_private",
    )
