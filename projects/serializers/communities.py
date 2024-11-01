from typing import Iterable

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project
from projects.permissions import ObjectPermission
from users.models import User
from users.serializers import BaseUserSerializer


class CommunityFilterSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    is_subscribed = serializers.BooleanField(required=False, allow_null=True)


class CommunityUpdateSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(min_length=3, max_length=30)

    class Meta:
        model = Project
        fields = (
            "slug",
            "name",
            "description",
            # "Visibility" field is actually a composition of 2 permission params:
            #
            # - Public:
            #       default_permission: Forecaster
            #       unlisted: False
            # - Draft:
            #       default_permission: None
            #       unlisted: False
            # - Unlisted:
            #       default_permission: Forecaster
            #       unlisted: True
            "default_permission",
            "unlisted",
        )

    def validate_slug(self, value: str):
        if (
            Project.objects.filter_communities()
            .filter(slug__iexact=value)
            .exclude(pk=self.instance.pk)
            .exists()
        ):
            raise ValidationError(_("Community with the same slug already exists"))

        return value


class CommunitySerializer(serializers.ModelSerializer):
    created_by = BaseUserSerializer()

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "type",
            "slug",
            "description",
            "header_image",
            "header_logo",
            "followers_count",
            "default_permission",
            "unlisted",
            "created_by",
        )


def serialize_community(
    community: Project,
    posts_count: int = None,
    user_permission: ObjectPermission = None,
    is_subscribed: bool = None,
) -> dict:
    return {
        **CommunitySerializer(community).data,
        "posts_count": posts_count,
        "user_permission": user_permission,
        "is_subscribed": is_subscribed,
    }


def serialize_community_many(
    communities: Project.objects | Iterable[Project] | list[int],
    current_user: User = None,
) -> list[dict]:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    ids = [c.pk if isinstance(c, Project) else c for c in communities]
    qs = (
        Project.objects.filter(pk__in=ids)
        .annotate_user_permission(user=current_user)
        .annotate_posts_count()
        .select_related("created_by")
    )

    if current_user:
        qs = qs.annotate_is_subscribed(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    return [
        serialize_community(
            community,
            posts_count=community.posts_count,
            user_permission=community.user_permission,
            is_subscribed=community.is_subscribed,
        )
        for community in objects
    ]
