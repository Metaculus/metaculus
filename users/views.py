from datetime import timedelta

import numpy as np
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
from scipy.stats import binom

from comments.models import Comment
from posts.models import Post
from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.models import Score
from users.models import User
from users.serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
    UserFilterSerializer,
    PasswordChangeSerializer,
    EmailChangeSerializer,
)
from users.services import (
    get_users,
    user_unsubscribe_tags,
    send_email_change_confirmation_email,
    change_email_from_token,
)


def get_score_scatter_plot_data(
    scores: list[Score] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: Score.ScoreTypes | None = None,
) -> dict:
    """must provide either
    1) scores
    2) either user or aggregation_method and optionally a score_type
    """
    # set up
    if scores is None:
        if (user is None and aggregation_method is None) or (
            user is not None and aggregation_method is not None
        ):
            raise ValueError("Either user or aggregation_method must be provided only")
        if user is not None and score_type is None:
            score_type = Score.ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = Score.ScoreTypes.BASELINE
        public_questions = Question.objects.filter_public()
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    scores = sorted(scores, key=lambda s: s.edited_at)
    score_scatter_plot = []
    for score in scores:
        score_scatter_plot.append(
            {
                "score": score.score,
                "score_timestamp": score.edited_at.timestamp(),
                "question_title": score.question.title,
                "question_id": score.question.id,
                "question_resolution": score.question.resolution,
            }
        )

    return {
        "score_scatter_plot": score_scatter_plot,
    }


def get_score_histogram_data(
    scores: list[Score] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: Score.ScoreTypes | None = None,
) -> dict:
    """must provide either
    1) scores
    2) either user or aggregation_method and optionally a score_type
    """
    # set up
    if scores is None:
        if (user is None and aggregation_method is None) or (
            user is not None and aggregation_method is not None
        ):
            raise ValueError("Either user or aggregation_method must be provided only")
        if user is not None and score_type is None:
            score_type = Score.ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = Score.ScoreTypes.BASELINE
        public_questions = Question.objects.filter_public()
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    score_histogram = []
    if len(scores) > 0:
        min_bin = min(-50, min(s.score for s in scores))
        max_bin = max(50, max(s.score for s in scores))
        bin_incr = int((max_bin + np.abs(min_bin)) / 20)
        for bin_start in range(int(np.ceil(min_bin)), int(np.ceil(max_bin)), bin_incr):
            bin_end = bin_start + bin_incr
            score_histogram.append(
                {
                    "bin_start": bin_start,
                    "bin_end": bin_end,
                    "score_count": len(
                        [
                            s.score
                            for s in scores
                            if s.score >= bin_start and s.score < bin_end
                        ]
                    ),
                }
            )

    return {
        "score_histogram": score_histogram,
    }


def get_calibration_curve_data(
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
) -> dict:
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    public_questions = Question.objects.filter_public()
    if user is not None:
        forecasts = Forecast.objects.filter(
            question__in=public_questions,
            question__type="binary",
            question__resolution__in=["no", "yes"],
            author=user,
        ).prefetch_related("question")
    else:
        forecasts = AggregateForecast.objects.filter(
            question__in=public_questions,
            question__type="binary",
            question__resolution__in=["no", "yes"],
        ).prefetch_related("question")

    values = []
    weights = []
    resolutions = []

    for forecast in forecasts:
        question = forecast.question
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

        if isinstance(forecast, Forecast):
            values.append(forecast.probability_yes)
        else:
            values.append(forecast.forecast_values[1])

        weights.append(weight)
        resolutions.append(int(question.resolution == "yes"))

    calibration_curve = []
    for p_min, p_max in [
        (0.0, 0.025),
        (0.025, 0.075),
        (0.075, 0.125),
        (0.125, 0.175),
        (0.175, 0.225),
        (0.225, 0.275),
        (0.275, 0.325),
        (0.325, 0.375),
        (0.375, 0.425),
        (0.425, 0.475),
        (0.475, 0.525),
        (0.525, 0.575),
        (0.575, 0.625),
        (0.625, 0.675),
        (0.675, 0.725),
        (0.725, 0.775),
        (0.775, 0.825),
        (0.825, 0.875),
        (0.875, 0.925),
        (0.925, 0.975),
        (0.975, 1.0),
    ]:
        res = []
        ws = []
        bin_center = p_min + 0.025
        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                res.append(resolution)
                ws.append(weight)
        middle_quartile = np.average(res, weights=ws) if res else None
        lower_quartile = binom.ppf(0.05, max([len(res), 1]), bin_center) / max(
            [len(res), 1]
        )
        perfect_calibration = binom.ppf(0.50, max([len(res), 1]), bin_center) / max(
            [len(res), 1]
        )
        upper_quartile = binom.ppf(0.95, max([len(res), 1]), bin_center) / max(
            [len(res), 1]
        )

        calibration_curve.append(
            {
                "lower_quartile": lower_quartile,
                "middle_quartile": middle_quartile,
                "upper_quartile": upper_quartile,
                "perfect_calibration": perfect_calibration,
            }
        )

    return {
        "calibration_curve": calibration_curve,
    }


