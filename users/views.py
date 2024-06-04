from datetime import timedelta

from django.utils.timezone import now as tz_now
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from users.models import User
from users.serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
)


@api_view(["GET"])
def current_user_api_view(request):
    return Response(UserPrivateSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_profile_api_view(request, pk: int):
    qs = User.objects.all()
    user = get_object_or_404(qs, pk=pk)

    return Response(UserPublicSerializer(user).data)


@api_view(["POST"])
def change_username_api_view(request: Request):
    user = request.user
    username = serializers.CharField().run_validation(request.data.get("username"))
    username = validate_username(username)

    if user.username_change_date and (
        (tz_now() - user.username_change_date) < timedelta(days=180)
    ):
        raise ValidationError("can only change username once every 180 days")

    user.update_username(username)
    user.save()

    return Response(UserPrivateSerializer(user).data)


@api_view(["PATCH"])
def update_profile_api_view(request: Request):
    user = request.user
    serializer = UserUpdateProfileSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    if "bio" in serializer.validated_data:
        user.bio = serializer.validated_data["bio"]

    if "website" in serializer.validated_data:
        user.website = serializer.validated_data["website"]

    user.save()

    return Response(UserPrivateSerializer(user).data)
