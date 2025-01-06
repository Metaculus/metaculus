import numpy as np
from django.db.models import Q
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_site_main_project
from projects.views import get_projects_qs, get_project_permission_for_user
from scoring.models import Leaderboard, LeaderboardEntry
from scoring.serializers import (
    LeaderboardSerializer,
    LeaderboardEntrySerializer,
    ContributionSerializer,
)
from scoring.utils import get_contributions
from users.models import User
from users.views import serialize_profile
from questions.models import AggregationMethod


@api_view(["GET"])
@permission_classes([AllowAny])
def global_leaderboard(
    request: Request,
):
    # params
    start_time = request.GET.get("startTime", None)
    end_time = request.GET.get("endTime", None)
    leaderboard_type = request.GET.get("leaderboardType", None)
    # filtering
    leaderboards = Leaderboard.objects.filter(project__visibility=Project.Visibility.NORMAL)
    if start_time:
        leaderboards = leaderboards.filter(start_time=start_time)
    if end_time:
        leaderboards = leaderboards.filter(end_time=end_time)
    if leaderboard_type:
        leaderboards = leaderboards.filter(score_type=leaderboard_type)
    leaderboard_count = leaderboards.count()
    if leaderboard_count == 0:
        return Response(status=status.HTTP_404_NOT_FOUND)
    leaderboard = leaderboards.first()
    # serialize
    leaderboard_data = LeaderboardSerializer(leaderboard).data

    user = request.user
    entries = leaderboard.entries.select_related("user").order_by("rank", "-score")
    entries = entries.filter(
        Q(medal__isnull=False)
        | Q(rank__lte=max(3, np.ceil(entries.exclude(excluded=True).count() * 0.05)))
        | Q(user_id=user.id)
    )

    if not user.is_staff:
        entries = entries.filter(
            Q(excluded=False) | Q(aggregation_method__isnull=False)
        )

    leaderboard_data["entries"] = LeaderboardEntrySerializer(entries, many=True).data
    # add user entry
    for entry in entries:
        if entry.user == user:
            leaderboard_data["userEntry"] = LeaderboardEntrySerializer(entry).data
            break
    return Response(leaderboard_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def project_leaderboard(
    request: Request,
    project_id: int,
):
    # params
    leaderboard_type = request.GET.get("leaderboardType", None)
    leaderboard_name = request.GET.get("leaderboardName", None)

    projects = get_projects_qs(user=request.user)
    project: Project = get_object_or_404(projects, pk=project_id)
    # Check permissions
    permission = get_project_permission_for_user(project, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # filtering
    leaderboards = Leaderboard.objects.filter(project=project)
    if leaderboard_name:
        leaderboards = leaderboards.filter(name=leaderboard_name)
    if leaderboard_type:
        leaderboards = leaderboards.filter(score_type=leaderboard_type)

    # get leaderboard and project
    leaderboard_count = leaderboards.count()
    if leaderboard_count == 0:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if leaderboard_count > 1:
        leaderboard = project.primary_leaderboard
        if not leaderboard:
            return Response(status=status.HTTP_404_NOT_FOUND)
    else:
        leaderboard = leaderboards.first()

    # serialize
    leaderboard_data = LeaderboardSerializer(leaderboard).data
    entries = leaderboard.entries.order_by("rank", "-score").select_related("user")
    user = request.user

    if not user.is_staff:
        entries = entries.filter(excluded=False)

    # manual annotations will be lost
    leaderboard_data["entries"] = LeaderboardEntrySerializer(entries, many=True).data
    # add user entry
    for entry in entries:
        if entry.user == user:
            leaderboard_data["userEntry"] = LeaderboardEntrySerializer(entry).data
            break
    return Response(leaderboard_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_medals(
    request: Request,
):
    user_id = request.GET.get("userId", None)
    if not user_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    entries_with_medals = LeaderboardEntry.objects.filter(
        user_id=user_id, medal__isnull=False
    ).select_related("leaderboard", "user")
    entries = []
    for entry in entries_with_medals:
        entry_data = LeaderboardEntrySerializer(entry).data
        leaderboard = LeaderboardSerializer(entry.leaderboard).data
        total_entries = entry.leaderboard.entries.filter(excluded=False).count()
        entries.append({**entry_data, **leaderboard, "total_entries": total_entries})
    return Response(entries)


@api_view(["GET"])
@permission_classes([AllowAny])
#@cache_page(60 * 30)
def medal_contributions(
    request: Request,
):
    user_id = request.GET.get("userId", None)
    user = get_object_or_404(User, pk=user_id)
    project_id = request.GET.get("projectId", get_site_main_project().id)

    projects = get_projects_qs(user=request.user)
    project: Project = get_object_or_404(projects, pk=project_id)
    # Check permissions
    permission = get_project_permission_for_user(project, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    start_time = request.GET.get("startTime", None)
    end_time = request.GET.get("endTime", None)
    leaderboard_type = request.GET.get("leaderboardType", None)
    leaderboard_name = request.GET.get("leaderboardName", None)

    leaderboards = Leaderboard.objects.filter(project=project)
    if start_time:
        leaderboards = leaderboards.filter(start_time=start_time)
    if end_time:
        leaderboards = leaderboards.filter(end_time=end_time)
    if leaderboard_type:
        leaderboards = leaderboards.filter(score_type=leaderboard_type)
    if leaderboard_name:
        leaderboards = leaderboards.filter(name=leaderboard_name)

    # get leaderboard and project
    leaderboard_count = leaderboards.count()
    if leaderboard_count == 0:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if leaderboard_count > 1:
        leaderboard = project.primary_leaderboard
        if not leaderboard:
            return Response(status=status.HTTP_404_NOT_FOUND)
    else:
        leaderboard = leaderboards.first()

    contributions = get_contributions(user, leaderboard)
    entries = leaderboard.entries.select_related("user").all()
    leaderboard_entry = next((e for e in entries if e.user == user), None)

    return_data = {
        "leaderboard_entry": LeaderboardEntrySerializer(leaderboard_entry).data,
        "contributions": ContributionSerializer(contributions, many=True).data,
        "leaderboard": LeaderboardSerializer(leaderboard).data,
        "user_id": user_id,
    }
    return Response(return_data)


@cache_page(60 * 60 * 24)
@api_view(["GET"])
@permission_classes([AllowAny])
def metaculus_track_record(
    request: Request,
):
    return Response(
        serialize_profile(aggregation_method=AggregationMethod.RECENCY_WEIGHTED)
    )
