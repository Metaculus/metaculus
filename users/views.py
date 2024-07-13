from collections import Counter
from datetime import timedelta
import numpy as np

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
from questions.models import Forecast
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
from utils.the_math.measures import weighted_percentile_2d


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
        user=user, medal__isnull=False
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

    forecasts = Forecast.objects.filter(
        author=user,
        question__type="binary",
        question__resolution__in=["no", "yes"],
    )
    values = []
    weights = []
    resolutions = []
    for forecast in forecasts:
        question = forecast.question
        forecast_horizon_start = question.open_time.timestamp()
        actual_close_time = question.forecast_scoring_ends.timestamp()
        forecast_horizon_end = question.actual_close_time.timestamp()
        forecast_start = max(forecast_horizon_start, forecast.start_time.timestamp())
        if forecast.end_time:
            forecast_end = min(actual_close_time, forecast.end_time.timestamp())
        else:
            forecast_end = actual_close_time
        forecast_duration = forecast_end - forecast_start
        question_duration = forecast_horizon_end - forecast_horizon_start
        weight = forecast_duration / question_duration
        values.append(forecast.probability_yes)
        weights.append(weight)
        resolutions.append(int(question.resolution == "yes"))

    calibration_curve = []
    for p_min, p_max in [(x / 20, x / 20 + 0.05) for x in range(20)]:
        res = []
        ws = []
        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                res.append(resolution)
                ws.append(weight)
        if res:
            user_lower_quartile = None
            user_middle_quartile = np.average(res, weights=ws)
            user_upper_quartile = None
        else:
            user_lower_quartile = user_middle_quartile = user_upper_quartile = None
        calibration_curve.append(
            {
                "user_lower_quartile": user_lower_quartile,
                "user_middle_quartile": user_middle_quartile,
                "user_upper_quartile": user_upper_quartile,
                "perfect_calibration": p_min + 0.1,
            }
        )

    ser["calibration_curve"] = calibration_curve
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
