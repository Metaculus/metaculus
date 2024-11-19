from posts.services.common import get_posts_staff_users
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project


def test_get_posts_staff_users(user1, user2):
    # Post #1
    post_1 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                user1.id: ObjectPermission.CURATOR,
                user2.id: ObjectPermission.ADMIN,
            },
        ),
    )
    post_2 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=None,
            override_permissions={user2.id: ObjectPermission.CURATOR},
        ),
    )
    post_3 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=ObjectPermission.VIEWER,
        ),
    )

    data = get_posts_staff_users([post_1, post_2, post_3])
    assert len(data) == 3

    assert len(data[post_1]) == 2
    assert data[post_1][user1.id] == ObjectPermission.CURATOR
    assert data[post_1][user2.id] == ObjectPermission.ADMIN

    assert len(data[post_2]) == 1
    assert data[post_2][user2.id] == ObjectPermission.CURATOR

    assert data[post_3] == {}
