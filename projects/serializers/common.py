from collections import defaultdict
from typing import Any, Callable, Iterable

from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project, ProjectUserPermission, ProjectIndex
from projects.serializers.communities import CommunitySerializer
from projects.services.cache import get_projects_questions_count_cached
from projects.services.common import get_timeline_data_for_projects
from projects.services.indexes import get_multi_year_index_data, get_default_index_data
from users.serializers import UserPublicSerializer


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "created_at",
            "edited_at",
            "id",
            "type",
            "bot_leaderboard_status",
            "name",
            "slug",
            "subtitle",
            "description",
            "header_image",
            "header_logo",
            "emoji",
            "order",
            "prize_pool",
            "start_date",
            "close_date",
            "forecasting_end_date",
            "html_metadata_json",
            "default_permission",
            "visibility",
            "show_on_homepage",
            "show_on_services_page",
            "forecasts_flow_enabled",
        )
        read_only_fields = (
            "created_at",
            "edited_at",
            "id",
        )


class LeaderboardTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "type")


class NewsCategorySerialize(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "type", "default_permission")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "emoji", "description", "type")


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "emoji", "type")


class TournamentShortSerializer(serializers.ModelSerializer):
    score_type = serializers.SerializerMethodField(read_only=True)
    is_current_content_translated = serializers.SerializerMethodField(read_only=True)
    description_preview = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "type",
            "name",
            "slug",
            "header_image",
            "prize_pool",
            "start_date",
            "close_date",
            "forecasting_end_date",
            "html_metadata_json",
            "is_ongoing",
            "user_permission",
            "created_at",
            "edited_at",
            "score_type",
            "default_permission",
            "visibility",
            "is_current_content_translated",
            "bot_leaderboard_status",
            "description_preview",
        )

    def get_description_preview(self, project: Project) -> str:
        raw = (project.description or "").strip()
        if not raw:
            return ""
        return raw[:140].rstrip()

    def get_score_type(self, project: Project) -> str | None:
        if not project.primary_leaderboard_id:
            return None
        return project.primary_leaderboard.score_type

    def get_is_current_content_translated(self, project: Project) -> bool:
        return project.is_current_content_translated()


class TournamentSerializer(TournamentShortSerializer):
    class Meta:
        model = Project
        fields = TournamentShortSerializer.Meta.fields + (
            "subtitle",
            "description",
            "header_image",
            "header_logo",
            "html_metadata_json",
            "edited_at",
            "visibility",
            "forecasts_flow_enabled",
        )


def serialize_project(obj: Project):
    match obj.type:
        case obj.ProjectTypes.LEADERBOARD_TAG:
            serializer = LeaderboardTagSerializer
        case obj.ProjectTypes.TOPIC:
            serializer = TopicSerializer
        case obj.ProjectTypes.CATEGORY:
            serializer = CategorySerializer
        case obj.ProjectTypes.TOURNAMENT:
            serializer = TournamentShortSerializer
        case obj.ProjectTypes.QUESTION_SERIES:
            serializer = TournamentShortSerializer
        case obj.ProjectTypes.INDEX:
            serializer = TournamentShortSerializer
        case obj.ProjectTypes.SITE_MAIN:
            serializer = TournamentShortSerializer
        case obj.ProjectTypes.NEWS_CATEGORY:
            serializer = NewsCategorySerialize
        case obj.ProjectTypes.COMMUNITY:
            serializer = CommunitySerializer
        case _:
            serializer = LeaderboardTagSerializer

    return serializer(obj).data


def serialize_projects(
    projects: list[Project], default_project: Project = None
) -> defaultdict[Any, list]:
    projects = set(projects) | {default_project}
    data = defaultdict(list)

    # sort by order to allow any prioritized tags to be shown first
    # e.g. global leaderboard tags
    for obj in sorted(projects, key=lambda x: x.order or float("inf")):
        serialized_data = serialize_project(obj)

        data[obj.type].append(serialized_data)

        if obj == default_project:
            data["default_project"] = serialized_data
    return data


def validate_categories(lookup_field: str, lookup_values: list):
    categories = Project.objects.filter_category().filter(
        **{f"{lookup_field}__in": lookup_values}
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

    tournaments = Project.objects.filter_tournament().filter(
        Q(**{"slug__in": slug_values}) | Q(pk__in=id_values)
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


def serialize_index_data(index: ProjectIndex):
    index_posts = index.post_weights.all()

    if index.type == ProjectIndex.IndexType.MULTI_YEAR:
        data = get_multi_year_index_data(index)
    else:
        data = get_default_index_data(index)

    return {
        "type": index.type,
        "weights": {x.post_id: x.weight for x in index_posts},
        "min": index.min,
        "min_label": index.min_label,
        "max": index.max,
        "max_label": index.max_label,
        "increasing_is_good": index.increasing_is_good,
        **data,
    }


def serialize_tournaments_with_counts(
    projects: Iterable[Project],
    sort_key: Callable[[dict], Any] = None,
    with_timeline: bool = False,
) -> list[dict]:
    projects = list(projects)
    questions_count_map = get_projects_questions_count_cached([p.id for p in projects])

    projects_timeline_map = (
        get_timeline_data_for_projects([x.id for x in projects])
        if with_timeline
        else {}
    )

    data: list[dict] = []
    for obj in projects:
        serialized_tournament = TournamentShortSerializer(obj).data

        serialized_tournament.update(
            {
                "questions_count": questions_count_map.get(obj.id) or 0,
                "forecasts_count": obj.forecasts_count,
                "forecasters_count": obj.forecasters_count,
                "timeline": projects_timeline_map.get(obj.id),
            }
        )

        data.append(serialized_tournament)

    if sort_key:
        data.sort(key=sort_key, reverse=True)

    return data
