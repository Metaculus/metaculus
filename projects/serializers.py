from collections import defaultdict
from typing import Any

from rest_framework import serializers

from projects.models import Project


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("name", "slug")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "description")


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "emoji", "section")


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "slug",
            "subtitle",
            "description",
            "header_image",
            "header_logo",
            "prize_pool",
            "start_date",
            "close_date",
            "meta_description",
            "created_at",
            "edited_at",
        )


def serialize_projects(projects: list[Project]) -> defaultdict[Any, list]:
    data = defaultdict(list)

    for obj in projects:
        match obj.type:
            case obj.ProjectTypes.TAG:
                serializer = TagSerializer
            case obj.ProjectTypes.TOPIC:
                serializer = TopicSerializer
            case obj.ProjectTypes.CATEGORY:
                serializer = CategorySerializer
            case obj.ProjectTypes.TOURNAMENT:
                serializer = TournamentSerializer
            case _:
                continue

        data[obj.type].append(serializer(obj).data)

    return data
