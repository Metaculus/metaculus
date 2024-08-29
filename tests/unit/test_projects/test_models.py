from projects.models import Project
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user


def test_annotate_user_permission(user1, user2, user_admin):
    def get_perm(prj, usr):
        return (
            Project.objects.annotate_user_permission(user=usr)
            .filter(pk=prj.pk)
            .first()
            .user_permission
        )

    # Default permission
    project = factory_project(default_permission=ObjectPermission.VIEWER)
    assert get_perm(project, user1) == ObjectPermission.VIEWER

    # Override permission
    project.override_permissions.through.objects.create(
        user=user1, project=project, permission=ObjectPermission.CURATOR
    )
    assert get_perm(project, user1) == ObjectPermission.CURATOR
    # Anon user
    assert get_perm(project, user2) == ObjectPermission.VIEWER

    # No permissions
    project2 = factory_project(default_permission=None)
    assert not get_perm(project2, user1)
    # And is not accessible for superuser
    # (only from the admin panel)
    assert not get_perm(project2, user_admin)


def test_filter_permission(user1, user2):
    factory_project(default_permission=None)
    project_2 = factory_project(default_permission=None)
    project_2.override_permissions.through.objects.create(
        user=user1, project=project_2, permission=ObjectPermission.FORECASTER
    )
    project_3 = factory_project(default_permission=ObjectPermission.VIEWER)

    assert set(
        Project.objects.filter_permission(user=user1).values_list("id", flat=True)
    ) == {project_2.pk, project_3.pk}
    assert set(
        Project.objects.filter_permission(user=user2).values_list("id", flat=True)
    ) == {project_3.pk}


def test_get_users_for_permission(user1, user2):
    factory_user()

    project = factory_project(
        default_permission=None,
        override_permissions={
            user1.pk: ObjectPermission.FORECASTER,
            user2.pk: ObjectPermission.ADMIN,
        },
    )

    assert set(
        project.get_users_for_permission(ObjectPermission.VIEWER).values_list(
            "id", flat=True
        )
    ) == {user1.pk, user2.pk}

    assert set(
        project.get_users_for_permission(ObjectPermission.ADMIN).values_list(
            "id", flat=True
        )
    ) == {user2.pk}

    # Case #2
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER,
        override_permissions={
            user2.pk: ObjectPermission.ADMIN,
        },
    )

    assert project.get_users_for_permission(ObjectPermission.VIEWER).count() > 2
    assert project.get_users_for_permission(ObjectPermission.FORECASTER).count() > 2
    assert set(
        project.get_users_for_permission(ObjectPermission.ADMIN).values_list(
            "id", flat=True
        )
    ) == {user2.pk}
