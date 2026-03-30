from django.db import transaction
from django.http import Http404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField

from comments.serializers.common import CommentWriteSerializer
from comments.services.common import create_comment
from comments.services.key_factors.common import create_key_factors
from posts.models import Post
from posts.services.common import get_post_permission_for_user
from posts.tasks import run_on_post_forecast
from posts.utils import get_post_slug
from projects.permissions import ObjectPermission
from users.models import User
from .constants import QuestionStatus
from .models import Question
from .serializers.common import (
    validate_question_resolution,
    OldForecastWriteSerializer,
    ForecastWriteSerializer,
    ForecastWithdrawSerializer,
    serialize_question,
)
from .services.forecasts import (
    after_forecast_actions,
    create_forecast,
    create_forecast_bulk,
    update_forecast_notification,
    withdraw_forecast_bulk,
)
from .services.lifecycle import resolve_question, unresolve_question


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

        # Check permissions
        permission = get_post_permission_for_user(
            question.get_post(), user=request.user
        )
        ObjectPermission.can_forecast(permission, raise_exception=True)

        if not question.open_time or question.open_time > now:
            return Response(
                {"error": f"Question {question.id} is not open for forecasting yet !"},
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

    if not question.open_time or question.open_time > now:
        return Response(
            {"error": "You cannot forecast on this question yet !"},
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
        forecasts=[{"question": question, "probability_yes": probability}],
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
    user_id = serializers.IntegerField(required=True)
    is_staff_override = serializers.BooleanField(required=False, default=False)
    forecasts = ForecastWriteSerializer(many=True, required=False, default=list)
    comments = CommentWriteSerializer(many=True, required=False, default=list)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_forecast_and_comment_api_view(request):
    """
    Submits forecasts and comments in a single atomic transaction.

    Staff users may submit on behalf of any user by providing user_id and
    flag `is_staff_override`.
    Non-staff users may only submit as themselves (user_id must match
    the authenticated user's ID).
    """
    serializer = BulkForecastAndCommentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user_id = data.get("user_id")
    forecasts_data = data["forecasts"]
    comments_data = data.get("comments", [])
    is_staff_override = data.get("is_staff_override", False)

    request_user = request.user
    if is_staff_override and not request_user.is_staff:
        raise PermissionDenied("Non-staff users cannot use the is_staff_override flag.")
    if not is_staff_override and user_id != request_user.id:
        raise PermissionDenied(
            "Non-staff users can only submit forecasts and comments as themselves."
        )

    if is_staff_override:
        user = get_object_or_404(User, id=user_id)
    else:
        user = request_user

    now = timezone.now()

    # Validate forecasts and resolve question IDs to Question objects
    questions_map = {
        q.pk: q
        for q in Question.objects.filter(
            pk__in=[f["question"] for f in forecasts_data]
        ).select_related("post")
    }

    for forecast in forecasts_data:
        question = questions_map.get(forecast["question"])
        if not question:
            raise ValidationError(f"Wrong question id {forecast['question']}")
        forecast["question"] = question

        permission = get_post_permission_for_user(question.get_post(), user=user)
        ObjectPermission.can_forecast(permission, raise_exception=True)

        if not question.open_time or question.open_time > now:
            raise ValidationError(
                f"Question {question.id} is not open for forecasting yet"
            )
        if (question.scheduled_close_time < now) or (
            question.actual_close_time and question.actual_close_time < now
        ):
            raise ValidationError(
                f"Question {question.id} is already closed to forecasting"
            )

    # Validate comment permissions
    for comment in comments_data:
        on_post = comment["on_post"]
        parent = comment.get("parent")
        permission = get_post_permission_for_user(
            parent.on_post if parent else on_post, user=user
        )
        ObjectPermission.can_comment(permission, raise_exception=True)

    posts = set()
    created_forecasts = []

    with transaction.atomic():
        for forecast_data in forecasts_data:
            question = forecast_data.pop("question")
            posts.add(question.get_post())
            forecast = create_forecast(question=question, user=user, **forecast_data)
            created_forecasts.append((forecast, question))

        for comment_data in comments_data:
            on_post = comment_data["on_post"]
            included_forecast_flag = comment_data.pop("included_forecast", False)
            key_factors = comment_data.pop("key_factors", None)

            included_forecast = (
                on_post.question.user_forecasts.filter(author_id=user.id)
                .order_by("-start_time")
                .first()
                if included_forecast_flag and on_post.question_id
                else None
            )

            new_comment = create_comment(
                **comment_data, included_forecast=included_forecast, user=user
            )
            if key_factors:
                create_key_factors(new_comment, key_factors)

    for forecast, question in created_forecasts:
        update_forecast_notification(forecast=forecast, created=True)
        after_forecast_actions(question, user)

    for post in posts:
        run_on_post_forecast.send_with_options(args=(post.id,), delay=10_000)

    return Response({}, status=status.HTTP_201_CREATED)
