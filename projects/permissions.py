from django.db import models
from rest_framework.exceptions import PermissionDenied


class ObjectPermission(models.TextChoices):
    VIEWER = "viewer"
    FORECASTER = "forecaster"
    CURATOR = "curator"
    ADMIN = "admin"

    @classmethod
    def get_numeric_representation(cls):
        """
        Used in the db to detect the priority of the given char permission
        """

        return {cls.VIEWER: 1, cls.FORECASTER: 2, cls.CURATOR: 3, cls.ADMIN: 4}

    @classmethod
    def can_view(cls, permission: "ObjectPermission", raise_exception=False):
        can = bool(permission)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to view this project")

        return can

    @classmethod
    def can_forecast(cls, permission: "ObjectPermission", raise_exception=False):
        can = permission in (
            cls.FORECASTER,
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to make a forecast")

        return can

    @classmethod
    def can_edit(cls, permission: "ObjectPermission", raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to edit this project")

        return can

    @classmethod
    def can_delete(cls, permission: "ObjectPermission", raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to delete this project")

        return can
