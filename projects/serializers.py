from collections import defaultdict
from typing import Any

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug")


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


def validate_categories(lookup_field: str, lookup_values: list):
    categories = (
        Project.objects.filter_category()
        .filter_active()
        .filter(**{f"{lookup_field}__in": lookup_values})
    )
    lookup_values_fetched = {getattr(obj, lookup_field) for obj in categories}

    for value in lookup_values:
        if value not in lookup_values_fetched:
            raise ValidationError(f"Category {value} does not exist")

    return categories


def validate_tournaments(lookup_field: str, lookup_values: list):
    categories = (
        Project.objects.filter_tournament()
        .filter_active()
        .filter(**{f"{lookup_field}__in": lookup_values})
    )
    lookup_values_fetched = {getattr(obj, lookup_field) for obj in categories}

    for value in lookup_values:
        if value not in lookup_values_fetched:
            raise ValidationError(f"Tournament {value} does not exist")

    return categories


class QuestionProjectWriteSerializer(serializers.Serializer):
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)
    tournaments = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    def validate_categories(self, values: list[int]) -> list[Project]:
        return validate_categories(lookup_field="id", lookup_values=values)

    def validate_tournaments(self, values: list[int]) -> list[Project]:
        return validate_tournaments(lookup_field="id", lookup_values=values)
