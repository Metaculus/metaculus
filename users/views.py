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

from comments.models import Comment
from posts.models import Post
from questions.models import Forecast
from scoring.models import Score
from .models import User
from .serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
    UserFilterSerializer,
)
from .services import get_users


def get_serialized_user(request, user, Serializer):
    ser = Serializer(user).data

    forecasts = (
        Forecast.objects.filter(
            author=user,
            question__type="binary",
            question__resolution__in=["no", "yes"],
        )
        .prefetch_related("question")
        .all()
    )

    ser["nr_forecasts"] = len(forecasts)
    ser["nr_comments"] = Comment.objects.filter(author=user).count()
    values = []
    weights = []
    resolutions = []
    scores = []
    questions_predicted = []
    questions_predicted_socred = []
    for forecast in forecasts:
        question = forecast.question
        if question.id not in questions_predicted:
            questions_predicted.append(question.id)
            score = Score.objects.filter(user=user, question=question).first()
            if score:
                scores.append(score.score)
                questions_predicted_socred.append(question.id)

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

    ser["avg_score"] = np.average(scores)
    ser["questions_predicted_scored"] = len(questions_predicted_socred)
    ser["questions_predicted"] = len(questions_predicted)
    ser["question_authored"] = Post.objects.filter(author=user, notebook__isnull=True).count()
    ser["notebooks_authored"] = Post.objects.filter(author=user, notebook__isnull=False).count()
    ser["comments_authored"] = Comment.objects.filter(author=user).count()

    calibration_curve = []
    for p_min, p_max in [(x / 20, x / 20 + 0.05) for x in range(20)]:
        res = []
        ws = []
        user_lower_quartile = max(p_min, 0)
        user_upper_quartile = min(p_min + 0.1, 1)

        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                res.append(resolution)
                ws.append(weight)
        if res:
            user_middle_quartile = np.average(res, weights=ws)
        else:
            user_middle_quartile = None
        print(p_min + 0.05)
        calibration_curve.append(
            {
                "user_lower_quartile": user_lower_quartile,
                "user_middle_quartile": user_middle_quartile,
                "user_upper_quartile": user_upper_quartile,
                "perfect_calibration": p_min + 0.05,
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
    return ser


@api_view(["GET"])
def current_user_api_view(request):
    return Response(get_serialized_user(request, request.user, UserPrivateSerializer))


@api_view(["GET"])
@permission_classes([AllowAny])
def user_profile_api_view(request, pk: int):
    qs = User.objects.all()
    user = get_object_or_404(qs, pk=pk)
    return Response(get_serialized_user(request, user, UserPublicSerializer))


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
    serializer = UserUpdateProfileSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    serializer.save()
    user.save()

    return Response(UserPrivateSerializer(user).data)
