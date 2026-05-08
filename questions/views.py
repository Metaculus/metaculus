from django.db import transaction
from django.http import Http404
from django.utils import timezone
import numpy as np
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField


from comments.serializers.common import CommentWriteSerializer
from comments.services.common import create_comment
from posts.models import Post
from posts.services.common import get_post_permission_for_user
from posts.utils import get_post_slug
from projects.permissions import ObjectPermission
from users.models import User
from utils.requests import is_internal_request
from utils.the_math.aggregations import get_aggregations_at_time
from questions.constants import QuestionStatus
from questions.models import Forecast, Question
from questions.serializers.common import (
    validate_question_resolution,
    QuestionsCommunityPredictionsSerializer,
    OldForecastWriteSerializer,
    ForecastWriteSerializer,
    ForecastWithdrawSerializer,
    serialize_question,
)
from questions.services.forecasts import (
    create_forecast_bulk,
    withdraw_forecast_bulk,
)
from questions.services.lifecycle import resolve_question, unresolve_question


@api_view(["GET"])
def question_detail_api_view(request, pk: int):
    question = get_object_or_404(Question.objects.all(), pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    with_cp = request.GET.get("with_cp", False)

    # minimize the aggregation data by default
    minimize = str(request.GET.get("minimize", "true")).lower() == "true"

    return Response(
        serialize_question(
            question,
            post=question.get_post(),
            aggregate_forecasts=(
                question.aggregate_forecasts.order_by("start_time") if with_cp else None
            ),
            current_user=request.user,
            minimize=minimize,
            include_descriptions=True,
        )
    )


@api_view(["POST"])
def resolve_api_view(request, pk: int):
    question = get_object_or_404(Question.objects.all(), pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_resolve(permission, raise_exception=True)

    if question.status == QuestionStatus.RESOLVED:
        raise ValidationError("This question is already resolved")

    resolution = validate_question_resolution(question, request.data.get("resolution"))
    actual_resolve_time = DateTimeField().run_validation(
        request.data.get("actual_resolve_time")
    )
    resolve_question(question, resolution, actual_resolve_time)

    return Response({"post_id": question.get_post().pk})


@api_view(["POST"])
def unresolve_api_view(request, pk: int):
    question = get_object_or_404(Question.objects.all(), pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_resolve(permission, raise_exception=True)

    unresolve_question(question)

    return Response({"post_id": question.get_post().pk})


@api_view(["POST"])
def bulk_create_forecasts_api_view(request):
    now = timezone.now()
    serializer = ForecastWriteSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)

    validated_data = serializer.validated_data

    if not validated_data:
        raise ValidationError("At least one forecast is required")

    source = (
        Forecast.SourceChoices.UI
        if is_internal_request(request)
        else Forecast.SourceChoices.API
    )

    # Prefetching questions for bulk optimization
    questions = Question.objects.filter(
        pk__in=[f["question"] for f in validated_data]
    ).select_related("post")
    questions_map: dict[int, Question] = {q.pk: q for q in questions}

    # Replacing prefetched optimized questions
    for forecast in validated_data:
        question = questions_map.get(forecast["question"])

        if not question:
            raise ValidationError(f"Wrong question id {forecast['question']}")

        forecast["question"] = question  # used in create_foreacst_bulk
        forecast["source"] = source

        # Check permissions
        permission = get_post_permission_for_user(
            question.get_post(), user=request.user
        )
        ObjectPermission.can_forecast(permission, raise_exception=True)

        if not question.open_time:
            return Response(
                {
                    "error": f"Question {question.id} is not scheduled for forecasting yet !"
                },
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )

        if (question.scheduled_close_time < now) or (
            question.actual_close_time and question.actual_close_time < now
        ):
            return Response(
                {"error": f"Question {question.id} is already closed to forecasting !"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )

    create_forecast_bulk(user=request.user, forecasts=validated_data)

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def bulk_withdraw_forecasts_api_view(request):
    now = timezone.now()
    serializer = ForecastWithdrawSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)

    validated_data = serializer.validated_data

    if not validated_data:
        raise ValidationError("At least one forecast must be withdawn")

    # Prefetching questions for bulk optimization
    questions = (
        Question.objects.filter(pk__in=[f["question"] for f in validated_data])
        .select_related("post")
        .prefetch_related("user_forecasts")
    )
    questions_map: dict[int, Question] = {q.pk: q for q in questions}

    # Replacing prefetched optimized questions
    for withdrawal in validated_data:
        question = questions_map.get(withdrawal["question"])
        withdrawal["question"] = question  # used in withdraw_foreacst_bulk
        withdraw_at = withdrawal.get("withdraw_at", now)
        withdrawal["withdraw_at"] = withdraw_at  # used in withdraw_foreacst_bulk

        if now > withdraw_at:
            return Response(
                {"error": f"Withdrawal time {withdraw_at} cannot be in the past"},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )

        if not question:
            raise ValidationError(f"Wrong question id {withdrawal['question']}")

        # Check permissions
        permission = get_post_permission_for_user(
            question.get_post(), user=request.user
        )
        ObjectPermission.can_forecast(permission, raise_exception=True)

    withdraw_forecast_bulk(user=request.user, withdrawals=validated_data)

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_binary_forecast_oldapi_view(request, pk: int):
    now = timezone.now()
    post = get_object_or_404(Post.objects.all(), pk=pk)
    question: Question = post.question
    if question is None:
        raise Http404(f"Question with id {pk} not found.")

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_forecast(permission, raise_exception=True)

    if not question.open_time:
        return Response(
            {"error": "This question is not scheduled for forecasting yet !"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    if (question.scheduled_close_time < now) or (
        question.actual_close_time and question.actual_close_time < now
    ):
        return Response(
            {"error": f"Question {question.id} is already closed to forecasting !"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    serializer = OldForecastWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    probability = serializer.validated_data.get("prediction")
    serializer_new = ForecastWriteSerializer(
        data={"probability_yes": probability, "question": question.id}
    )
    serializer_new.is_valid(raise_exception=True)

    create_forecast_bulk(
        user=request.user,
        forecasts=[
            {
                "question": question,
                "probability_yes": probability,
                # Old endpoint requests are always API
                "source": Forecast.SourceChoices.API,
            }
        ],
    )

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def legacy_question_api_view(request, pk: int):
    """
    A legacy backward compatibility hack to replace child_question_id with its corresponding post_id.
    This applies to old group questions that used links like /questions/<child_question_id>,
    which were later redirected to /questions/<post_id>/?sub-question=<child_question_id>.

    This functionality is planned for deprecation in the future.
    """

    question = get_object_or_404(Question.objects.all(), pk=pk)
    post = question.get_post()

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    return Response(
        {"question_id": pk, "post_id": post.pk, "post_slug": get_post_slug(post)}
    )


class BulkForecastAndCommentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False, allow_null=True)
    username = serializers.CharField(required=False, allow_null=True)
    is_staff_override = serializers.BooleanField(required=False, default=False)
    forecasts = ForecastWriteSerializer(many=True, required=False, default=list)
    comments = CommentWriteSerializer(many=True, required=False, default=list)

    def validate(self, attrs):
        if not attrs.get("user_id") and not attrs.get("username"):
            raise serializers.ValidationError(
                "Either user_id or username must be provided."
            )
        return attrs


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_forecast_and_comment_api_view(request):
    """
    Submits forecasts and comments in a single atomic transaction.

    Superusers may submit on behalf of any user by providing user_id or username
    and flag `is_staff_override`.
    Non-superusers may submit as themselves or as one of their bots (identified
    by user_id or username).
    """
    serializer = BulkForecastAndCommentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user_id = data.get("user_id")
    username = data.get("username")
    forecasts_data = data["forecasts"]
    comments_data = data.get("comments", [])
    is_staff_override = data.get("is_staff_override", False)

    request_user = request.user
    if is_staff_override and not request_user.is_superuser:
        raise PermissionDenied("Only superusers can use the is_staff_override flag.")

    if is_staff_override:
        if user_id:
            user = get_object_or_404(User, id=user_id)
        else:
            user = get_object_or_404(User, username=username)
    else:
        user = (
            User.objects.filter(id=user_id).first()
            if user_id
            else User.objects.filter(username=username).first()
        )
        is_self = user is not None and user.id == request_user.id
        is_own_bot = (
            user is not None
            and user.is_bot
            and user.bot_owner_id is not None
            and user.bot_owner_id == request_user.id
        )
        if not is_self and not is_own_bot:
            raise PermissionDenied(
                "Non-superusers can only submit forecasts and comments as themselves "
                "or their bots."
            )

    now = timezone.now()
    errors = []

    # Validate forecasts and resolve question IDs to Question objects
    questions_map = {
        q.pk: q
        for q in Question.objects.filter(
            pk__in=[f["question"] for f in forecasts_data]
        ).select_related("post")
    }

    for forecast in forecasts_data:
        question_id = forecast["question"]
        question = questions_map.get(question_id)
        if not question:
            errors.append(f"Question {question_id} does not exist.")
            continue
        forecast["question"] = question

        post: Post = question.post
        permission = get_post_permission_for_user(post, user=user)
        if not ObjectPermission.can_forecast(permission):
            errors.append(f"Question {question.id}: forecasting not permitted.")
            continue

        if (
            not post.curation_status != Post.CurationStatus.APPROVED
            or not question.open_time
            or not question.scheduled_close_time
        ):
            errors.append(f"Question {question.id} is not open for forecasting yet.")
        elif (question.scheduled_close_time < now) or (
            question.actual_close_time and question.actual_close_time < now
        ):
            errors.append(f"Question {question.id} is already closed to forecasting.")

    # Validate comments
    for i, comment in enumerate(comments_data):
        on_post = comment["on_post"]
        if not comment.get("is_private"):
            errors.append(
                f"Comment {i}: only private comments are allowed in bulk submissions."
            )
            continue
        if comment.get("key_factors"):
            errors.append(
                f"Comment {i}: key_factors are not supported in bulk submissions."
            )
            continue
        parent = comment.get("parent")
        permission = get_post_permission_for_user(
            parent.on_post if parent else on_post, user=user
        )
        if not ObjectPermission.can_comment(permission):
            errors.append(
                f"Comment {i}: commenting not permitted on post {on_post.id}."
            )

    if errors:
        raise ValidationError(errors)

    with transaction.atomic():
        create_forecast_bulk(user=user, forecasts=forecasts_data)

        for comment_data in comments_data:
            on_post = comment_data["on_post"]
            included_forecast_flag = comment_data.pop("included_forecast", False)
            comment_data.pop("key_factors", None)

            included_forecast = (
                on_post.question.user_forecasts.filter(author_id=user.id)
                .order_by("-start_time")
                .first()
                if included_forecast_flag and on_post.question_id
                else None
            )

            create_comment(
                **comment_data, included_forecast=included_forecast, user=user
            )

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def questions_community_predictions(request) -> Response:
    src = request.data if request.method == "POST" else request.query_params
    serializer = QuestionsCommunityPredictionsSerializer(data=src)
    serializer.is_valid(raise_exception=True)

    question_ids: list[int] = serializer.validated_data["question_ids"]
    per_entry_timestamps = serializer.get_per_question_timestamps()

    # Fetch questions
    questions_by_id: dict[int, Question] = {
        q.id: q for q in Question.objects.filter(id__in=question_ids)
    }

    # Compute aggregations
    results = []
    for qid, ts in zip(question_ids, per_entry_timestamps):
        question = questions_by_id.get(qid)
        if not question:
            continue

        method = question.default_aggregation_method
        aggs = get_aggregations_at_time(
            question=question,
            time=ts,
            aggregation_methods=[method],
            include_stats=True,
            include_bots=question.include_bots_in_aggregates,
        )
        agg = aggs.get(method)

        if agg:
            pmf = agg.get_pmf()
            pmf = [
                v if not np.isnan(v) else None for v in pmf
            ]  # Convert NaNs to None for JSON serialization
            results.append(
                {
                    "metaculus_id": qid,
                    "timestamp": ts.isoformat(),
                    "method": method,
                    "pmf": pmf,
                    "interval_lower_bounds": agg.interval_lower_bounds,
                    "centers": agg.centers,
                    "interval_upper_bounds": agg.interval_upper_bounds,
                    "means": agg.means,
                    "forecaster_count": agg.forecaster_count,
                    "error": None,
                }
            )
    return Response({"results": results})
