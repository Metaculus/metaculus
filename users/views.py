from datetime import timedelta

import numpy as np
import scipy
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers, status
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
    PasswordChangeSerializer,
    EmailChangeSerializer,
)
from .services import (
    get_users,
    user_unsubscribe_tags,
    send_email_change_confirmation_email,
    change_email_from_token,
)


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

    ser["nr_forecasts"] = Forecast.objects.filter(author=user).count()
    ser["nr_comments"] = Comment.objects.filter(author=user).count()
    values = []
    weights = []
    resolutions = []
    scores = []
    questions_predicted = []
    questions_predicted_socred = []
    all_score_objs = Score.objects.filter(
        user=user, score_type=Score.ScoreTypes.BASELINE
    ).all()

    question_score_map = {score.question_id: score for score in all_score_objs}

    for forecast in forecasts:
        question = forecast.question
        if question.id not in questions_predicted:
            questions_predicted.append(question.id)
            if score := question_score_map.get(question.id):
                scores.append(score.score)
                questions_predicted_socred.append(question.id)

        forecast_horizon_start = question.open_time.timestamp()
        actual_close_time = question.actual_close_time.timestamp()
        forecast_horizon_end = question.scheduled_close_time.timestamp()
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

    avg_score = np.average(scores)
    ser["avg_score"] = None if np.isnan(avg_score) else avg_score
    ser["questions_predicted_scored"] = len(questions_predicted_socred)
    ser["questions_predicted"] = len(questions_predicted)
    ser["question_authored"] = Post.objects.filter(
        author=user, notebook__isnull=True
    ).count()
    ser["notebooks_authored"] = Post.objects.filter(
        author=user, notebook__isnull=False
    ).count()
    ser["comments_authored"] = Comment.objects.filter(author=user).count()

    calibration_curve = []
    for p_min, p_max in [(x / 20, x / 20 + 0.05) for x in range(20)]:
        res = []
        ws = []
        bin_center = p_min + 0.05
        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                res.append(resolution)
                ws.append(weight)
        if res:
            user_middle_quartile = np.average(res, weights=ws)
        else:
            user_middle_quartile = None
        user_lower_quartile = scipy.stats.binom.ppf(
            0.05, max([len(res), 1]), bin_center
        ) / max([len(res), 1])
        user_upper_quartile = scipy.stats.binom.ppf(
            0.95, max([len(res), 1]), bin_center
        ) / max([len(res), 1])

        calibration_curve.append(
            {
                "user_lower_quartile": user_lower_quartile,
                "user_middle_quartile": user_middle_quartile,
                "user_upper_quartile": user_upper_quartile,
                "perfect_calibration": bin_center,
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

    ser["score_scatter_plot"] = []
    for score in all_score_objs:
        ser["score_scatter_plot"].append(
            {
                "score": score.score,
                "score_timestamp": score.created_at.timestamp(),
                "question_title": score.question.title,
                "question_resolution": score.question.resolution,
            }
        )
    ser["score_histogram"] = []
    if len(scores) > 0:
        min_bin = min(-50, min([s for s in scores]))
        max_bin = max(50, max([s for s in scores]))
        bin_incr = int((max_bin + np.abs(min_bin)) / 20)
        for bin_start in range(int(np.ceil(min_bin)), int(np.ceil(max_bin)), bin_incr):
            bin_end = bin_start + bin_incr
            ser["score_histogram"].append(
                {
                    "bin_start": bin_start,
                    "bin_end": bin_end,
                    "pct_scores": len(
                        [s for s in scores if s >= bin_start and s < bin_end]
                    )
                    / len(scores),
                }
            )
    return ser


@api_view(["GET"])
def current_user_api_view(request):
    """
    A lightweight profile data of the current user
    Should contain minimum profile data without heavy calcs
    """

    return Response(UserPrivateSerializer(request.user).data)


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

    unsubscribe_tags = serializer.validated_data.get("unsubscribed_mailing_tags")
    if unsubscribe_tags is not None:
        user_unsubscribe_tags(user, unsubscribe_tags)

    serializer.save()
    user.save()

    return Response(UserPrivateSerializer(user).data)


@api_view(["POST"])
def password_change_api_view(request):
    user = request.user

    serializer = PasswordChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    password = serializer.validated_data["password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(password):
        raise ValidationError({"password": "Current password is incorrect"})

    validate_password(new_password, user=user)

    user.set_password(new_password)
    user.save()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def email_change_api_view(request):
    user = request.user

    serializer = EmailChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    password = serializer.validated_data["password"]
    new_email = serializer.validated_data["email"]

    if not user.check_password(password):
        raise ValidationError({"password": "Invalid password"})

    send_email_change_confirmation_email(user, new_email)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def email_change_confirm_api_view(request):
    token = serializers.CharField().run_validation(request.data.get("token"))
    change_email_from_token(request.user, token)

    return Response(status=status.HTTP_204_NO_CONTENT)
