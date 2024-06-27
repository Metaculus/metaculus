from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import serializers

from comments.models import Comment
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
    # comments = comments.all()[:20]

    comments = [
        c
        for c in comments.all()
        if ObjectPermission.can_view(get_comment_permission_for_user(c, request.user))
    ]

    data = [{**CommentSerializer(obj).data} for obj in comments]

    return Response(data)
