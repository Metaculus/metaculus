from rest_framework.exceptions import ValidationError

from users.constants import ApiForecastingAccess, DEFAULT_MAX_BOTS
from users.models import User


def get_user_bots(user: User):
    return User.objects.filter(bot_owner=user).order_by("-is_primary_bot", "created_at")


def get_max_bots(user: User) -> int | None:
    """
    Number of bots the user may own. None means unlimited.

    Overridden per user via the `max_bots` key of User.metadata, which lets
    admins lift the limit without a deploy.
    """

    if user.is_superuser:
        return None

    limit = (user.metadata or {}).get("max_bots")

    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 0:
        return DEFAULT_MAX_BOTS

    return limit


def create_bot(*, bot_owner: User, username: str, **kwargs) -> User:
    user_bots = list(get_user_bots(bot_owner))
    max_bots = get_max_bots(bot_owner)

    if max_bots is not None and len(user_bots) >= max_bots:
        raise ValidationError(f"User can have only {max_bots} bots")

    is_primary_bot = not any(b.is_primary_bot for b in user_bots)

    bot = User.objects.create_user(
        username=username,
        email="",
        is_active=True,
        is_bot=True,
        is_primary_bot=is_primary_bot,
        bot_owner=bot_owner,
        language=bot_owner.language,
        app_theme=bot_owner.app_theme,
        newsletter_optin=False,
        api_forecasting_access=ApiForecastingAccess.ENABLED,
        **kwargs,
    )

    return bot
