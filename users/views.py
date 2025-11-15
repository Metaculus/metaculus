import logging
from datetime import timedelta

import numpy as np
from django.contrib.auth.password_validation import validate_password
from django.db.models import Sum, Q, F
from django.utils import timezone
from django.views.decorators.cache import cache_page
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from scipy.stats import binom

from comments.models import Comment
from posts.models import Post
from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.models import Score
from users.models import User, UserSpamActivity
from users.serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
    UserFilterSerializer,
    PasswordChangeSerializer,
    EmailChangeSerializer,
    UserCampaignRegistrationSerializer,
)
from users.services.common import (
    get_users,
    user_unsubscribe_tags,
    send_email_change_confirmation_email,
    change_email_from_token,
    register_user_to_campaign,
)
from utils.paginator import LimitOffsetPagination
from utils.tasks import email_user_their_data_task

from .services.profile_stats import generate_question_scores, QuestionScore
from .services.spam_detection import (
    check_profile_update_for_spam,
    send_deactivation_email,
)

logger = logging.getLogger(__name__)


def get_score_scatter_plot_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
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
            score_type = ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = ScoreTypes.BASELINE
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
                "question_title": score.question_title,
                "post_id": score.post_id,
                "question_resolution": score.question_resolution,
            }
        )

    return {
        "score_scatter_plot": score_scatter_plot,
    }


def get_score_histogram_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
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
            score_type = ScoreTypes.PEER
        if aggregation_method is not None and score_type is None:
            score_type = ScoreTypes.BASELINE
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

    five_years_ago = timezone.now() - timedelta(days=365 * 5)
    public_questions_in_past = Question.objects.filter_public().filter(
        actual_resolve_time__gte=five_years_ago,
    )

    if user is not None:
        forecasts = Forecast.objects.filter(
            post__default_project__default_permission__isnull=False,
            question__actual_resolve_time__gte=five_years_ago,
            question__type="binary",
            question__resolution__in=["no", "yes"],
            question__scheduled_resolve_time__lt=timezone.now(),
            author=user,
        )
    else:
        # TODO: index as well
        forecasts = AggregateForecast.objects.filter(
            question__in=public_questions_in_past,
            question__type="binary",
            question__resolution__in=["no", "yes"],
            # Removes questions that have resolved before close time, which have a bias toward 'yes' resolutions
            question__scheduled_resolve_time__lt=timezone.now(),
            question__include_bots_in_aggregates=False,
            method=aggregation_method,
        )

    # Annotate questions instead of separate fetch
    forecasts = forecasts.annotate(
        question_open_time=F("question__open_time"),
        question_actual_close_time=F("question__actual_close_time"),
        question_resolution=F("question__resolution"),
    )

    values = []
    weights = []
    resolutions = []

    for forecast in forecasts:
        forecast_horizon_start = forecast.question_open_time.timestamp()
        actual_close_time = forecast.question_actual_close_time.timestamp()
        # The following is a hack to more closely replicate the old site's behavior
        # forecast_horizon_end = question.scheduled_close_time.timestamp()
        forecast_horizon_end = actual_close_time
        forecast_start = max(forecast_horizon_start, forecast.start_time.timestamp())
        if forecast.end_time:
            forecast_end = min(actual_close_time, forecast.end_time.timestamp())
        else:
            forecast_end = actual_close_time
        forecast_duration = forecast_end - forecast_start
        question_duration = forecast_horizon_end - forecast_horizon_start

        if question_duration == 0:
            continue

        weight = max(0, forecast_duration / question_duration)

        if isinstance(forecast, Forecast):
            values.append(forecast.probability_yes)
        else:
            values.append(forecast.forecast_values[1])

        weights.append(weight)
        resolutions.append(int(forecast.question_resolution == "yes"))

    calibration_curve = []
    small_bin_size = 0.125 / 3
    for p_min, p_max in [
        (0 * small_bin_size, 1 * small_bin_size),
        (1 * small_bin_size, 2 * small_bin_size),
        (2 * small_bin_size, 3 * small_bin_size),
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
        (0.875 + 0 * small_bin_size, 0.875 + 1 * small_bin_size),
        (0.875 + 1 * small_bin_size, 0.875 + 2 * small_bin_size),
        (0.875 + 2 * small_bin_size, 1.00),
    ]:
        resolutions_for_bucket = []
        weights_for_bucket = []
        bin_center = (p_min + p_max) / 2
        for value, weight, resolution in zip(values, weights, resolutions):
            if p_min <= value < p_max:
                resolutions_for_bucket.append(resolution)
                weights_for_bucket.append(weight)
        count = max(len(resolutions_for_bucket), 1)
        average_resolution = (
            np.average(resolutions_for_bucket, weights=weights_for_bucket)
            if sum(weights_for_bucket) > 0
            else None
        )
        lower_confidence_interval = binom.ppf(0.05, count, p_min) / count
        perfect_calibration = binom.ppf(0.50, count, bin_center) / count
        upper_confidence_interval = binom.ppf(0.95, count, p_max) / count

        calibration_curve.append(
            {
                "bin_lower": p_min,
                "bin_upper": p_max,
                "lower_confidence_interval": lower_confidence_interval,
                "average_resolution": average_resolution,
                "upper_confidence_interval": upper_confidence_interval,
                "perfect_calibration": perfect_calibration,
            }
        )

    return {
        "calibration_curve": calibration_curve,
    }


