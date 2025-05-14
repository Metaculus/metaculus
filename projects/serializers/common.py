from collections import defaultdict
from typing import Any

from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project, ProjectUserPermission
from projects.serializers.communities import CommunitySerializer
from scoring.models import GLOBAL_LEADERBOARD_STRING
from users.serializers import UserPublicSerializer


class TagSerializer(serializers.ModelSerializer):
    is_global_leaderboard = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ("id", "name", "slug", "type", "is_global_leaderboard")

    def get_is_global_leaderboard(self, obj: Project) -> bool:
        return obj.name.endswith(GLOBAL_LEADERBOARD_STRING)


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
        fields = ("id", "name", "slug", "emoji", "section", "type")


class TournamentShortSerializer(serializers.ModelSerializer):
    score_type = serializers.SerializerMethodField(read_only=True)
    is_current_content_translated = serializers.SerializerMethodField(read_only=True)

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
            "meta_description",
            "is_ongoing",
            "user_permission",
            "created_at",
            "edited_at",
            "score_type",
            "default_permission",
            "visibility",
            "is_current_content_translated",
        )

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
            "meta_description",
            "edited_at",
            "visibility",
            "forecasts_flow_enabled",
        )


def serialize_project(obj: Project):
    match obj.type:
        case obj.ProjectTypes.TAG:
            serializer = TagSerializer
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
            serializer = TagSerializer

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


def serialize_project_index_weights(project: Project):
    """
    Serialize project index posts with weight mapping
    """

    from posts.serializers import serialize_post_many

    index_weights = []
    qs = project.index_questions.prefetch_related("question__related_posts")
    posts_map = {
        x["id"]: x
        for x in serialize_post_many(
            {x.question.get_post_id() for x in qs}, with_cp=True
        )
    }

    for project_question in qs:
        post = posts_map[project_question.question.get_post_id()]

        index_weights.append(
            {
                "post": post,
                "question_id": project_question.question_id,
                "weight": project_question.weight,
            }
        )

    return index_weights


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
