from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from posts.models import Post, Vote
from posts.serializers import (
    PostFilterSerializer,
    PostSerializer,
    PostWriteSerializer,
    serialize_post_many,
    serialize_post,
)
from posts.services import get_posts_feed, create_post, get_post_permission_for_user
from projects.permissions import ObjectPermission


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = Post.objects.annotate_predictions_count()

    # Extra params
    with_forecasts = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_forecasts")
    )

    # Apply filtering
    filters_serializer = PostFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_posts_feed(qs, user=request.user, **filters_serializer.validated_data)
    # Paginating queryset
    posts = paginator.paginate_queryset(qs, request)

    data = serialize_post_many(
        posts,
        with_forecasts=with_forecasts,
        current_user=request.user,
    )
    print(len(data))

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_detail(request: Request, pk):
    qs = Post.objects.filter(pk=pk)
    posts = serialize_post_many(qs, current_user=request.user, with_forecasts=True)

    if not posts:
        raise NotFound("Post not found")

    return Response(posts[0])


@api_view(["POST"])
def post_create_api_view(request):
    print(request.data)
    serializer = PostWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    post = create_post(**serializer.validated_data, author=request.user)

    return Response(
        serialize_post(post, with_forecasts=False, current_user=request.user),
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT"])
def post_update_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user != post.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = PostSerializer(post, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["DELETE"])
def post_delete_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_delete(permission, raise_exception=True)

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
