import json
import logging

from django.conf import settings
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from posts.models import Post, Vote
from posts.serializers import get_subscription_serializer_by_type
from posts.services.common import vote_post
from posts.services.subscriptions import update_post_subscriptions
from questions.models import Forecast
from questions.serializers.common import ForecastWriteSerializer
from questions.services.forecasts import validate_and_create_forecasts
from users.models import User

logger = logging.getLogger(__name__)

# The only guard against arbitrary-size payloads reaching Redis: the RAW
# payload is stored, and DRF serializers silently ignore unknown fields.
# TODO: replace this with stricter validation for forecast serialization
MAX_ACTION_PAYLOAD_BYTES = 64 * 1024
MAX_FORECAST_ITEMS = 10

PENDING_ACTION_KEY = "email_link:action:{user_id}"


def _pending_action_key(user_id: int) -> str:
    return PENDING_ACTION_KEY.format(user_id=user_id)


def set_pending_action(user_id: int, action_type: str, payload) -> None:
    """
    Store (overwrite) the user's single pending gated action - latest wins.
    """
    cache.set(
        _pending_action_key(user_id),
        {
            "type": action_type,
            "payload": payload,
            "requested_at": timezone.now().isoformat(),
        },
        timeout=settings.AUTH_EMAIL_LINK_TIMEOUT,
    )


def clear_pending_action(user_id: int) -> None:
    """
    An action-less request must not leave an older pending action behind.
    """
    cache.delete(_pending_action_key(user_id))


def pop_pending_action(user_id: int) -> dict | None:
    key = _pending_action_key(user_id)
    entry = cache.get(key)
    if entry is None:
        return None
    cache.delete(key)
    return entry


class BaseGatedAction:
    slug: str

    def validate(self, payload):
        """Capture-time validation, so bad payloads are rejected while the
        user is still present. Raises DRF ValidationError; returns the
        validated (coerced) payload."""
        raise NotImplementedError

    def apply(self, user: User, payload) -> None:
        """Click-time application: re-validates state/permissions, then calls
        the same service functions the production endpoints use. Failures
        raise DRF exceptions; apply_pending_action logs them."""
        raise NotImplementedError


def _get_viewable_post(user: User, post_id: int) -> Post:
    return get_object_or_404(Post.objects.filter_permission(user=user), pk=post_id)


class PostVoteAction(BaseGatedAction):
    slug = "post_vote"

    def validate(self, payload) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError(
                {"gated_action": ["post_vote payload must be an object"]}
            )
        return {
            "post": serializers.IntegerField().run_validation(payload.get("post")),
            "direction": serializers.ChoiceField(
                choices=Vote.VoteDirection.choices
            ).run_validation(payload.get("direction")),
        }

    def apply(self, user: User, payload) -> None:
        data = self.validate(payload)
        post = _get_viewable_post(user, data["post"])

        vote_post(post, user, data["direction"])


class PostSubscribeAction(BaseGatedAction):
    slug = "post_subscribe"

    def validate(self, payload) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError(
                {"gated_action": ["post_subscribe payload must be an object"]}
            )
        serializers.IntegerField().run_validation(payload.get("post"))
        items = serializers.ListField().run_validation(payload.get("subscriptions"))
        for item in items:
            serializer = get_subscription_serializer_by_type(item.get("type"))(
                data={k: v for k, v in item.items() if k != "id"}
            )
            serializer.is_valid(raise_exception=True)

        return payload

    def apply(self, user: User, payload) -> None:
        post = _get_viewable_post(user, payload["post"])

        update_post_subscriptions(user, post, payload["subscriptions"])


class ForecastAction(BaseGatedAction):
    slug = "forecast"

    def validate(self, payload) -> list:
        items = serializers.ListField(
            min_length=1, max_length=MAX_FORECAST_ITEMS
        ).run_validation(payload)
        serializer = ForecastWriteSerializer(data=items, many=True)
        serializer.is_valid(raise_exception=True)

        return payload

    def apply(self, user: User, payload) -> None:
        serializer = ForecastWriteSerializer(data=payload, many=True)
        serializer.is_valid(raise_exception=True)

        validate_and_create_forecasts(
            user=user,
            validated_data=serializer.validated_data,
            source=Forecast.SourceChoices.UI,
        )


GATED_ACTIONS: dict[str, BaseGatedAction] = {
    action.slug: action
    for action in [PostVoteAction(), PostSubscribeAction(), ForecastAction()]
}


def validate_gated_action(action) -> tuple[str, object]:
    """
    Capture-time entry point: envelope shape, payload size cap, handler
    validation. Returns (slug, raw_payload) - the RAW payload is what gets
    stored; handlers re-validate it at apply time.
    """
    if not isinstance(action, dict):
        raise ValidationError({"gated_action": ["Must be an object with type/payload"]})

    slug = action.get("type")
    payload = action.get("payload")

    if slug not in GATED_ACTIONS:
        raise ValidationError({"gated_action": [f"Unknown action type: {slug}"]})

    if len(json.dumps(payload, default=str).encode()) > MAX_ACTION_PAYLOAD_BYTES:
        raise ValidationError({"gated_action": ["Payload is too large"]})

    GATED_ACTIONS[slug].validate(payload)

    return slug, payload


def apply_pending_action(user: User) -> None:
    """
    Pop and apply the user's pending gated action. Never raises - sign-in must
    not be rolled back by action failure. The outcome is only logged; the user
    sees the result on the destination page itself.
    """
    entry = pop_pending_action(user.id)

    if entry is None:
        logger.info(f"email_link: no pending action for user={user.id}")
        return

    slug = entry["type"]

    try:
        GATED_ACTIONS[slug].apply(user, entry["payload"])
    except Exception:
        logger.exception(f"Gated action {slug} crashed for user {user.id}")
    else:
        logger.info(f"Gated action {slug} applied for user {user.id}")
