from datetime import datetime, timedelta
from typing import Callable

from django.db.models import Q, QuerySet, Count
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.models import Project
from questions.models import Question, Vote
from questions.serializers import (
    QuestionSerializer,
    QuestionWriteSerializer,
    QuestionFilterSerializer,
)
from users.models import User
from utils.dtypes import flatten
from utils.the_math.community_prediction import (
    compute_binary_cp,
    compute_continuous_cp,
    compute_multiple_choice_cp,
)
import numpy as np


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
        print(topic)
        qs = qs.filter(projects=topic)

    if tags := serializer.validated_data.get("tags"):
        qs = qs.filter(projects__in=tags)

    if categories := serializer.validated_data.get("categories"):
        qs = qs.filter(projects__in=categories)

    if forecast_type := serializer.validated_data.get("forecast_type"):
        qs = qs.filter(type__in=forecast_type)

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


def enrich_empty(
    qs: QuerySet, *args, **kwargs
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
    """
    Enrichment function with returns everything as is
    """

    def enrich(question: Question, serialized_data: dict):
        return serialized_data

    return qs, enrich


def enrich_questions_with_votes(
    qs: QuerySet, user: User = None
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
    """
    Enriches questions with the votes object.
    """

    qs = qs.annotate_vote_score()

    # Annotate user's vote
    if user and not user.is_anonymous:
        qs = qs.annotate_user_vote(user)

    def enrich(question: Question, serialized_question: dict):
        serialized_question["vote"] = {
            "score": question.vote_score,
            "user_vote": question.user_vote,
        }

        return serialized_question

    return qs, enrich


def enrich_questions_with_nr_forecasts(
    qs: QuerySet, user: User = None
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
    """
    Enriches questions with the votes object.
    """

    qs = qs.prefetch_forecasts()

    # Annotate user's vote
    if user and not user.is_anonymous:
        qs = qs.annotate_user_vote(user)

    def enrich(question: Question, serialized_question: dict):
        nr_forecasters = question.forecast_set.values("author").distinct().count()

        serialized_question["nr_forecasters"] = nr_forecasters

        return serialized_question

    return qs, enrich


def enrich_question_with_resolution(
    qs: QuerySet,
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:

    def enrich(question: Question, serialized_question: dict):
        if question.type == "binary":
            if np.isclose(float(serialized_question["resolution"]), 0):
                serialized_question["resolution"] = "Yes"
            elif np.isclose(float(serialized_question["resolution"]), -1):
                serialized_question["resolution"] = "No"

        elif question.type == "number":
            pass

        elif question.type == "date":
            pass

        elif question.type == "multiple_choice":
            pass
        else:
            pass

        return serialized_question

    return qs, enrich


def enrich_questions_with_forecasts(
    qs: QuerySet,
) -> tuple[QuerySet, Callable[[Question, dict], dict]]:
    """
    Enriches questions with the forecasts object.
    """

    qs = qs.prefetch_forecasts()

    def enrich(question: Question, serialized_question: dict):
        forecasts_data = {}

        forecasts = question.forecast_set.all()
        forecast_times = []
        end_date = datetime.now().date()
        if question.closed_at and question.closed_at.date() < end_date:
            end_date = question.closed_at.date()
        if question.published_at:
            forecast_times = [
                question.published_at + timedelta(days=x)
                for x in range((end_date - question.published_at.date()).days + 1)
            ]

        if question.type == "multiple_choice":
            forecasts_data = {
                "timestamps": [],
                "nr_forecasters": [],
            }
            for option in question.options:
                forecasts_data[f"value_{option}"] = []
        else:
            forecasts_data = {
                "timestamps": [],
                "values_mean": [],
                "values_max": [],
                "values_min": [],
                "nr_forecasters": [],
            }

        # values_choice_1
        for forecast_time in forecast_times:
            if question.type == "multiple_choice":
                cp = compute_multiple_choice_cp(question, forecasts, forecast_time)
                if cp is None:
                    continue
                forecasts_data["timestamps"].append(forecast_time.timestamp())
                for k in cp:
                    if k != "nr_forecasters":
                        forecasts_data[f"value_{k}"].append(cp[k])
                forecasts_data["nr_forecasters"].append(cp["nr_forecasters"])
            else:
                if question.type == "binary":
                    cp = compute_binary_cp(forecasts, forecast_time)
                elif question.type in ["numeric", "date"]:
                    cp = compute_continuous_cp(question, forecasts, forecast_time)
                else:
                    raise Exception(f"Unknown question type: {question.type}")
                if cp is None:
                    continue
                forecasts_data["timestamps"].append(forecast_time.timestamp())
                forecasts_data["values_mean"].append(cp["mean"])
                forecasts_data["values_max"].append(cp["max"])
                forecasts_data["values_min"].append(cp["min"])
                forecasts_data["nr_forecasters"].append(cp["nr_forecasters"])

        serialized_question["forecasts"] = forecasts_data
        return serialized_question

    return qs, enrich


@api_view(["GET"])
@permission_classes([AllowAny])
def questions_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = Question.objects.annotate_predictions_count().filter(forecast__gte=10)
    print("\n", request.query_params, "\n")

    # Extra enrich params
    with_forecasts = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_forecasts")
    )

    # Apply filtering
    qs = filter_questions(qs, request)

    # Enrich QS
    qs, enrich_votes = enrich_questions_with_votes(qs, user=request.user)
    qs, enrich_resolution = enrich_question_with_resolution(qs)
    qs, enrich_nr_forecasts = enrich_questions_with_nr_forecasts(qs, user=request.user)
    qs, enrich_forecasts = (
        enrich_questions_with_forecasts(qs) if with_forecasts else enrich_empty(qs)
    )

    # Paginating queryset
    qs = paginator.paginate_queryset(qs, request)

    data = []
    for question in qs:
        serialized_question = QuestionSerializer(question).data

        # Enrich with extra data
        serialized_question = enrich_forecasts(question, serialized_question)
        serialized_question = enrich_votes(question, serialized_question)
        serialized_question = enrich_nr_forecasts(question, serialized_question)
        serialized_question = enrich_resolution(question, serialized_question)

        data.append(serialized_question)

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def question_detail(request: Request, pk):
    qs = Question.objects.all()

    # Enrich QS
    qs, enrich_votes = enrich_questions_with_votes(qs, user=request.user)
    qs, enrich_forecasts = enrich_questions_with_forecasts(qs)

    question = get_object_or_404(qs, pk=pk)
    serializer = QuestionSerializer(question)
    data = serializer.data

    # Enrich serialized object
    data = enrich_votes(question, data)
    data = enrich_forecasts(question, data)

    return Response(data)


@api_view(["POST"])
def create_question(request):
    serializer = QuestionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    projects_by_category: dict[str, list[Project]] = data.pop("projects", {})

    question = Question.objects.create(author=request.user, **data)

    projects_flat = flatten(projects_by_category.values())
    question.projects.add(*projects_flat)

    # Attaching projects to the
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


@api_view(["POST"])
def question_vote_api_view(request: Request, pk: int):
    question = get_object_or_404(Question, pk=pk)
    direction = serializers.ChoiceField(
        required=False, allow_null=True, choices=Vote.VoteDirection.choices
    ).run_validation(request.data.get("direction"))

    # Deleting existing vote
    Vote.objects.filter(user=request.user, question=question).delete()

    if direction:
        Vote.objects.create(user=request.user, question=question, direction=direction)

    return Response(
        {"score": Question.objects.annotate_vote_score().get(pk=question.pk).vote_score}
    )
