from collections import Counter
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from scoring.models import Leaderboard, LeaderboardEntry

from .models import User
from .serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
    UserFilterSerializer,
)
from .services import get_users


@api_view(["GET"])
def current_user_api_view(request):
    return Response(UserPrivateSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_profile_api_view(request, pk: int):
    qs = User.objects.all()
    user = get_object_or_404(qs, pk=pk)
    ser = UserPublicSerializer(user).data

    # Medals
    entries_with_medals = LeaderboardEntry.objects.filter(
        user_id=user.pk, medal__isnull=False
    )
    ser["tournament_medals"] = dict(
        Counter(
            [
                x.medal
                for x in entries_with_medals.filter(
                    leaderboard__project__type=Project.ProjectTypes.TOURNAMENT
                )
            ]
        ).most_common(100)
    )
    ser["peer_score_medals"] = dict(
        Counter(
            [
                x.medal
                for x in entries_with_medals.filter(
                    leaderboard__project__type=Project.ProjectTypes.SITE_MAIN,
                    leaderboard__score_type=Leaderboard.ScoreTypes.PEER_GLOBAL,
                )
            ]
        ).most_common(100)
    )
    ser["baseline_medals"] = dict(
        Counter(
            [
                x.medal
                for x in entries_with_medals.filter(
                    leaderboard__project__type=Project.ProjectTypes.SITE_MAIN,
                    leaderboard__score_type=Leaderboard.ScoreTypes.BASELINE_GLOBAL,
                )
            ]
        ).most_common(100)
    )
    ser["comment_insight_medals"] = dict(
        Counter(
            [
                x.medal
                for x in entries_with_medals.filter(
                    leaderboard__project__type=Project.ProjectTypes.SITE_MAIN,
                    leaderboard__score_type=Leaderboard.ScoreTypes.COMMENT_INSIGHT,
                )
            ]
        ).most_common(100)
    )
    ser["question_writing_medals"] = dict(
        Counter(
            [
                x.medal
                for x in entries_with_medals.filter(
                    leaderboard__project__type=Project.ProjectTypes.SITE_MAIN,
                    leaderboard__score_type=Leaderboard.ScoreTypes.QUESTION_WRITING,
                )
            ]
        ).most_common(100)
    )

    ser["calibration_curve"] = [
        {
            "y_real": 0.25,
            "y_perfect": 0.2,
            "y_perfect_ci": [0.05, 0.35],
        },
            {
            "y_real": 0.4,
            "y_perfect": 0.4,
            "y_perfect_ci": [0.2, 0.55],
        },
        {
            "y_real": 0.6,
            "y_perfect": 0.6,
            "y_perfect_ci": [0.4, 0.7],
        },
        {
            "y_real": 0.85,
            "y_perfect": 0.8,
            "y_perfect_ci": [0.5, 0.9],
        },
        {
            "y_real": 0.88,
            "y_perfect": 1,
            "y_perfect_ci": [0.8, 1],
        },
    ]
    ser["score_histogram"] = [
        {"x_start": 0, "x_end": 0.2, "y": 0.7},
        {"x_start": 0.2, "x_end": 0.4, "y": 0.1},
        {"x_start": 0.4, "x_end": 0.6, "y": 0.05},
        {"x_start": 0.6, "x_end": 0.8, "y": 0.03},
        {"x_start": 0.8, "x_end": 1, "y": 0.02},
    ]
    return Response(ser)


@api_view(["GET"])
@permission_classes([AllowAny])
def users_list_api_view(request):
    paginator = LimitOffsetPagination()

    # Apply filtering
    filters_serializer = UserFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_users(**filters_serializer.validated_data)

    # Paginating queryset
    qs = paginator.paginate_queryset(qs, request)

    return paginator.get_paginated_response(UserPublicSerializer(qs, many=True).data)


@api_view(["POST"])
def change_username_api_view(request: Request):
    user = request.user
    username = serializers.CharField().run_validation(request.data.get("username"))
    username = validate_username(username)

    if old_usernames := user.get_old_usernames():
        _, change_date = old_usernames[0]

        if (timezone.now() - change_date) < timedelta(days=180):
            raise ValidationError("can only change username once every 180 days")

    user.update_username(username)
    user.save()

    return Response(UserPrivateSerializer(user).data)


@api_view(["PATCH"])
def update_profile_api_view(request: Request):
    user = request.user
    serializer = UserUpdateProfileSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    if "bio" in serializer.validated_data:
        user.bio = serializer.validated_data["bio"]

    if "website" in serializer.validated_data:
        user.website = serializer.validated_data["website"]

    user.save()

    return Response(UserPrivateSerializer(user).data)
