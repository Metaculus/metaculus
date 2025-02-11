import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import Q
from rest_framework import status, serializers
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from authentication.backends import AuthLoginBackend
from authentication.serializers import (
    SignupSerializer,
    ConfirmationTokenSerializer,
    LoginSerializer,
)
from authentication.services import (
    check_and_activate_user,
    send_activation_email,
    send_password_reset_email,
    check_password_reset,
    SignupInviteService,
)
from projects.models import ProjectUserPermission
from projects.permissions import ObjectPermission
from users.models import User
from users.serializers import UserPrivateSerializer
from users.services.common import register_user_to_campaign
from utils.cloudflare import validate_turnstile_from_request

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    login = serializer.validated_data["login"]
    password = serializer.validated_data["password"]

    # The authenticate method below will return None for inactive users
    # We want to show inactive users an error message so they can activate
    # their account, and also to re-send their activation email
    user = User.objects.filter(
        Q(username__iexact=login) | Q(email__iexact=login)
    ).first()

    if user is not None and user.check_password(password) and not user.is_active:
        send_activation_email(user, None)
        raise ValidationError({"user_state": "inactive"})

    user = authenticate(**serializer.validated_data)
    if not user:
        raise ValidationError({"password": ["incorrect login / password"]})

    token, _ = Token.objects.get_or_create(user=user)

    return Response({"token": token.key, "user": UserPrivateSerializer(user).data})


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_api_view(request):
    # Validating captcha
    validate_turnstile_from_request(request)

    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]
    is_bot = serializer.validated_data.get("is_bot", False)

    project = serializer.validated_data.get("add_to_project", None)
    campaign_key = serializer.validated_data.get("campaign_key", None)
    campaign_data = serializer.validated_data.get("campaign_data", None)
    redirect_url = serializer.validated_data.get("redirect_url", None)

    is_active = not settings.AUTH_SIGNUP_VERIFY_EMAIL

    # If sign up only via email invite
    if not settings.PUBLIC_ALLOW_SIGNUP:
        invite_token = serializer.validated_data.get("invite_token")
        # Verify invite token
        SignupInviteService().verify_email(email, invite_token)

        # Activate user
        is_active = True

    if project is not None and project.default_permission is None:
        raise ValidationError("Cannot add user to a private project")

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=is_active,
            is_bot=is_bot,
        )

        if campaign_key is None and project is not None:
            ProjectUserPermission.objects.create(
                user=user, project=project, permission=ObjectPermission.FORECASTER
            )

        is_active = user.is_active
        token = None

        if is_active:
            # We need to treat this as login action, so we should call `authenticate` service as well
            user = authenticate(login=email, password=password)
            token_obj, _ = Token.objects.get_or_create(user=user)
            token = token_obj.key

    if not is_active:
        send_activation_email(user, redirect_url)

    if campaign_key is not None:
        register_user_to_campaign(user, campaign_key, campaign_data, project)

    return Response(
        {
            "is_active": is_active,
            "token": token,
            "user": UserPrivateSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_activation_link_api_view(request):
    login = request.data.get("login")
    redirect_url = request.data.get("redirect_url")

    try:
        user = User.objects.get(
            Q(username__iexact=login) | Q(email__iexact=login), is_active=False
        )
    except User.DoesNotExist:
        raise ValidationError({"email": ["User does not exist or already activated"]})

    send_activation_email(user, redirect_url)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_activate_api_view(request):
    serializer = ConfirmationTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = serializer.validated_data["user_id"]
    token = serializer.validated_data["token"]

    user = check_and_activate_user(user_id, token)
    token, _ = Token.objects.get_or_create(user=user)

    return Response({"token": token.key, "user": UserPrivateSerializer(user).data})


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_token_api_view(request):
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_api_view(request):
    login = serializers.CharField().run_validation(request.data.get("login"))
    user = AuthLoginBackend.find_user(login)

    if user:
        send_password_reset_email(user)
    else:
        logger.debug(f"Cannot find user with login {login}")

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def password_reset_confirm_api_view(request):
    serializer = ConfirmationTokenSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)

    user_id = serializer.validated_data["user_id"]
    token = serializer.validated_data["token"]

    user = check_password_reset(user_id, token)

    if request.method == "POST":
        password = serializers.CharField().run_validation(request.data.get("password"))
        validate_password(password=password)

        user.set_password(password)
        user.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({"token": token.key, "user": UserPrivateSerializer(user).data})

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def invite_user_api_view(request):
    emails = serializers.ListField(child=serializers.EmailField()).run_validation(
        request.data.get("emails")
    )

    for email in emails:
        SignupInviteService().send_email(email)

    return Response(status=status.HTTP_204_NO_CONTENT)
