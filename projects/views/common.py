from django.http import HttpResponse
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from posts.models import Post
from posts.serializers import serialize_posts_many_forecast_flow
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers.common import (
    ProjectSerializer,
    TopicSerializer,
    CategorySerializer,
    TournamentSerializer,
    ProjectUserSerializer,
    NewsCategorySerialize,
    LeaderboardTagSerializer,
    serialize_index_data,
    serialize_tournaments_with_counts,
)
from projects.services.cache import get_projects_questions_count_cached
from projects.services.common import (
    get_projects_qs,
    get_project_permission_for_user,
    invite_user_to_project,
    get_site_main_project,
    get_project_timeline_data,
)
from projects.services.subscriptions import subscribe_project, unsubscribe_project
from questions.models import Question
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard
from users.services.common import get_users_by_usernames
from utils.csv_utils import export_data_for_questions
from utils.models import get_by_pk_or_slug
from utils.tasks import email_data_task
from utils.views import validate_data_request


@api_view(["GET"])
@permission_classes([AllowAny])
def topics_list_api_view(request: Request):
    qs = get_projects_qs(user=request.user).filter_topic().annotate_posts_count()

    data = [
        {**TopicSerializer(obj).data, "posts_count": obj.posts_count}
        for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def news_categories_list_api_view(request: Request):
    user = request.user if request.user.is_authenticated else None

    qs = (
        get_projects_qs(user=request.user).filter_news_category().annotate_posts_count()
    )

    if user:
        qs = qs.annotate_is_subscribed(user, include_members=False)

    data = [
        {
            **NewsCategorySerialize(obj).data,
            "posts_count": obj.posts_count,
            "is_subscribed": getattr(obj, "is_subscribed", False),
        }
        for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def categories_list_api_view(request: Request):
    qs = (
        get_projects_qs(user=request.user)
        .filter_category()
        .annotate_posts_count()
        .order_by("-posts_count")
    )

    data = [
        {**CategorySerializer(obj).data, "posts_count": obj.posts_count}
        for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def leaderboard_tags_list_api_view(request: Request):
    qs = get_projects_qs().filter_leaderboard_tags()

    return Response(LeaderboardTagSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def site_main_view(request: Request):
    site_main = get_site_main_project()
    return Response(TournamentSerializer(site_main).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournaments_list_api_view(request: Request):
    permission = serializers.ChoiceField(
        choices=ObjectPermission.choices, allow_null=True
    ).run_validation(request.query_params.get("permission"))
    show_on_homepage = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("show_on_homepage")
    )
    show_on_services_page = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("show_on_services_page")
    )

    qs = (
        get_projects_qs(
            user=request.user,
            permission=permission,
            show_on_homepage=show_on_homepage,
            show_on_services_page=show_on_services_page,
        )
        .exclude(visibility=Project.Visibility.UNLISTED)
        .filter_tournament()
        .prefetch_related("primary_leaderboard")
    )

    data = serialize_tournaments_with_counts(qs, sort_key=lambda x: x["questions_count"])
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def minibench_tournaments_api_view(request: Request):
    qs = (
        get_projects_qs(user=request.user)
        .filter_tournament()
        .filter(slug__icontains="minibench")
        .prefetch_related("primary_leaderboard")
    )

    data = serialize_tournaments_with_counts(qs, sort_key=lambda x: x["start_date"])
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournament_by_slug_api_view(request: Request, slug: str):
    qs = get_projects_qs(user=request.user).filter_tournament()
    obj: Project = get_by_pk_or_slug(qs, slug)

    # Get questions count using cached operation
    questions_count_map = get_projects_questions_count_cached([obj.id])

    data = TournamentSerializer(obj).data
    data["questions_count"] = questions_count_map.get(obj.id) or 0
    data["timeline"] = get_project_timeline_data(obj)
    data["forecasts_count"] = obj.forecasts_count
    data["forecasters_count"] = obj.forecasters_count
    data["followers_count"] = obj.followers_count

    if request.user.is_authenticated:
        data["is_subscribed"] = obj.subscriptions.filter(user=request.user).exists()

    if obj.index_id:
        data["index_data"] = serialize_index_data(obj.index)

    return Response(data)


@api_view(["GET"])
def tournament_forecast_flow_posts_api_view(request: Request, slug: str):
    tournament = get_by_pk_or_slug(
        get_projects_qs(user=request.user).filter_tournament(), slug
    )
    user = request.user

    posts = (
        Post.objects.filter_permission(user, permission=ObjectPermission.FORECASTER)
        .filter_projects(tournament)
        .filter_active()
        .filter_questions()
        .order_by("open_time")
    )

    return Response(serialize_posts_many_forecast_flow(posts, user))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def project_create_api_view(request: Request):
    serializer = ProjectSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    project: Project = serializer.save()
    if not project.primary_leaderboard:
        leaderboard = Leaderboard.objects.create(
            project=project,
            score_type=request.data.get(
                "leaderboard_score_type", LeaderboardScoreTypes.PEER_TOURNAMENT
            ),
        )
        project.primary_leaderboard = leaderboard
        project.save()
    elif project.primary_leaderboard:
        leaderboard = project.primary_leaderboard
        leaderboard.score_type = request.data.get(
            "leaderboard_score_type", LeaderboardScoreTypes.PEER_TOURNAMENT
        )
        leaderboard.save()
    project.update_and_maybe_translate()

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def project_delete_api_view(request: Request, project_id: int):
    qs = get_projects_qs(user=request.user)
    obj: Project = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_edit_project(permission, raise_exception=True)

    Question.objects.filter(related_posts__post__default_project=obj).delete()
    Post.objects.filter(default_project=obj).delete()
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PATCH"])
def project_update_api_view(request: Request, project_id: int):
    qs = get_projects_qs(user=request.user)
    obj = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_edit_project(permission, raise_exception=True)

    serializer = ProjectSerializer(
        obj,
        data=request.data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    project: Project = serializer.save()
    project.update_and_maybe_translate()

    return Response(serializer.data)


@api_view(["GET"])
def project_members_api_view(request: Request, project_id: int):
    qs = get_projects_qs(user=request.user)
    obj = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_manage_project_members(permission, raise_exception=True)

    return Response(
        ProjectUserSerializer(obj.projectuserpermission_set.all(), many=True).data
    )


@api_view(["POST"])
def project_members_invite_api_view(request: Request, project_id: int):
    qs = get_projects_qs(user=request.user)
    obj = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_manage_project_members(permission, raise_exception=True)

    usernames = serializers.ListField(child=serializers.CharField()).run_validation(
        request.data.get("usernames")
    )

    for user in get_users_by_usernames(usernames):
        invite_user_to_project(obj, user)

    return Response(status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def project_members_manage_api_view(request: Request, project_id: int, user_id: int):
    qs = get_projects_qs(user=request.user)
    obj = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_manage_project_members(permission, raise_exception=True)

    # Get project member
    member = get_object_or_404(obj.projectuserpermission_set.all(), user_id=user_id)

    if request.method == "DELETE":
        ObjectPermission.can_delete_project_member(
            permission, member, raise_exception=True
        )

        member.delete()
    elif request.method == "PATCH":
        # Check permissions
        ObjectPermission.can_edit_project_member_permission(
            permission, raise_exception=True
        )

        permission = serializers.ChoiceField(
            choices=ObjectPermission.choices
        ).run_validation(request.data.get("permission"))

        member.permission = permission
        member.save(update_fields=["permission"])

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def project_subscribe_api_view(request: Request, pk: str):
    qs = get_projects_qs(user=request.user)
    project = get_object_or_404(qs, pk=pk)

    subscribe_project(project=project, user=request.user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def project_unsubscribe_api_view(request: Request, pk: str):
    qs = get_projects_qs(user=request.user)
    project = get_object_or_404(qs, pk=pk)

    unsubscribe_project(project=project, user=request.user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_data(request: Request, project_id: int):
    validated_task_params = validate_data_request(request, project_id=project_id)
    email_data_task.send(**validated_task_params)
    return Response({"message": "Email scheduled to be sent"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_data(request, project_id: int):
    validated_data_params = validate_data_request(request, project_id=project_id)
    data = export_data_for_questions(**validated_data_params)

    filename = validated_data_params.get("filename", "data.zip")
    response = HttpResponse(
        data,
        content_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
    return response
