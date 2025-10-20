import pytest
from freezegun import freeze_time
from rest_framework.exceptions import PermissionDenied

from posts.models import Post
from posts.utils import check_can_edit_post
from projects.permissions import ObjectPermission
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user
from tests.unit.utils import datetime_aware


@freeze_time("2025-10-01")
def test_check_can_edit_post():
    user_admin = factory_user(is_active=True)
    user_curator = factory_user(is_active=True)
    user_owner = factory_user(is_active=True)

    project = factory_project(
        default_permission=ObjectPermission.FORECASTER,
        override_permissions={
            user_admin.id: ObjectPermission.ADMIN,
            user_curator: ObjectPermission.CURATOR,
        },
    )

    # Case #1: upcoming approved post
    post_upcoming = factory_post(
        author=user_owner,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        open_time=datetime_aware(2025, 11, 1),
    )

    with pytest.raises(PermissionDenied):
        check_can_edit_post(post_upcoming, user_owner)

    assert check_can_edit_post(post_upcoming, user_curator)
    assert check_can_edit_post(post_upcoming, user_admin)

    # Case #2: Active approved post
    post_approved = factory_post(
        author=user_owner,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        open_time=datetime_aware(2025, 9, 1),
    )

    with pytest.raises(PermissionDenied):
        check_can_edit_post(post_approved, user_owner)

    with pytest.raises(PermissionDenied):
        check_can_edit_post(post_approved, user_curator)

    assert check_can_edit_post(post_approved, user_admin)

    # Case #2: Pending post
    post_pending = factory_post(
        author=user_owner,
        default_project=project,
        curation_status=Post.CurationStatus.PENDING,
        open_time=datetime_aware(2025, 9, 1),
    )

    assert check_can_edit_post(post_pending, user_owner)
    assert check_can_edit_post(post_pending, user_curator)
    assert check_can_edit_post(post_pending, user_admin)
