from django.db import transaction
from django.http import Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
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
@transaction.non_atomic_requests
def bulk_create_forecasts_api_view(request):
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
    questions_map = {q.pk: q for q in questions}

    # Replacing prefetched optimized questions
    for forecast in validated_data:
        forecast["question"] = questions_map.get(forecast["question"])

        if not forecast["question"]:
            raise ValidationError("Wrong question id")

    create_forecast_bulk(user=request.user, forecasts=validated_data)

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_binary_forecast_oldapi_view(request, pk: int):
    post = get_object_or_404(Post.objects.all(), pk=pk)
    question = post.question
    if question is None:
        raise Http404(f"Question with id {pk} not found.")

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_forecast(permission, raise_exception=True)

    if not question.open_time or question.open_time > timezone.now():
        return Response(
            {"error": "You cannot forecast on this question yet !"},
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
