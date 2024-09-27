from django.db import transaction
from django.http import Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField

from posts.models import Post
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import (
    validate_question_resolution,
    OldForecastWriteSerializer,
    ForecastWriteSerializer,
)
from questions.services import (
    resolve_question,
    unresolve_question,
    create_forecast,
    create_forecast_bulk,
)


@api_view(["POST"])
def resolve_api_view(request, pk: int):
    question = get_object_or_404(Question.objects.all(), pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_resolve(permission, raise_exception=True)

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
@transaction.non_atomic_requests
def bulk_create_forecasts_api_view(request):
    now = timezone.now()
    serializer = ForecastWriteSerializer(data=request.data, many=True)
    serializer.is_valid()

    validated_data = serializer.validated_data

    if serializer.errors:
        raise ValidationError({"errors": serializer.errors})

    if not serializer.validated_data:
        raise ValidationError("At least one forecast is required")

    # Prefetching questions for bulk optimization
    questions = Question.objects.filter(
        pk__in=[f["question"] for f in validated_data]
    ).prefetch_related_post()
    questions_map: dict[int, Question] = {q.pk: q for q in questions}

    # Replacing prefetched optimized questions
    for forecast in validated_data:
        question = questions_map.get(forecast["question"])

        if not question:
            raise ValidationError(f"Wrong question id {forecast["question"]}")

        forecast["question"] = question

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

    create_forecast(question=question, user=request.user, probability_yes=probability)

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

    return Response({"question_id": pk, "post_id": post.pk})
