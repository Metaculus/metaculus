from django.contrib.auth import authenticate
from rest_framework import status, serializers
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from authentication.serializers import (
    SignupSerializer,
    SignupActivationSerializer,
    LoginSerializer,
)
from authentication.services import (
    check_and_activate_user,
    send_activation_email,
)
from users.models import User
from users.serializers import UserPrivateSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = authenticate(**serializer.validated_data)
    if not user:
        raise ValidationError({"password": ["incorrect login / password"]})

    token, _ = Token.objects.get_or_create(user=user)

    return Response({"token": token.key, "user": UserPrivateSerializer(user).data})


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_api_view(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]

    user = User.objects.create_user(
        username=username, email=email, password=password, is_active=False
    )

    send_activation_email(user)

    return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_activation_link_api_view(request):
    email = serializers.EmailField().run_validation(request.data.get("email"))

    try:
        user = User.objects.get(email__iexact=email, is_active=False)
    except User.DoesNotExist:
        raise ValidationError({"email": ["User does not exist or already activated"]})

    send_activation_email(user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_activate_api_view(request):
    serializer = SignupActivationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = serializer.validated_data["user_id"]
    token = serializer.validated_data["token"]

    try:
        user = User.objects.get(pk=user_id, is_active=False)
    except User.DoesNotExist:
        raise ValidationError({"token": ["Activation Token is expired or invalid"]})

    check_and_activate_user(user, token)
    token, _ = Token.objects.get_or_create(user=user)

    return Response({"token": token.key, "user": UserPrivateSerializer(user).data})


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_token_api_view(request):
    return Response(status=status.HTTP_204_NO_CONTENT)
