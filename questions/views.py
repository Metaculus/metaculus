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
from questions.models import Forecast, Question, Vote
from questions.serializers import (
    QuestionSerializer,
    QuestionWriteSerializer,
    QuestionFilterSerializer,
)
from users.models import User
from utils.dtypes import flatten
from utils.the_math.community_prediction import (
    compute_binary_plotable_cp,
    compute_continuous_plotable_cp,
    compute_multiple_choice_plotable_cp,
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
        qs = qs.filter(projects=topic)

    if tags := serializer.validated_data.get("tags"):
        qs = qs.filter(projects__in=tags)

    if categories := serializer.validated_data.get("categories"):
        qs = qs.filter(projects__in=categories)

    # TODO: ensure projects filtering logic is correct
    #   I assume it might not work exactly as before
    if tournaments := serializer.validated_data.get("tournaments"):
        qs = qs.filter(projects__in=tournaments)

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

    '''
    resolution of -2 means "annulled"
    resolution of -1 means "ambiguous"
    For Binary
    resolution of 0 means "didn't happen"
    resolution of 1 means "did happen"
    For MC
    resolution of N means "N'th choice occurred"
    resolved_option is a mapping to the Option that was resolved to
    For Continuous
    resolution of 0 means "at lower bound"
    resolution of 1 means "at upper bound"
    resolution in [0, 1] means "resolved at some specified location within bounds"
    resolution of 2 means "not greater than lower bound"
    resolution of 3 means "not less than upper bound"
    '''
    def enrich(question: Question, serialized_question: dict):
        if question.type == "binary":
            # TODO: @george, some questions might have None resolution, so this leads to error
            #   added tmp condition to prevent such cases
            resolution = serialized_question["resolution"]

            if resolution is not None:
                if np.isclose(float(serialized_question["resolution"]), 0):
                    serialized_question["resolution"] = "Yes"
                elif np.isclose(float(serialized_question["resolution"]), -1):
                    serialized_question["resolution"] = "No"

        # TODO @Luke this and the date have to be normalized
        elif question.type == "number":
            pass

        elif question.type == "date":
            pass

        elif question.type == "multiple_choice":
            try:
                return question.options[int(question.resolution)]
            except Exception as e:
                return f"Error for resolution: {question.resolution}"
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
                forecasts_data[option] = []
        else:
            forecasts_data = {
                "timestamps": [],
                "values_mean": [],
                "values_max": [],
                "values_min": [],
                "nr_forecasters": [],
            }

        # values_choice_1
        if question.type == "multiple_choice":
            cps = compute_multiple_choice_plotable_cp(question)
            for cp_dict in cps:
                for option, cp in cp_dict.items():
                    forecasts_data[option].append(
                        {
                            "value_mean": cp.middle,
                            "value_max": cp.upper,
                            "value_min": cp.lower,
                        }
                    )
                forecasts_data["timestamps"].append(
                    list(cp_dict.values())[0].at_datetime.timestamp()
                )
                forecasts_data["nr_forecasters"].append(
                    list(cp_dict.values())[0].nr_forecasters
                )
        else:
            if question.type == "binary":
                cps = compute_binary_plotable_cp(question)
            elif question.type in ["numeric", "date"]:
                cps = compute_continuous_plotable_cp(question)
            else:
                raise Exception(f"Unknown question type: {question.type}")
            if cps is None or len(cps) == 0:
                return serialized_question

            for cp in cps:
                forecasts_data["timestamps"].append(cp.at_datetime.timestamp())
                forecasts_data["values_mean"].append(cp.middle)
                forecasts_data["values_max"].append(cp.upper)
                forecasts_data["values_min"].append(cp.lower)
                forecasts_data["nr_forecasters"].append(cp.nr_forecasters)

        serialized_question["forecasts"] = forecasts_data
        return serialized_question

    return qs, enrich


@api_view(["GET"])
@permission_classes([AllowAny])
def questions_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = Question.objects.annotate_predictions_count().filter(forecast__gte=10)

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



@api_view(["POST"])
def create_forecast(request):
    data = request.data
    question = Question.objects.get(pk=data["question_id"])
    now = datetime.now()
    prev_forecasts = Forecast.objects.filter(question=question, user=request.user).order_by("start_time").last()
    if prev_forecasts:
        prev_forecasts.end_time = now
    
    
    Forecast.objects.create(question=question, user=request.user, start_time=now, end_time=None)

    serializer = QuestionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    projects_by_category: dict[str, list[Project]] = data.pop("projects", {})

    question = Question.objects.create(author=request.user, **data)

    projects_flat = flatten(projects_by_category.values())
    question.projects.add(*projects_flat)

    # Attaching projects to the
    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)

