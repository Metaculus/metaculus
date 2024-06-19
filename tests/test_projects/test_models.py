from projects.models import Project
from projects.permissions import ObjectPermission
from tests.fixtures import *  # noqa
from tests.test_projects.factories import factory_project


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
    # But accessible for superuser
    assert get_perm(project2, user_admin)


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
