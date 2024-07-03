from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import serializers, status
from django.shortcuts import get_object_or_404
from datetime import datetime

from posts.models import Post
from questions.models import Forecast
from comments.models import Comment, CommentDiff
from users.models import User
from comments.serializers import CommentSerializer
from comments.services import get_comment_permission_for_user
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
@permission_classes([AllowAny])
def comment_delete_api_view(request: Request, pk: int):
    comment = get_object_or_404(Comment.objects.all(), pk=pk)

    comment.is_soft_deleted = True
    comment.save()

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def comment_create_api_view(request: Request):
    data = request.data
    now = datetime.now()

    author = User.objects.get(id=data["author"])
    post = Post.objects.get(id=data["on_post"])
    parent = None
    if "parent" in data and data["parent"] is not None:
        parent = Comment.objects.get(id=data["parent"])

    included_forecast = None
    if "included_forecast" in data and data["included_forecast"] is not None:
        included_forecast = Forecast.objects.get(id=data["included_forecast"])

    is_private = False 
    if "is_private" in data and data["is_private"] is not None:
        is_private = data["is_private"]

    comment = Comment.objects.create(
        author=author,
        parent=parent,
        is_soft_deleted=False,
        text=data["text"],
        on_post=post,
        included_forecast=included_forecast,
        is_private=is_private,
    )
    comment.save()

    return Response({}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def comment_edit_api_view(request: Request, pk: int):
    import difflib

    differ = difflib.Differ()
    data = request.data
    comment = Comment.objects.get(id=pk)
    author = User.objects.get(id=data["author"])

    diff = list(differ.compare(comment.text.splitlines(), data["text"].splitlines()))
    text_diff = "\n".join(diff)

    comment_diff = CommentDiff.objects.create(
        comment=comment,
        author=author,
        text_diff=text_diff,
    )

    comment.edit_history.append(comment_diff.id)
    comment.text = data["text"]
    comment.save()

    return Response({}, status=status.HTTP_200_OK)
