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
    def get_numeric_representation(cls):
        """
        Used in the db to detect the priority of the given char permission
        """

        return {cls.VIEWER: 1, cls.FORECASTER: 2, cls.CURATOR: 3, cls.ADMIN: 4}

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
