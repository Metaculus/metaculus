from typing import Callable

import django
from django.db.models import Q, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from posts.models import Post, Vote
from posts.serializers import PostFilterSerializer, PostSerializer, PostWriteSerializer
from projects.models import Project
from questions.models import Question
from questions.services import (
    enrich_question_with_resolution_f,
    enrich_question_with_forecasts_f,
)
from users.models import User
from utils.dtypes import flatten
from utils.enrichments import enrich_empty


def filter_posts(qs, request: Request):
    """
    Applies filtering on the Questions QuerySet
    """
    user = request.user
    serializer = PostFilterSerializer(data=request.query_params)
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
        qs = qs.filter(question__type__in=forecast_type)

    if status := serializer.validated_data.get("status"):
        if "resolved" in status:
            qs = qs.filter(question__resolved_at__isnull=False).filter(
                question__resolved_at__lte=django.utils.timezone.now()
            )
        if "active" in status:
            qs = (
                qs.filter(question__resolved_at__isnull=False)
                .filter(published_at__lte=django.utils.timezone.now())
                .filter(
                    Q(
                        Q(question__closed_at__gte=django.utils.timezone.now())
                        | Q(question__closed_at__isnull=True)
                    )
                )
                .filter(
                    Q(
                        Q(question__resolved_at__gte=django.utils.timezone.now())
                        | Q(question__resolved_at__isnull=True)
                    )
                )
            )
        if "closed" in status:
            qs = qs.filter(question__closed_at__isnull=False).filter(
                question__closed_at__lte=django.utils.timezone.now()
            )

    answered_by_me = serializer.validated_data.get("answered_by_me")

    if answered_by_me is not None and not user.is_anonymous:
        condition = {"question__forecast__author": user}
        qs = qs.filter(**condition) if answered_by_me else qs.exclude(**condition)

    # Ordering
    if order := serializer.validated_data.get("order"):
        match order:
            case serializer.Order.MOST_FORECASTERS:
                qs = qs.annotate_predictions_count__unique().order_by("-nr_forecasters")
            case serializer.Order.CLOSED_AT:
                qs = qs.order_by("-closed_at")
            case serializer.Order.RESOLVED_AT:
                qs = qs.order_by("-resolved_at")
            case serializer.Order.CREATED_AT:
                qs = qs.order_by("-created_at")
    return qs


def enrich_posts_with_votes(
    qs: Post.objects, user: User = None
) -> tuple[QuerySet, Callable[[Post, dict], dict]]:
    """
    Enriches post with the votes object.
    """

    qs = qs.annotate_vote_score()

    # Annotate user's vote
    if user and not user.is_anonymous:
        qs = qs.annotate_user_vote(user)

    def enrich(obj: Post, serialized_obj: dict):
        serialized_obj["vote"] = {
            "score": obj.vote_score,
            "user_vote": obj.user_vote,
        }

        return serialized_obj

    return qs, enrich


def enrich_posts_with_nr_forecasts(
    qs: Post.objects, user: User = None
) -> tuple[QuerySet, Callable[[Post, dict], dict]]:
    """
    Enriches posts with nr of forecasts.
    """

    qs = qs.annotate_nr_forecasters()

    # Annotate user's vote
    if user and not user.is_anonymous:
        qs = qs.annotate_user_vote(user)

    def enrich(obj: Post, serialized_obj: dict):
        serialized_obj["nr_forecasters"] = obj.nr_forecasters

        return serialized_obj

    return qs, enrich


def enrich_post_question_with_resolution(
    qs: Post.objects,
) -> tuple[QuerySet, Callable[[Post, dict], dict]]:
    """
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
    """

    def enrich(post: Post, serialized_post: dict):
        serialized_post["question"] = enrich_question_with_resolution_f(
            post.question, serialized_post["question"]
        )

        return serialized_post

    return qs, enrich


def enrich_posts_with_forecasts(
    qs: Post.objects,
) -> tuple[QuerySet, Callable[[Post, dict], dict]]:
    """
    Enriches questions with the forecasts object.
    """

    qs = qs.prefetch_forecasts()

    def enrich(post: Post, serialized_post: dict):
        serialized_post["question"] = enrich_question_with_forecasts_f(
            post.question, serialized_post["question"]
        )

        return serialized_post

    return qs, enrich


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = (
        Post.objects.annotate_predictions_count()
        .filter(question__forecast__gte=2)
        .filter(published_at__isnull=False)
        .filter(published_at__lte=django.utils.timezone.now())
    )

    # Extra enrich params
    with_forecasts = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_forecasts")
    )

    # Apply filtering
    qs = filter_posts(qs, request)

    # Enrich QS
    qs, enrich_votes = enrich_posts_with_votes(qs, user=request.user)
    qs, enrich_resolution = enrich_post_question_with_resolution(qs)
    qs, enrich_nr_forecasts = enrich_posts_with_nr_forecasts(qs, user=request.user)
    qs, enrich_forecasts = (
        enrich_posts_with_forecasts(qs) if with_forecasts else enrich_empty(qs)
    )

    # Paginating queryset
    qs = paginator.paginate_queryset(qs, request)

    data = []
    for post in qs:
        serialized_post = PostSerializer(post).data

        # Enrich with extra data
        serialized_post = enrich_forecasts(post, serialized_post)
        serialized_post = enrich_votes(post, serialized_post)
        serialized_post = enrich_nr_forecasts(post, serialized_post)
        serialized_post = enrich_resolution(post, serialized_post)

        data.append(serialized_post)

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_detail(request: Request, pk):
    qs = Post.objects.all()

    # Enrich QS
    qs, enrich_votes = enrich_posts_with_votes(qs, user=request.user)
    qs, enrich_forecasts = enrich_posts_with_forecasts(qs)

    question = get_object_or_404(qs, pk=pk)
    serializer = PostSerializer(question)
    data = serializer.data

    # Enrich serialized object
    data = enrich_votes(question, data)
    data = enrich_forecasts(question, data)

    return Response(data)


@api_view(["POST"])
def post_create_api_view(request):
    serializer = PostWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    post_data = serializer.validated_data
    projects_by_category: dict[str, list[Project]] = post_data.pop("projects", {})
    question_data = post_data.pop("question")

    question = Question.objects.create(title=post_data["title"], **question_data)
    post = Post.objects.create(author=request.user, question=question, **post_data)

    projects_flat = flatten(projects_by_category.values())
    post.projects.add(*projects_flat)

    # Attaching projects to the
    return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
def post_update_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user != post.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = PostSerializer(post, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["DELETE"])
def post_delete_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user != post.author:
        return Response(status=status.HTTP_403_FORBIDDEN)
    post.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_vote_api_view(request: Request, pk: int):
    post = get_object_or_404(Post, pk=pk)
    direction = serializers.ChoiceField(
        required=False, allow_null=True, choices=Vote.VoteDirection.choices
    ).run_validation(request.data.get("direction"))

    # Deleting existing vote
    Vote.objects.filter(user=request.user, post=post).delete()

    if direction:
        Vote.objects.create(user=request.user, post=post, direction=direction)

    return Response(
        {"score": Post.objects.annotate_vote_score().get(pk=post.pk).vote_score}
    )
