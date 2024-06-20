from django_dynamic_fixture import G

from projects.models import Project
from projects.permissions import ObjectPermission
from utils.dtypes import setdefaults_not_null


def factory_project(
    *,
    default_permission: ObjectPermission | None = ObjectPermission.FORECASTER,
    # user_id -> permission
    override_permissions: dict[int, ObjectPermission] = None,
    **kwargs
) -> Project:
    kwargs["default_permission"] = default_permission
    kwargs["type"] = kwargs.get("type", Project.ProjectTypes.CATEGORY)
    override_permissions = override_permissions or {}

    project = G(
        Project,
        **setdefaults_not_null(
            kwargs,
        )
    )

    for user_id, permission in override_permissions.items():
        project.override_permissions.through.objects.create(
            user_id=user_id, project=project, permission=permission
        )

    return project
