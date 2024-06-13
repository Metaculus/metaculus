from projects.models import ProjectPermission, Project
from tests.fixtures import *  # noqa
from tests.test_projects.factories import factory_project


# TODO: OR owner case!!!
# TODO: user private question!!!
# TODO: add default Public project


def test_annotate_user_permission(user1, user2, user_admin):
    # TODO: anon user

    def get_perm(prj, usr):
        return (
            Project.objects.annotate_user_permission(user=usr)
            .filter(pk=prj.pk)
            .first()
            .user_permission
        )

    # Default permission
    project = factory_project(default_permission=ProjectPermission.VIEWER)
    assert get_perm(project, user1) == ProjectPermission.VIEWER

    # Override permission
    project.override_permissions.through.objects.create(
        user=user1, project=project, permission=ProjectPermission.CURATOR
    )
    assert get_perm(project, user1) == ProjectPermission.CURATOR
    # Anon user
    assert get_perm(project, user2) == ProjectPermission.VIEWER

    # No permissions
    project2 = factory_project(default_permission=None)
    assert not get_perm(project2, user1)
    # But accessible for superuser
    assert get_perm(project2, user_admin)


def test_filter_allowed(user1, user2):
    factory_project(default_permission=None)
    project_2 = factory_project(default_permission=None)
    project_2.override_permissions.through.objects.create(
        user=user1, project=project_2, permission=ProjectPermission.FORECASTER
    )
    project_3 = factory_project(default_permission=ProjectPermission.VIEWER)

    assert set(
        Project.objects.filter_allowed(user=user1).values_list("id", flat=True)
    ) == {project_2.pk, project_3.pk}
    assert set(
        Project.objects.filter_allowed(user=user2).values_list("id", flat=True)
    ) == {project_3.pk}
