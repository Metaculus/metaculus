from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from projects.views import get_projects_qs, get_project_permission_for_user
from projects.permissions import ObjectPermission

from scoring.models import Leaderboard
from scoring.serializers import LeaderboardSerializer, LeaderboardEntrySerializer
from scoring.utils import generate_project_leaderboard


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
    leaderboards = Leaderboard.objects.filter(project_id=1)
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
    entries = list(leaderboard.entries.all())
    if len(entries) == 0:
        entries = generate_project_leaderboard(leaderboard.project, leaderboard)
    leaderboard_data["entries"] = LeaderboardEntrySerializer(entries, many=True).data
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
    entries = list(leaderboard.entries.all())
    if len(entries) == 0:
        entries = generate_project_leaderboard(project, leaderboard)
    leaderboard_data["entries"] = LeaderboardEntrySerializer(entries, many=True).data
    return Response(leaderboard_data)
