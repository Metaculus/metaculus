import difflib

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from comments.models import Comment, CommentDiff
from comments.serializers import CommentSerializer, CommentWriteSerializer
from comments.services import create_comment
from posts.services import get_post_permission_for_user
from projects.permissions import ObjectPermission


@api_view(["GET"])
@permission_classes([AllowAny])
def comments_list_api_view(request: Request):
    # TODO: add pagination?
    # complex to do with multiple nesting levels
    comments = Comment.objects

    post_param = serializers.CharField(allow_null=True).run_validation(
        request.query_params.get("post")
    )
    if post_param:
        comments = comments.filter(on_post=post_param)

    author_param = serializers.CharField(allow_null=True).run_validation(
        request.query_params.get("author")
    )
    if author_param:
        comments = comments.filter(author_id=author_param)

    # filter out private comments, unless they were written by the request user
    if request.user.is_anonymous:
        comments = comments.filter(is_private=False)
    else:
        comments = comments.filter(Q(is_private=False) | Q(author=request.user))

    # for testing, show a max of 20 comments
    comments = comments.all()[:20]

    # comments = [
    #    c
    #    for c in comments.all()
    #    if ObjectPermission.can_view(get_comment_permission_for_user(c, request.user))
    # ]

    data = [{**CommentSerializer(obj).data} for obj in comments.all()]

    return Response(data)


@api_view(["POST"])
def comment_delete_api_view(request: Request, pk: int):
    comment = get_object_or_404(Comment.objects.filter(author=request.user), pk=pk)

    comment.is_soft_deleted = True
    comment.save()

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
def comment_create_api_view(request: Request):
    user = request.user
    serializer = CommentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    on_post = serializer.validated_data["on_post"]
    parent = serializer.validated_data.get("parent")
    include_forecast = serializer.validated_data.pop("include_forecast", None)

    # Small validation
    permission = get_post_permission_for_user(
        parent.on_post if parent else on_post, user=user
    )
    ObjectPermission.can_comment(permission, raise_exception=True)

    included_forecast = (
        (
            on_post.question.forecast_set.filter(author_id=user.id)
            .order_by("-start_time")
            .first()
        )
        if include_forecast
        else None
    )

    create_comment(
        **serializer.validated_data, included_forecast=included_forecast, user=user
    )

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def comment_edit_api_view(request: Request, pk: int):
    # Small validation
    comment = get_object_or_404(Comment.objects.filter(author=request.user), pk=pk)
    text = serializers.CharField().run_validation(request.data.get("text"))

    differ = difflib.Differ()

    diff = list(differ.compare(comment.text.splitlines(), text.splitlines()))
    text_diff = "\n".join(diff)

    comment_diff = CommentDiff.objects.create(
        comment=comment,
        author=comment.author,
        text_diff=text_diff,
    )

    comment.edit_history.append(comment_diff.id)
    comment.text = text
    comment.save()

    return Response({}, status=status.HTTP_200_OK)
