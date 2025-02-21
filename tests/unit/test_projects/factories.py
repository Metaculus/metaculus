from django_dynamic_fixture import G

from projects.models import Project, ProjectSubscription
from projects.permissions import ObjectPermission
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_project(
    *,
    default_permission: ObjectPermission | None = ObjectPermission.FORECASTER,
    # user_id -> permission
    override_permissions: dict[int | User, ObjectPermission] = None,
    subscribers: list[User] = None,
    **kwargs
) -> Project:
    kwargs["default_permission"] = default_permission
    kwargs["type"] = kwargs.get("type", Project.ProjectTypes.CATEGORY)
    override_permissions = override_permissions or {}
    subscribers = subscribers or []

    project = G(
        Project,
        **setdefaults_not_null(
            kwargs,
        )
    )

    for user_value, permission in override_permissions.items():
        user_id = user_value.id if isinstance(user_value, User) else user_value

        project.override_permissions.through.objects.create(
            user_id=user_id, project=project, permission=permission
        )

    for user in subscribers:
        ProjectSubscription.objects.create(project=project, user=user)

    return project
