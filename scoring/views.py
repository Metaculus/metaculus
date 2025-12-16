import numpy as np
from django.db.models import Q, Count
from django.views.decorators.cache import cache_page
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_site_main_project
from projects.views import get_projects_qs, get_project_permission_for_user
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry, LeaderboardsRanksEntry
from scoring.serializers import (
    LeaderboardSerializer,
    LeaderboardEntrySerializer,
    ContributionSerializer,
    GetLeaderboardSerializer,
)
from scoring.utils import get_contributions, update_project_leaderboard
from users.models import User
from users.services.profile_stats import serialize_metaculus_stats


@api_view(["GET"])
@permission_classes([AllowAny])
def global_leaderboard_view(
    request: Request,
):
    serializer = GetLeaderboardSerializer(data=request.GET)
    serializer.is_valid(raise_exception=True)
    name = serializer.validated_data.get("name")
    score_type = serializer.validated_data.get("score_type")
    start_time = serializer.validated_data.get("start_time")
    end_time = serializer.validated_data.get("end_time")

    # filtering
    leaderboards = Leaderboard.objects.filter(
        project__type=Project.ProjectTypes.SITE_MAIN
    )
    if name:
        leaderboards = leaderboards.filter(name=name)
    if start_time:
        leaderboards = leaderboards.filter(start_time=start_time)
    if end_time:
        leaderboards = leaderboards.filter(end_time=end_time)
    if score_type:
        leaderboards = leaderboards.filter(score_type=score_type)
    leaderboard_count = leaderboards.count()
    if leaderboard_count == 0:
        return Response(status=status.HTTP_404_NOT_FOUND)
    leaderboard = leaderboards.first()
    # serialize
    leaderboard_data = LeaderboardSerializer(leaderboard).data

    user = request.user
    entries = leaderboard.entries.select_related("user").order_by("rank", "-score")
    if leaderboard.score_type != LeaderboardScoreTypes.MANUAL:
        entries = entries.filter(
            Q(medal__isnull=False)
            | Q(
                rank__lte=max(3, np.ceil(entries.exclude(excluded=True).count() * 0.05))
            )
            | Q(user_id=user.id)
        )

    if not user.is_staff:
        bot_status: Project.BotLeaderboardStatus = leaderboard.bot_status or (
            leaderboard.project.bot_leaderboard_status
            if leaderboard.project
            else Project.BotLeaderboardStatus.EXCLUDE_AND_SHOW
        )
        if bot_status == Project.BotLeaderboardStatus.EXCLUDE_AND_SHOW:
            entries = entries.filter(
                Q(excluded=False)
                | Q(aggregation_method__isnull=False)
                | Q(user__is_bot=True)
            )
        else:
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
def project_leaderboard_view(
    request: Request,
    project_id: int,
):
    serializer = GetLeaderboardSerializer(data=request.GET)
    serializer.is_valid(raise_exception=True)
    score_type = serializer.validated_data.get("score_type")
    name = serializer.validated_data.get("name")
    primary = serializer.validated_data.get("primary", True)

    projects = get_projects_qs(user=request.user)
    project: Project = get_object_or_404(projects, pk=project_id)
    # Check permissions
    permission = get_project_permission_for_user(project, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    if primary:
        # get the primary leaderboard
        leaderboard = project.primary_leaderboard
        if leaderboard is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
    else:
        # get the leaderboard through params (may return primary leaderboard)
        leaderboards = Leaderboard.objects.filter(project=project)
        if name:
            leaderboards = leaderboards.filter(name=name)
        if score_type:
            leaderboards = leaderboards.filter(score_type=score_type)

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
    leaderboard_data = LeaderboardSerializer(
        leaderboard, context={"include_max_coverage": True}
    ).data
    entries = leaderboard.entries.order_by("rank", "-score").select_related("user")
    user = request.user

    # manual annotations will be lost
    leaderboard_data["entries"] = LeaderboardEntrySerializer(entries, many=True).data
    # add user entry
    for entry in entries:
        if entry.user == user:
            leaderboard_data["userEntry"] = LeaderboardEntrySerializer(entry).data
            break
    return Response(leaderboard_data)


@api_view(["POST"])
def update_project_leaderboard_api_view(request: Request, project_id: int):
    qs = get_projects_qs(user=request.user)
    obj = get_object_or_404(qs, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(obj, user=request.user)
    ObjectPermission.can_edit_project(permission, raise_exception=True)

    leaderboard_id = serializers.IntegerField(
        allow_null=True, required=False
    ).run_validation(request.data.get("leaderboard_id"))
    leaderboard = (
        get_object_or_404(Leaderboard.objects.all(), pk=leaderboard_id)
        if leaderboard_id
        else None
    )
    force_update = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("force_update")
    )
    force_finalize = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("force_finalize")
    )
    update_project_leaderboard(
        project=obj,
        leaderboard=leaderboard,
        force_update=force_update,
        force_finalize=force_finalize,
    )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_medal_ranks(
    request: Request,
):
    user_id = request.GET.get("userId", None)
    if not user_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    # Validate userId is a valid integer
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return Response(
            {"error": "userId must be a valid integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ranks_qs = LeaderboardsRanksEntry.objects.filter(user=user_id)
    ranks = []
    for entry in ranks_qs:
        data = {
            "rank": entry.rank,
            "rank_total": entry.rank_total,
            "best_rank": entry.best_rank,
            "best_rank_total": entry.best_rank_total,
            "type": entry.rank_type,
        }
        ranks.append(data)

    return Response(ranks)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_medals(
    request: Request,
):
    user_id = request.GET.get("userId", None)
    if not user_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    # Validate userId is a valid integer
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return Response(
            {"error": "userId must be a valid integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entries_with_medals = LeaderboardEntry.objects.filter(
        user_id=user_id,
        medal__isnull=False,
        leaderboard__project__default_permission=ObjectPermission.FORECASTER,
    ).select_related("leaderboard__project", "user")

    # Fetch counts of non-excluded entries for each leaderboard and create a mapping
    leaderboard_entries_mapping = {
        x["leaderboard_id"]: x["total_entries"]
        for x in (
            LeaderboardEntry.objects.filter(
                leaderboard_id__in=[
                    entry.leaderboard_id for entry in entries_with_medals
                ],
                excluded=False,
            )
            .values("leaderboard_id")
            .annotate(total_entries=Count("id"))
        )
    }

    entries = []
    for entry in entries_with_medals:
        entry_data = LeaderboardEntrySerializer(entry).data
        leaderboard = LeaderboardSerializer(entry.leaderboard).data
        entries.append(
            {
                **entry_data,
                **leaderboard,
                "total_entries": leaderboard_entries_mapping.get(
                    entry.leaderboard_id, 0
                ),
            }
        )
    return Response(entries)


@cache_page(60 * 30)
@api_view(["GET"])
@permission_classes([AllowAny])
def medal_contributions(
    request: Request,
):
    serializer = GetLeaderboardSerializer(data=request.GET)
    serializer.is_valid(raise_exception=True)

    user_id = serializer.validated_data.get("for_user")
    user = get_object_or_404(User, pk=user_id)

    project_id = serializer.validated_data.get("project")
    project_id = project_id or get_site_main_project().id
    projects = get_projects_qs(user=request.user)
    project: Project = get_object_or_404(projects, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(project, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    start_time = serializer.validated_data.get("start_time")
    end_time = serializer.validated_data.get("end_time")
    score_type = serializer.validated_data.get("score_type")
    name = serializer.validated_data.get("name")
    primary = serializer.validated_data.get("primary", True)

    if primary:
        # get the primary leaderboard
        leaderboard = project.primary_leaderboard
        if leaderboard is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
    else:
        # get the leaderboard through params (may return primary leaderboard)
        leaderboards = Leaderboard.objects.filter(project=project)
        if start_time:
            leaderboards = leaderboards.filter(start_time=start_time)
        if end_time:
            leaderboards = leaderboards.filter(end_time=end_time)
        if score_type:
            leaderboards = leaderboards.filter(score_type=score_type)
        if name:
            leaderboards = leaderboards.filter(name=name)

        # get leaderboard and project
        leaderboard_count = leaderboards.count()
        if leaderboard_count == 0:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if leaderboard_count > 1:
            leaderboard = project.primary_leaderboard
            if not leaderboard:
                raise NotFound()
        else:
            leaderboard = leaderboards.first()

    with_live_coverage = leaderboard.score_type in [
        LeaderboardScoreTypes.PEER_TOURNAMENT,
        LeaderboardScoreTypes.SPOT_PEER_TOURNAMENT,
        LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT,
        LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT,
        LeaderboardScoreTypes.MANUAL,
    ]
    contributions = get_contributions(
        user,
        leaderboard,
        with_live_coverage,
    )
    leaderboard_entry = leaderboard.entries.filter(user=user).first()

    return_data = {
        "leaderboard_entry": LeaderboardEntrySerializer(leaderboard_entry).data,
        "contributions": ContributionSerializer(contributions, many=True).data,
        "leaderboard": LeaderboardSerializer(leaderboard).data,
        "user_id": user_id,
    }
    return Response(return_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def metaculus_track_record(
    request: Request,
):
    return Response(serialize_metaculus_stats())
