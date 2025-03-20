from django.contrib.auth.models import AnonymousUser

from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from tests.unit.test_posts.factories import factory_post
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
    # But is accessible for superuser
    assert get_perm(project2, user_admin) == ObjectPermission.ADMIN

    # Creator gets admin permissions
    project = factory_project(
        default_permission=ObjectPermission.VIEWER, created_by=user1
    )
    assert get_perm(project, user1) == ObjectPermission.ADMIN

    # Anonymous user check
    project = factory_project(default_permission=ObjectPermission.VIEWER)
    assert get_perm(project, AnonymousUser()) == ObjectPermission.VIEWER


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


def test_get_users_for_permission(user1, user2, user_admin):
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
    ) == {user1.pk, user2.pk, user_admin.pk}

    assert set(
        project.get_users_for_permission(ObjectPermission.ADMIN).values_list(
            "id", flat=True
        )
    ) == {user2.pk, user_admin.pk}

    # Case #2
    project = factory_project(
        default_permission=ObjectPermission.FORECASTER,
        override_permissions={
            user2.pk: ObjectPermission.ADMIN,
        },
    )

    assert project.get_users_for_permission(ObjectPermission.VIEWER).count() == 4
    assert project.get_users_for_permission(ObjectPermission.FORECASTER).count() == 4
    assert set(
        project.get_users_for_permission(ObjectPermission.ADMIN).values_list(
            "id", flat=True
        )
    ) == {user2.pk, user_admin.pk}


def test_annotate_posts_count(
    user1,
):
    project = factory_project()

    factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
    )
    factory_post(
        author=user1,
        default_project=factory_project(),
        projects=[project],
        curation_status=Post.CurationStatus.APPROVED,
    )
    factory_post(
        author=user1, default_project=project, curation_status=Post.CurationStatus.DRAFT
    )
    factory_post(
        author=user1,
        default_project=factory_project(),
        projects=[project],
        curation_status=Post.CurationStatus.PENDING,
    )

    assert (
        Project.objects.filter(pk=project.pk).annotate_posts_count().first().posts_count
        == 2
    )
