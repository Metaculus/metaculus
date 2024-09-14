from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers import (
    TopicSerializer,
    CategorySerializer,
    TournamentSerializer,
    TagSerializer,
    ProjectUserSerializer,
    TournamentShortSerializer,
)
from projects.services import (
    get_projects_qs,
    get_project_permission_for_user,
    invite_user_to_project,
    subscribe_project,
    unsubscribe_project,
    update_with_add_posts_to_main_feed,
)
from users.services import get_users_by_usernames


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
    qs = get_projects_qs(user=request.user).filter_tags().annotate_posts_count()
    search_query = serializers.CharField(allow_null=True, min_length=3).run_validation(
        request.query_params.get("search")
    )

    if search_query:
        qs = qs.filter(name__icontains=search_query)
    else:
        qs = qs.order_by("-posts_count")

    qs = qs[0:1000]

    data = [
        {**TagSerializer(obj).data, "posts_count": obj.posts_count} for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def site_main_view(request: Request):
    site_main = Project.objects.get(type=Project.ProjectTypes.SITE_MAIN)
    return Response(TournamentSerializer(site_main).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournaments_list_api_view(request: Request):
    permission = serializers.ChoiceField(
        choices=ObjectPermission.choices, allow_null=True
    ).run_validation(request.query_params.get("permission"))

    qs = (
        get_projects_qs(user=request.user, permission=permission)
        .filter_tournament()
        .annotate_posts_count()
        .order_by("-posts_count")
        .defer("description")
        .prefetch_related("primary_leaderboard")
    )

    data = []

    for obj in qs.all():
        serialized_tournament = TournamentShortSerializer(obj).data
        serialized_tournament["posts_count"] = obj.posts_count

        data.append(serialized_tournament)

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournament_by_slug_api_view(request: Request, slug: str):
    qs = get_projects_qs(user=request.user).filter_tournament().annotate_posts_count()

    try:
        pk = int(slug)
        obj = get_object_or_404(qs, pk=pk)
    except Exception:
        obj = get_object_or_404(qs, slug=slug)

    data = TournamentSerializer(obj).data
    data["posts_count"] = obj.posts_count

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
def toggle_add_posts_to_main_feed_api_view(request: Request, project_id: int):
    project = get_object_or_404(Project, pk=project_id)

    if not request.user.is_superuser:
        raise PermissionDenied("You do not have permission to toggle this flag")

    update_with_add_posts_to_main_feed(project, not project.add_posts_to_main_feed)

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
