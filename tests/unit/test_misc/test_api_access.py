import pytest
from django.db import IntegrityError, transaction

from misc.models import UserApiAccess
from misc.utils import (
    get_api_access_level,
    get_global_api_access_level,
    get_project_api_access_levels,
)
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user
from users.constants import ApiAccessLevel
from users.serializers import UserPrivateDataAccessSerializer


def test_user_without_grant_is_restricted():
    user = factory_user()

    assert get_global_api_access_level(user) == "restricted"
    assert get_api_access_level(user) == "restricted"
    assert get_project_api_access_levels(user) == []


def test_global_grant_applies_everywhere():
    user = factory_user()
    project = factory_project()
    UserApiAccess.objects.create(
        user=user, project=None, access_level=ApiAccessLevel.BENCHMARKING
    )

    assert get_global_api_access_level(user) == "benchmarking"
    assert get_api_access_level(user, project.id) == "benchmarking"
    # A global grant is not reported per project; the gateway reads it from the base
    # tier instead.
    assert get_project_api_access_levels(user) == []


def test_project_grant_does_not_leak_to_other_projects():
    user = factory_user()
    granted = factory_project()
    other = factory_project()
    UserApiAccess.objects.create(
        user=user, project=granted, access_level=ApiAccessLevel.BENCHMARKING
    )

    assert get_global_api_access_level(user) == "restricted"
    assert get_api_access_level(user, granted.id) == "benchmarking"
    assert get_api_access_level(user, other.id) == "restricted"


def test_more_permissive_project_grant_overrides_global():
    user = factory_user()
    project = factory_project()
    UserApiAccess.objects.create(
        user=user, project=None, access_level=ApiAccessLevel.BENCHMARKING
    )
    UserApiAccess.objects.create(
        user=user, project=project, access_level=ApiAccessLevel.UNRESTRICTED
    )

    assert get_api_access_level(user, project.id) == "unrestricted"
    assert get_global_api_access_level(user) == "benchmarking"
    assert get_project_api_access_levels(user) == [
        {"project_id": project.id, "api_access_tier": "unrestricted"}
    ]


def test_less_permissive_project_grant_never_narrows_global():
    user = factory_user()
    project = factory_project()
    UserApiAccess.objects.create(
        user=user, project=None, access_level=ApiAccessLevel.UNRESTRICTED
    )
    UserApiAccess.objects.create(
        user=user, project=project, access_level=ApiAccessLevel.BENCHMARKING
    )

    assert get_api_access_level(user, project.id) == "unrestricted"
    # The reported per-project level folds in the global one, so it states what actually
    # applies rather than the weaker stored grant.
    assert get_project_api_access_levels(user) == [
        {"project_id": project.id, "api_access_tier": "unrestricted"}
    ]


def test_unknown_stored_level_degrades_to_restricted():
    user = factory_user()
    UserApiAccess.objects.create(user=user, project=None, access_level="bogus")

    assert get_global_api_access_level(user) == "restricted"


def test_one_global_grant_per_user():
    user = factory_user()
    UserApiAccess.objects.create(
        user=user, project=None, access_level=ApiAccessLevel.BENCHMARKING
    )

    # NULL project is one scope, not an unlimited supply of them.
    with pytest.raises(IntegrityError), transaction.atomic():
        UserApiAccess.objects.create(
            user=user, project=None, access_level=ApiAccessLevel.UNRESTRICTED
        )


def test_serializer_keeps_the_shape_the_api_gateway_reads():
    user = factory_user()
    project = factory_project()
    UserApiAccess.objects.create(
        user=user, project=None, access_level=ApiAccessLevel.BENCHMARKING
    )
    UserApiAccess.objects.create(
        user=user, project=project, access_level=ApiAccessLevel.UNRESTRICTED
    )

    data = UserPrivateDataAccessSerializer(user).data

    assert data["api_access_tier"] == "benchmarking"
    assert data["project_data_access"] == [
        {"project_id": project.id, "api_access_tier": "unrestricted"}
    ]


def test_serializer_reports_restricted_without_grants():
    user = factory_user()

    data = UserPrivateDataAccessSerializer(user).data

    assert data["api_access_tier"] == "restricted"
    assert data["project_data_access"] == []
