from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from questions.models import Forecast, Question
from questions.serializers import (
    QuestionSerializer,
    QuestionWriteSerializer,
    QuestionFilterSerializer,
)
from utils.the_math.community_prediction import compute_binary_cp


def filter_questions(qs, request: Request):
    """
    Applies filtering on the Questions QuerySet
    """

    user = request.user
    serializer = QuestionFilterSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)

    # Search
    if search_query := serializer.validated_data.get("search"):
        qs = qs.filter(
            Q(title__icontains=search_query)
            | Q(author__username__icontains=search_query)
        )

    # Filters
    if topic := serializer.validated_data.get("topic"):
        qs = qs.filter(projects=topic)

    if tags := serializer.validated_data.get("tags"):
        qs = qs.filter(projects__in=tags)

    if categories := serializer.validated_data.get("categories"):
        qs = qs.filter(projects__in=categories)

    answered_by_me = serializer.validated_data.get("answered_by_me")

    if answered_by_me is not None and not user.is_anonymous:
        condition = {"forecast__author": user}
        qs = qs.filter(**condition) if answered_by_me else qs.exclude(**condition)

    # Ordering
    if order := serializer.validated_data.get("order"):
        match order:
            case serializer.Order.MOST_FORECASTERS:
                qs = qs.annotate_predictions_count__unique().order_by(
                    "-predictions_count_unique"
                )
            case serializer.Order.CLOSED_AT:
                qs = qs.order_by("-closed_at")
            case serializer.Order.RESOLVED_AT:
                qs = qs.order_by("-resolved_at")
            case serializer.Order.CREATED_AT:
                qs = qs.order_by("-created_at")

    return qs


@api_view(["GET"])
@permission_classes([AllowAny])
def questions_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = Question.objects.all().prefetch_projects()

    # Extra enrich params
    with_forecasts = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_forecasts")
    )

    # Apply filtering
    qs = filter_questions(qs, request)

    # Paginating queryset
    qs = paginator.paginate_queryset(qs, request)

    data = []
    for question in qs:
        serialized_question = QuestionSerializer(question).data

        if with_forecasts:
            serialized_question["forecasts"] = get_forecasts_for_question(question)

        data.append(serialized_question)

    return paginator.get_paginated_response(data)


def get_forecasts_for_question(question: Question):
    try:
        forecasts = Forecast.objects.filter(question=question)
        forecast_times = [x.start_time for x in forecasts]
        forecasts_data = {
            "timestamps": [],
            "values_mean": [],
            "values_max": [],
            "values_min": [],
            "nr_forecasters": [],
        }
        for forecast_time in forecast_times:
            cp = compute_binary_cp(forecasts, forecast_time)
            forecasts_data["timestamps"].append(forecast_time.timestamp())
            forecasts_data["values_mean"].append(cp["mean"])
            forecasts_data["values_max"].append(cp["max"])
            forecasts_data["values_min"].append(cp["min"])
            forecasts_data["nr_forecasters"].append(cp["nr_forecasters"])

        return forecasts_data
    except:
        return None


@api_view(["GET"])
@permission_classes([AllowAny])
def question_detail(request: Request, pk):
    print(request, pk)
    question = get_object_or_404(Question, pk=pk)
    forecasts_data = get_forecasts_for_question(question)
    serializer = QuestionSerializer(question)
    data = serializer.data
    data["forecasts"] = forecasts_data
    return Response(data)


@api_view(["POST"])
def create_question(request):
    serializer = QuestionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    question = serializer.save(author=request.user)
    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
def update_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = QuestionSerializer(question, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["DELETE"])
def delete_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)
    question.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
