from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from comments.models import Comment
from projects.serializers import CommentSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def comments_list_api_view(request: Request):
    comments = Comment.objects

    data = [{**CommentSerializer(obj).data} for obj in comments.all()]

    return Response(data)
