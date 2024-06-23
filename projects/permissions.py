from typing import Self

from django.db import models
from django.db.models.enums import ChoicesType as _ChoicesType
from rest_framework.exceptions import PermissionDenied


class ChoicesType(_ChoicesType):
    @property
    def choices(self):
        """
        Excludes CREATOR from available choices
        """

        return [c for c in super().choices if c[0] != self.CREATOR.value]


class ObjectPermission(models.TextChoices, metaclass=ChoicesType):
    VIEWER = "viewer"
    FORECASTER = "forecaster"
    CURATOR = "curator"
    ADMIN = "admin"
    # Dynamically generated permission
    CREATOR = "creator"

    @classmethod
    def get_permissions_rank(cls):
        """
        Rank permissions by the numeric scale of permissiveness
        """

        return {cls.VIEWER: 1, cls.FORECASTER: 2, cls.CURATOR: 3, cls.ADMIN: 4}

    @classmethod
    def get_included_permissions(cls, permission: Self) -> list[Self]:
        """
        Permissions of the highest order automatically includes all previous permissions.
        E.g. CURATOR already includes permissions of VIEWER and FORECASTER

        This method generates list of included permissions for the given permission role
        """

        return [
            name
            for name, value in cls.get_permissions_rank().items()
            if value >= cls.get_permissions_rank()[permission]
        ]

    @classmethod
    def can_view(cls, permission: Self, raise_exception=False):
        can = bool(permission)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to view this project")

        return can

    @classmethod
    def can_forecast(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.FORECASTER,
            cls.CURATOR,
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to make a forecast")

        return can

    @classmethod
    def can_edit(cls, permission: Self, raise_exception=False):
        can = permission in (cls.CURATOR, cls.ADMIN, cls.CREATOR)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to edit this project")

        return can

    @classmethod
    def can_delete(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to delete this project")

        return can

    @classmethod
    def can_invite_project_users(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to invite users to this project")

        return can
