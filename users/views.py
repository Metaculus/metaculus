import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from authentication.models import ApiKey
from authentication.services import get_tokens_for_user, send_password_reset_email
from projects.models import Project
from users.models import User, UserSpamActivity
from users.serializers import (
    UserPrivateSerializer,
    UserPublicSerializer,
    validate_username,
    UserUpdateProfileSerializer,
    UserFilterSerializer,
    PasswordChangeSerializer,
    EmailChangeSerializer,
    UserCampaignRegistrationSerializer,
    BotUpdateProfileSerializer,
    validate_username_change,
)
from users.services.common import (
    get_users,
    user_unsubscribe_tags,
    send_email_change_confirmation_email,
    change_email_from_token,
    register_user_to_campaign,
    change_user_password,
)
from utils.paginator import LimitOffsetPagination
from utils.tasks import email_user_their_data_task
from .services.bots_management import get_user_bots, create_bot
from .services.profile_stats import serialize_user_stats
from .services.spam_detection import (
    check_profile_update_for_spam,
    send_deactivation_email,
)

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def mark_as_spam_user_api_view(request, pk):
    user_to_mark_as_spam: User = get_object_or_404(User, pk=pk)
    user_to_mark_as_spam.mark_as_spam()
    return Response(status=status.HTTP_200_OK)


