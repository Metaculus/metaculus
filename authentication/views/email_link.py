import logging

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from authentication.serializers import ConfirmationTokenSerializer
from authentication.services.common import get_tokens_for_user
from authentication.services.email_link import (
    send_email_link_auth_email,
    verify_email_link_auth,
)
from authentication.services.gated_actions import (
    apply_pending_action,
    clear_pending_action,
    set_pending_action,
    validate_gated_action,
)
from users.models import User
from users.serializers import UserPrivateSerializer
from users.services.username_generator import generate_username
from utils.cloudflare import validate_turnstile_from_request

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def email_link_request_api_view(request):
    """
    Email-link auth request: captures an email (and optionally one gated
    action), creates an unverified user when needed and emails a sign-in link.
    Always responds 204 - the response must not reveal whether an account
    exists (anti-enumeration).
    """
    validate_turnstile_from_request(request)

    email = serializers.EmailField().run_validation(request.data.get("email"))
    redirect_url = request.data.get("redirect_url") or None
    gated_action = request.data.get("action") or None

    action_type, payload = None, None
    if gated_action is not None:
        action_type, payload = validate_gated_action(gated_action)

    user = User.objects.filter(email__iexact=email).first()

    if user and user.is_deactivated:
        # Banned or deactivated: store nothing, send nothing, respond the same.
        logger.info(f"email_link request for blocked user_id={user.id} account ignored")
        return Response(status=status.HTTP_204_NO_CONTENT)

    if user is None:
        user = User.objects.create_user(
            username=generate_username(),
            email=email,
            password=None,  # unusable password: email-link is the only way in
            is_active=False,
            is_bot=False,
            metadata={
                "signup_details": {"method": "email_link", "action_type": action_type}
            },
        )

    if action_type:
        set_pending_action(user.id, action_type, payload)
    else:
        clear_pending_action(user.id)

    send_email_link_auth_email(user, redirect_url)

    logger.info("email_link requested: user=%s action=%s", user.id, action_type)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def email_link_verify_api_view(request):
    """
    Consumes an emailed sign-in link: activates the user when applicable,
    issues JWT tokens and applies the pending gated action. Sign-in is never
    rolled back by an action failure - action outcomes are logged, and the
    user sees the result on the destination page itself.
    """
    serializer = ConfirmationTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = verify_email_link_auth(**serializer.validated_data)
    tokens = get_tokens_for_user(user)
    apply_pending_action(user)

    return Response({"tokens": tokens, "user": UserPrivateSerializer(user).data})
