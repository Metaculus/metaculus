import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from authentication.backends import AuthLoginBackend
from authentication.jwt_session import (
    refresh_tokens_with_grace_period,
    revoke_session,
    SessionAccessToken,
)
from authentication.models import ApiKey
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
    get_tokens_for_user,
)
from projects.models import ProjectUserPermission
from projects.permissions import ObjectPermission
from users.models import User
from users.serializers import UserPrivateSerializer, validate_username
from users.services.common import register_user_to_campaign, change_user_password
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
    user = AuthLoginBackend.find_user(login)

    if user and user.check_can_activate() and user.check_password(password):
        send_activation_email(user, None)
        raise ValidationError({"user_state": "inactive"})

    user = authenticate(**serializer.validated_data)
    if not user:
        raise ValidationError({"password": ["incorrect login / password"]})

    tokens = get_tokens_for_user(user)

    return Response({"tokens": tokens, "user": UserPrivateSerializer(user).data})


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

    project = serializer.validated_data.get("add_to_project", None)
    campaign_key = serializer.validated_data.get("campaign_key", None)
    campaign_data = serializer.validated_data.get("campaign_data", None)
    redirect_url = serializer.validated_data.get("redirect_url", None)
    language = serializer.validated_data.get("language", None)
    app_theme = serializer.validated_data.get("app_theme", None)
    newsletter_optin = serializer.validated_data.get("newsletter_optin", None)

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
            is_bot=False,
            language=language,
            app_theme=app_theme,
            newsletter_optin=newsletter_optin,
        )

        if campaign_key is None and project is not None:
            ProjectUserPermission.objects.create(
                user=user, project=project, permission=ObjectPermission.FORECASTER
            )

        is_active = user.is_active
        tokens = None

        if is_active:
            # We need to treat this as login action, so we should call `authenticate` service as well
            user = authenticate(login=email, password=password)
            tokens = get_tokens_for_user(user)

    if not is_active:
        send_activation_email(user, redirect_url)

    if campaign_key is not None:
        register_user_to_campaign(user, campaign_key, campaign_data, project)

    return Response(
        {
            "is_active": is_active,
            "user": UserPrivateSerializer(user).data,
            "tokens": tokens,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_simplified_api_view(request):
    auth_token = serializers.CharField().run_validation(request.data.get("auth_token"))

    if (
        not settings.AUTH_SIGNUP_SIMPLIFIED_TOKEN
        or auth_token != settings.AUTH_SIGNUP_SIMPLIFIED_TOKEN
    ):
        raise ValidationError("Simplified signup flow is not available")

    username = serializers.CharField().run_validation(request.data.get("username"))
    validate_username(username)

    user = User.objects.create_user(
        username=username,
        email=f"autouser+{username}@metaculus.com",
        is_active=True,
        is_bot=False,
        is_onboarding_complete=True,
        check_for_spam=True,
        newsletter_optin=False,
        last_login=timezone.now(),
    )

    tokens = get_tokens_for_user(user)

    return Response(
        {
            "is_active": user.is_active,
            "user": UserPrivateSerializer(user).data,
            "tokens": tokens,
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
    tokens = get_tokens_for_user(user)

    return Response({"tokens": tokens, "user": UserPrivateSerializer(user).data})


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
        change_user_password(user, password)

        tokens = get_tokens_for_user(user)

        return Response({"tokens": tokens, "user": UserPrivateSerializer(user).data})

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def invite_user_api_view(request):
    emails = serializers.ListField(child=serializers.EmailField()).run_validation(
        request.data.get("emails")
    )

    for email in emails:
        SignupInviteService().send_email(request.user, email)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def api_key_api_view(request):
    """Get the API key for the authenticated user if it exists."""
    try:
        api_key = ApiKey.objects.get(user=request.user)
        return Response({"key": api_key.key})
    except ApiKey.DoesNotExist:
        return Response({"key": None})


@api_view(["POST"])
def api_key_rotate_api_view(request):
    """Create or rotate the API key for the authenticated user."""
    ApiKey.objects.filter(user=request.user).delete()
    api_key = ApiKey.objects.create(user=request.user)

    return Response({"key": api_key.key}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def exchange_legacy_token_api_view(request):
    """
    Exchange a legacy DRF auth token for new JWT tokens.

    DEPRECATED: This endpoint exists only for backward compatibility during
    the migration period. It should be removed after the grace period (30 days).
    """
    token = serializers.CharField().run_validation(request.data.get("token"))

    try:
        token_obj = ApiKey.objects.get(key=token)
    except ApiKey.DoesNotExist:
        raise ValidationError({"token": ["Invalid token"]})

    user = token_obj.user
    if not user.is_active:
        raise ValidationError({"token": ["User account is inactive"]})

    tokens = get_tokens_for_user(user)

    return Response({"tokens": tokens})


@api_view(["POST"])
@permission_classes([AllowAny])
def token_refresh_api_view(request):
    """
    Custom token refresh endpoint with:
    1. Grace period deduplication for concurrent requests
    2. Timestamp-based token invalidation
    """

    refresh_token = request.data.get("refresh")
    if not refresh_token:
        raise ValidationError({"refresh": ["This field is required."]})

    try:
        tokens = refresh_tokens_with_grace_period(refresh_token)
    except TokenError as e:
        raise InvalidToken(e.args[0]) from e

    return Response(tokens)


@api_view(["POST"])
def logout_api_view(request):
    """
    Logout endpoint that revokes the current session.
    Accepts the access token in Authorization header to extract session_id.
    """

    jwt_auth = JWTAuthentication()
    header = jwt_auth.get_header(request)

    if header:
        raw_token = jwt_auth.get_raw_token(header)

        if raw_token:
            token = SessionAccessToken(raw_token)
            session_id = token.get("session_id")
            if session_id:
                revoke_session(session_id)

    return Response(status=status.HTTP_204_NO_CONTENT)
