from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from projects.serializers import (
    TopicSerializer,
    CategorySerializer,
    TournamentSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def topics_list_api_view(request: Request):
    qs = Project.objects.filter_topic().filter_active().annotate_questions_count()

    data = [
        {**TopicSerializer(obj).data, "questions_count": obj.questions_count}
        for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def categories_list_api_view(request: Request):
    qs = (
        Project.objects.filter_category()
        .filter_active()
        .annotate_questions_count()
        .order_by("-questions_count")
    )

    data = [
        {**CategorySerializer(obj).data, "questions_count": obj.questions_count}
        for obj in qs.all()
    ]

    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def tournaments_list_api_view(request: Request):
    qs = (
        Project.objects.filter_tournament()
        .filter_active()
        .annotate_questions_count()
        .order_by("-questions_count")
    )

    data = [
        {**TournamentSerializer(obj).data, "questions_count": obj.questions_count}
        for obj in qs.all()
    ]

    return Response(data)
