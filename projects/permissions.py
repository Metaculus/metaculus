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

        return {
            cls.VIEWER: 1,
            cls.FORECASTER: 2,
            cls.CURATOR: 3,
            cls.ADMIN: 4,
        }

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
            raise PermissionDenied("You do not have permission to view this object")

        return can

    @classmethod
    def can_comment(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.FORECASTER,
            cls.CURATOR,
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to comment this project")

        return can

    @classmethod
    def can_delete_key_factor(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to delete this Key Factor"
            )

        return can

    @classmethod
    def can_pin_comment(cls, permission: Self, raise_exception=False):
        can = permission in (cls.ADMIN,)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to pin this comment")

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
            raise PermissionDenied("You do not have permission to edit this post")

        return can

    @classmethod
    def can_delete(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to delete this post")

        return can

    @classmethod
    def can_approve_or_reject(cls, permission: Self, raise_exception=False):
        can = permission in (cls.CURATOR, cls.ADMIN)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to approve this post")

        return can

    @classmethod
    def can_submit_for_review(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
            cls.CREATOR,
        )

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to submit post for review"
            )

        return can

    @classmethod
    def can_resolve(cls, permission: Self, raise_exception=False):
        can = permission in (cls.ADMIN,)

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to resolve this question"
            )

        return can

    @classmethod
    def can_close(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to close this question")

        return can

    @classmethod
    def can_edit_project(cls, permission: Self, raise_exception=False):
        can = permission in (cls.ADMIN,)

        if raise_exception and not can:
            raise PermissionDenied("You do not have permission to edit this project")

        return can

    @classmethod
    def can_edit_community_project(cls, permission: Self, raise_exception=False):
        can = permission in (cls.ADMIN,)

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to manage this community"
            )

        return can

    @classmethod
    def can_manage_project_members(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to manage members of this project"
            )

        return can

    @classmethod
    def can_repost_into_project(cls, permission: Self, raise_exception=False):
        can = permission in (
            cls.CURATOR,
            cls.ADMIN,
        )

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to repost into this project"
            )

        return can

    @classmethod
    def can_edit_project_member_permission(
        cls, permission: Self, raise_exception=False
    ):
        can = permission in (cls.ADMIN,)

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to edit member permissions of this project"
            )

        return can

    @classmethod
    def can_delete_project_member(cls, permission: Self, member, raise_exception=False):
        can = permission == cls.ADMIN or (
            permission == cls.CURATOR
            and member.permission not in [cls.CURATOR, cls.ADMIN]
        )

        if raise_exception and not can:
            raise PermissionDenied(
                "You do not have permission to delete this member of the project"
            )

        return can
