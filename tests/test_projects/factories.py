from django_dynamic_fixture import G

from projects.models import Project
from projects.permissions import ObjectPermission
from utils.dtypes import setdefaults_not_null


def factory_project(
    *,
    default_permission: ObjectPermission | None = ObjectPermission.FORECASTER,
    **kwargs
) -> Project:
    kwargs["default_permission"] = default_permission

    return G(
        Project,
        **setdefaults_not_null(
            kwargs,
        )
    )