def get_forecasting_stats_data(
    scores: list[Score] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: Score.ScoreTypes | None = None,
) -> dict:
    # set up
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    if user is not None and score_type is None:
        score_type = Score.ScoreTypes.PEER
    if aggregation_method is not None and score_type is None:
        score_type = Score.ScoreTypes.BASELINE
    public_questions = Question.objects.filter_public()
    if scores is None:
        # TODO: support archived scores
        score_qs = Score.objects.filter(
            question__in=public_questions,
            score_type=score_type,
        )
        if user is not None:
            score_qs = score_qs.filter(user=user)
        else:
            score_qs = score_qs.filter(aggregation_method=aggregation_method)
        scores = list(score_qs)

    average_score = np.average([score.score for score in scores])
    if np.isnan(average_score):
        average_score = None
    forecasts = Forecast.objects.filter(question__in=public_questions)
    if user is not None:
        forecasts = forecasts.filter(author=user)
    forecasts_count = forecasts.count()
    questions_predicted_count = forecasts.values("question").distinct().count()
    score_count = len(scores)

    return {
        "average_score": average_score,
        "forecasts_count": forecasts_count,
        "questions_predicted_count": questions_predicted_count,
        "score_count": score_count,
    }


def get_authoring_stats_data(
    user: User,
) -> dict:
    posts_authored = Post.objects.filter_public().filter(
        author=user, notebook__isnull=True
    )
    posts_authored_count = posts_authored.count()
    forecasts_on_authored_questions_count = Forecast.objects.filter(
        post__in=posts_authored
    ).count()
    notebooks_authored_count = (
        Post.objects.filter_public().filter(author=user, notebook__isnull=False).count()
    )
    comment_count = Comment.objects.filter(
        author=user, on_post__in=Post.objects.filter_public()
    ).count()

    return {
        "posts_authored_count": posts_authored_count,
        "forecasts_on_authored_questions_count": forecasts_on_authored_questions_count,
        "notebooks_authored_count": notebooks_authored_count,
        "comments_count": comment_count,
    }


def get_user_profile_data(
    user: User,
) -> dict:
    return UserPublicSerializer(user).data


def serialize_profile(
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: Score.ScoreTypes | None = None,
) -> dict:
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    if user is not None and score_type is None:
        score_type = Score.ScoreTypes.PEER
    if aggregation_method is not None and score_type is None:
        score_type = Score.ScoreTypes.BASELINE
    public_questions = Question.objects.filter_public()
    # TODO: support archived scores
    score_qs = Score.objects.filter(
        question__in=public_questions,
        score_type=score_type,
    )
    if user is not None:
        score_qs = score_qs.filter(user=user)
    else:
        score_qs = score_qs.filter(aggregation_method=aggregation_method)
    scores = list(score_qs.select_related("question"))
    data = {}
    data.update(
        get_score_scatter_plot_data(
            scores=scores, user=user, aggregation_method=aggregation_method
        )
    )
    data.update(
        get_score_histogram_data(
            scores=scores, user=user, aggregation_method=aggregation_method
        )
    )
    data.update(get_calibration_curve_data(user, aggregation_method))
    data.update(
        get_forecasting_stats_data(
            scores=scores, user=user, aggregation_method=aggregation_method
        )
    )
    if user is not None:
        data.update(get_user_profile_data(user))
        data.update(get_authoring_stats_data(user))
    return data


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
    return Response(serialize_profile(user))


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
