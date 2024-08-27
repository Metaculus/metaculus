from collections import defaultdict
from typing import Any

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project, ProjectUserPermission
from users.serializers import UserPublicSerializer
from django.db.models import Q


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


class MiniTournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id",
            "type",
            "name",
            "slug",
            "prize_pool",
            "start_date",
            "close_date",
            "meta_description",
            "is_ongoing",
            "user_permission",
            "created_at",
            "edited_at",
            "default_permission",
        )


class TournamentSerializer(serializers.ModelSerializer):
    score_type = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "type",
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
            "is_ongoing",
            "user_permission",
            "created_at",
            "edited_at",
            "default_permission",
            "score_type",
        )
        
    def get_score_type(self, project: Project) -> str | None:
        if not project.primary_leaderboard:
            return None
        return project.primary_leaderboard.score_type
    

def serialize_projects(
    projects: list[Project], default_project: Project = None
) -> defaultdict[Any, list]:
    data = defaultdict(list)

    if (
        default_project
        and len([x for x in projects if x.id == default_project.id]) == 0
    ):
        projects = [x for x in projects] + [default_project]
    for obj in projects:
        match obj.type:
            case obj.ProjectTypes.TAG:
                serializer = TagSerializer
            case obj.ProjectTypes.TOPIC:
                serializer = TopicSerializer
            case obj.ProjectTypes.CATEGORY:
                serializer = CategorySerializer
            case obj.ProjectTypes.TOURNAMENT:
                serializer = MiniTournamentSerializer
            case obj.ProjectTypes.QUESTION_SERIES:
                serializer = MiniTournamentSerializer
            case obj.ProjectTypes.SITE_MAIN:
                serializer = MiniTournamentSerializer
            case _:
                continue

        data[obj.type].append(serializer(obj).data)
        if default_project and obj.id == default_project.id:
            data["default_project"] = data[obj.type][-1]
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


def validate_tournaments(lookup_values: list):
    slug_values = []
    id_values = []

    for value in lookup_values:
        if value.isdigit():
            id_values.append(int(value))
        else:
            slug_values.append(value)

    tournaments = (
        Project.objects.filter_tournament()
        .filter_active()
        .filter(Q(**{f"slug__in": slug_values}) | Q(pk__in=id_values))
    )

    lookup_values_fetched = {obj.slug for obj in tournaments}
    lookup_values_fetched_id = {obj.pk for obj in tournaments}

    for value in slug_values:
        if value not in lookup_values_fetched:
            raise ValidationError(f"Tournament with slug `{value}` does not exist")

    for value in id_values:
        if value not in lookup_values_fetched_id:
            raise ValidationError(f"Tournament with id `{value}` does not exist")

    return tournaments


class PostProjectWriteSerializer(serializers.Serializer):
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)
    tournaments = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    def validate_categories(self, values: list[int]) -> list[Project]:
        return validate_categories(lookup_field="id", lookup_values=values)

    def validate_tournaments(self, values: list[int]) -> list[Project]:
        return validate_tournaments(lookup_values=values)


class ProjectUserSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer()

    class Meta:
        model = ProjectUserPermission
        fields = (
            "user",
            "permission",
        )