def get_forecasting_stats_data(
    scores: list[QuestionScore] | None = None,
    user: User | None = None,
    aggregation_method: AggregationMethod | None = None,
    score_type: ScoreTypes | None = None,
) -> dict:
    # set up
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    if user is not None and score_type is None:
        score_type = ScoreTypes.PEER
    if aggregation_method is not None and score_type is None:
        score_type = ScoreTypes.BASELINE
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

    average_score = (
        None if not scores else np.average([score.score for score in scores])
    )
    forecasts = Forecast.objects.filter(
        post__default_project__default_permission__isnull=False
    )
    if user is not None:
        forecasts = forecasts.filter(author=user)
    forecasts_count = forecasts.exclude(source=Forecast.SourceChoices.AUTOMATIC).count()
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
        Q(author=user) | Q(coauthors=user),
        notebook__isnull=True,
        curation_status=Post.CurationStatus.APPROVED,
    )

    # Each post has a cached `Post.forecasts_count` value.
    # Summing up this field is significantly faster than counting rows in the Forecasts table
    forecasts_on_authored_questions_count = (
        posts_authored.aggregate(total_forecasts=Sum("forecasts_count"))[
            "total_forecasts"
        ]
        or 0
    )

    notebooks_authored_count = (
        Post.objects.filter_public()
        .filter(
            author=user,
            notebook__isnull=False,
            curation_status=Post.CurationStatus.APPROVED,
        )
        .count()
    )
    comment_count = Comment.objects.filter(
        author=user, on_post__in=Post.objects.filter_public(), is_private=False
    ).count()

    return {
        "posts_authored_count": posts_authored.count(),
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
    score_type: ScoreTypes | None = None,
    current_user: User | None = None,
) -> dict:
    if (user is None and aggregation_method is None) or (
        user is not None and aggregation_method is not None
    ):
        raise ValueError("Either user or aggregation_method must be provided only")
    if user is not None and score_type is None:
        score_type = ScoreTypes.PEER
    if aggregation_method is not None and score_type is None:
        score_type = ScoreTypes.BASELINE
    # TODO: support archived scores
    score_qs = Score.objects.filter(
        question__related_posts__post__default_project__default_permission__isnull=False,
        score_type=score_type,
    )
    if user is not None:
        score_qs = score_qs.filter(user=user)
    else:
        score_qs = score_qs.filter(aggregation_method=aggregation_method)

    scores = generate_question_scores(score_qs)
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
    if current_user is not None and current_user.is_staff:
        data.update({"spam_count": UserSpamActivity.objects.filter(user=user).count()})
    return data


@api_view(["POST"])
@permission_classes([IsAdminUser])
def mark_as_spam_user_api_view(request, pk):
    user_to_mark_as_spam: User = get_object_or_404(User, pk=pk)
    user_to_mark_as_spam.mark_as_spam()
    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
def current_user_api_view(request):
    """
    A lightweight profile data of the current user
    Should contain minimum profile data without heavy calcs
    """

    return Response(UserPrivateSerializer(request.user).data)


@cache_page(60 * 60)
@api_view(["GET"])
@permission_classes([AllowAny])
def user_profile_api_view(request, pk: int):
    qs = User.objects.all()
    if not request.user.is_staff:
        qs = qs.filter(is_active=True, is_spam=False)
    user = get_object_or_404(qs, pk=pk)

    return Response(serialize_profile(user, current_user=request.user))


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
def update_profile_api_view(request: Request) -> Response:
    user: User = request.user
    serializer: UserUpdateProfileSerializer = UserUpdateProfileSerializer(
        user, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)

    is_spam, _ = check_profile_update_for_spam(user, serializer)

    if is_spam:
        user.mark_as_spam()
        send_deactivation_email(user.email)
        return Response(
            data={
                "message": "This bio seems to be spam. Please contact "
                "support@metaculus.com if you believe this was a mistake.",
                "error_code": "SPAM_DETECTED",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    unsubscribe_tags: list[str] | None = serializer.validated_data.get(
        "unsubscribed_mailing_tags"
    )
    if unsubscribe_tags is not None:
        user_unsubscribe_tags(user, unsubscribe_tags)
    serializer.save()
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
def email_me_my_data_api_view(request):
    user = request.user
    email_user_their_data_task.send(user_id=user.id)
    return Response({"message": "Email scheduled to be sent"}, status=200)


@api_view(["POST"])
def email_change_confirm_api_view(request):
    token = serializers.CharField().run_validation(request.data.get("token"))
    change_email_from_token(request.user, token)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def register_campaign(request):
    user = request.user
    serializer = UserCampaignRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    project = serializer.validated_data.get("add_to_project", None)
    campaign_data = serializer.validated_data["details"]
    campaign_key = serializer.validated_data["key"]

    register_user_to_campaign(
        user, campaign_key=campaign_key, campaign_data=campaign_data, project=project
    )

    return Response(status=status.HTTP_200_OK)
