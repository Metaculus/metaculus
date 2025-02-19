from django.db.models import Q
from django.http import HttpResponse
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from misc.models import WhitelistUser
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers.common import (
    DownloadDataSerializer,
    TopicSerializer,
    CategorySerializer,
    TournamentSerializer,
    TagSerializer,
    ProjectUserSerializer,
    TournamentShortSerializer,
    NewsCategorySerialize,
)
from projects.services.common import (
    get_projects_qs,
    get_project_permission_for_user,
    invite_user_to_project,
    subscribe_project,
    unsubscribe_project,
    get_site_main_project,
)
from questions.models import Question
from users.services.common import get_users_by_usernames
from utils.cache import cache_get_or_set
from utils.csv_utils import export_data_for_questions


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
def tags_list_api_view(request: Request):
    search_query = serializers.CharField(allow_null=True, min_length=3).run_validation(
        request.query_params.get("search")
    )

    def f():
        qs = get_projects_qs().filter_tags().annotate_posts_count()

        if search_query:
            qs = qs.filter(name__icontains=search_query)
        else:
            qs = qs.order_by("-posts_count")

        qs = qs[0:1000]

        return [
            {**TagSerializer(obj).data, "posts_count": obj.posts_count}
            for obj in qs.all()
        ]

    data = (
        f()
        if search_query
        else cache_get_or_set("tags_list_api_view", f, timeout=3600 * 6)
    )

    return Response(data)


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

    qs = (
        get_projects_qs(
            user=request.user,
            permission=permission,
            show_on_homepage=show_on_homepage,
        )
        .exclude(visibility=Project.Visibility.UNLISTED)
        .filter_tournament()
        .annotate_questions_count()
        .order_by("-questions_count")
        .defer("description")
        .prefetch_related("primary_leaderboard")
    )

    data = []

    for obj in qs.all():
        serialized_tournament = TournamentShortSerializer(obj).data
        serialized_tournament["questions_count"] = obj.questions_count

        data.append(serialized_tournament)

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournament_by_slug_api_view(request: Request, slug: str):
    qs = (
        get_projects_qs(user=request.user)
        .filter_tournament()
        .annotate_questions_count()
    )

    try:
        pk = int(slug)
        obj = get_object_or_404(qs, pk=pk)
    except Exception:
        obj = get_object_or_404(qs, slug=slug)

    data = TournamentSerializer(obj).data
    data["questions_count"] = getattr(obj, "questions_count", None)

    if request.user.is_authenticated:
        data["is_subscribed"] = obj.subscriptions.filter(user=request.user).exists()

    return Response(data)


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_data(request, project_id: int):
    user = request.user
    qs = get_projects_qs(user=user)
    obj = get_object_or_404(qs, pk=project_id)
    # Check permissions
    if not (
        user.is_authenticated
        and user.is_staff
        or WhitelistUser.objects.filter(
            Q(project=obj) | (Q(post__isnull=True) & Q(project__isnull=True)),
            user=user,
        ).exists()
    ):
        raise PermissionDenied("You are not allowed to download this project")

    serializer = DownloadDataSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    params = serializer.validated_data
    include_comments = params.get("include_comments", False)
    include_scores = params.get("include_scores", False)
    # TODO: consider adding support for other params supported by post download_data

    questions = Question.objects.filter(
        Q(related_posts__post__default_project=obj)
        | Q(related_posts__post__projects=obj)
    ).distinct()

    data = export_data_for_questions(
        questions=questions,
        include_user_forecasts=True,
        include_comments=include_comments,
        include_scores=include_scores,
    )

    filename = "_".join(obj.name.split(" "))
    response = HttpResponse(
        data,
        content_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}.zip"},
    )
    return response
