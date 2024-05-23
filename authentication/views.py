from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from authentication.serializers import SignupSerializer, SignupActivationSerializer
from authentication.services import (
    check_and_activate_user,
    generate_user_activation_link,
)
from users.models import User


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_api_view(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]

    user = User.objects.create_user(username=username, email=email, password=password)

    # TODO: send email, so printing link for now
    activation_url = generate_user_activation_link(user)
    print(activation_url)

    return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_activate_api_view(request):
    serializer = SignupActivationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = serializer.validated_data["user_id"]
    token = serializer.validated_data["token"]

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise ValidationError("User does not exist")

    check_and_activate_user(user, token)

    return Response(status=status.HTTP_204_NO_CONTENT)