@api_view(["GET"])
def current_user_api_view(request):
    """
    A lightweight profile data of the current user
    Should contain minimum profile data without heavy calcs
    """

    return Response(UserPrivateSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def user_profile_api_view(request, pk: int):
    current_user = request.user

    qs = User.objects.all()
    if not current_user.is_staff:
        qs = qs.filter(is_active=True, is_spam=False)

    user = get_object_or_404(qs, pk=pk)

    # Basic profile data
    profile = UserPublicSerializer(user).data

    if current_user and current_user.is_staff:
        profile.update(
            {"spam_count": UserSpamActivity.objects.filter(user=user).count()}
        )

    # Performing slow but cached profile request
    profile.update(serialize_user_stats(user))

    return Response(profile)


@api_view(["GET"])
@permission_classes([AllowAny])
def users_list_api_view(request):
    paginator = LimitOffsetPagination()

    # Apply filtering
    filters_serializer = UserFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_users(**filters_serializer.validated_data)

    # Paginating queryset
    qs = paginator.paginate_queryset(qs, request)

    return paginator.get_paginated_response(UserPublicSerializer(qs, many=True).data)


@api_view(["POST"])
def change_username_api_view(request: Request):
    user = request.user
    username = serializers.CharField().run_validation(request.data.get("username"))
    username = validate_username(username)

    if old_usernames := user.get_old_usernames():
        _, change_date = old_usernames[0]

        if (timezone.now() - change_date) < timedelta(days=180):
            raise ValidationError("can only change username once every 180 days")

    user.update_username(username)
    user.save()

    return Response(UserPrivateSerializer(user).data)


@api_view(["PATCH"])
def update_profile_api_view(request: Request) -> Response:
    user: User = request.user
    serializer: UserUpdateProfileSerializer = UserUpdateProfileSerializer(
        user, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)

    is_spam, _ = check_profile_update_for_spam(user, serializer)

    if is_spam:
        user.mark_as_spam()
        send_deactivation_email(user.email)
        return Response(
            data={
                "message": "This bio seems to be spam. Please contact "
                "support@metaculus.com if you believe this was a mistake.",
                "error_code": "SPAM_DETECTED",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    metaculus_news_subscription: bool | None = serializer.validated_data.pop(
        "metaculus_news_subscription", None
    )
    if metaculus_news_subscription is not None:
        news_project = Project.objects.filter(slug="platform").first()
        if news_project:
            if metaculus_news_subscription:
                user.project_subscriptions.get_or_create(project=news_project)
            else:
                user.project_subscriptions.filter(project=news_project).delete()

    unsubscribe_tags: list[str] | None = serializer.validated_data.get(
        "unsubscribed_mailing_tags"
    )
    if unsubscribe_tags is not None:
        user_unsubscribe_tags(user, unsubscribe_tags)
    serializer.save()
    return Response(UserPrivateSerializer(user).data)


@api_view(["POST"])
def password_change_api_view(request):
    user = request.user

    serializer = PasswordChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    password = serializer.validated_data["password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(password):
        raise ValidationError({"password": "Current password is incorrect"})

    change_user_password(user, new_password)

    tokens = get_tokens_for_user(user)
    return Response(tokens)


@api_view(["POST"])
def send_set_password_email_api_view(request):
    user = request.user

    if user.has_usable_password():
        raise ValidationError({"message": "User already has a password set"})

    send_password_reset_email(user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def email_change_api_view(request):
    user = request.user

    serializer = EmailChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    password = serializer.validated_data["password"]
    new_email = serializer.validated_data["email"]

    if not user.check_password(password):
        raise ValidationError({"password": "Invalid password"})

    send_email_change_confirmation_email(user, new_email)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def email_me_my_data_api_view(request):
    user = request.user
    email_user_their_data_task.send(user_id=user.id)
    return Response({"message": "Email scheduled to be sent"}, status=200)


@api_view(["POST"])
def email_change_confirm_api_view(request):
    token = serializers.CharField().run_validation(request.data.get("token"))
    change_email_from_token(request.user, token)

    tokens = get_tokens_for_user(request.user)
    return Response(tokens)


@api_view(["POST"])
def register_campaign(request):
    user = request.user
    serializer = UserCampaignRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    project = serializer.validated_data.get("add_to_project", None)
    campaign_data = serializer.validated_data["details"]
    campaign_key = serializer.validated_data["key"]

    register_user_to_campaign(
        user, campaign_key=campaign_key, campaign_data=campaign_data, project=project
    )

    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def create_bot_api_view(request: Request):
    user: User = request.user

    if user.is_bot:
        raise ValidationError("Sorry, we’re not ready yet for bots to create bots")

    username = serializers.CharField().run_validation(request.data.get("username"))
    username = validate_username(username)

    bot = create_bot(bot_owner=user, username=username)
    token, _ = ApiKey.objects.get_or_create(user=bot)

    return Response({"token": token.key, "user": UserPrivateSerializer(bot).data})


@api_view(["PATCH"])
def update_bot_profile_api_view(request: Request, pk: int):
    user: User = request.user
    # Check user bot permissions
    bot = get_object_or_404(get_user_bots(user), pk=pk)

    serializer = BotUpdateProfileSerializer(bot, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    is_spam, _ = check_profile_update_for_spam(bot, serializer)

    if is_spam:
        user.mark_as_spam()
        send_deactivation_email(user.email)

        return Response(
            data={
                "message": "This bio seems to be spam. Please contact "
                "support@metaculus.com if you believe this was a mistake.",
                "error_code": "SPAM_DETECTED",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    username = serializer.validated_data.pop("username", None)

    if username and username != bot.username:
        username = validate_username_change(bot, username)
        bot.update_username(username)
        bot.save()

    serializer.save()
    return Response(UserPrivateSerializer(bot).data)


@api_view(["GET"])
def my_bots_api_view(request: Request):
    bots = get_user_bots(request.user)

    return Response(UserPrivateSerializer(bots, many=True).data)


@api_view(["GET"])
def bot_token_api_view(request: Request, pk: int):
    bot = get_object_or_404(get_user_bots(request.user), pk=pk)
    token, _ = ApiKey.objects.get_or_create(user=bot)

    return Response({"token": token.key})


@api_view(["POST"])
def bot_jwt_api_view(request: Request, pk: int):
    """
    Get JWT tokens to impersonate a bot account.
    Returns access and refresh tokens for the bot.
    """

    bot = get_object_or_404(get_user_bots(request.user), pk=pk)
    tokens = get_tokens_for_user(bot)

    return Response(tokens)
