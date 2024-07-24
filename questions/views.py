from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField
from django.utils import timezone

from posts.services.feed import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import validate_question_resolution
from questions.services import resolve_question, create_forecast


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
def create_forecast_api_view(request, pk: int):
    question = get_object_or_404(Question.objects.all(), pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_forecast(permission, raise_exception=True)

    if not question.open_time or question.open_time > timezone.now():
        return Response(
            {"error": "You cannot forecast on this question yet !"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    create_forecast(question=question, user=request.user, **request.data)

    return Response({}, status=status.HTTP_201_CREATED)
