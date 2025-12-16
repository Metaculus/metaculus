from rest_framework.exceptions import ValidationError

from users.models import User


def get_user_bots(user: User):
    return User.objects.filter(bot_owner=user).order_by("-is_primary_bot", "created_at")


def create_bot(*, bot_owner: User, username: str, **kwargs) -> User:
    user_bots = list(get_user_bots(bot_owner))

    if len(user_bots) > 5:
        raise ValidationError("User can have only 5 bots")

    is_primary_bot = not any(b.is_primary_bot for b in user_bots)

    bot = User.objects.create_user(
        username=username,
        # TODO: what happens if we send email to empty string? Double-check + exclude!
        email="",
        is_active=True,
        is_bot=True,
        is_primary_bot=is_primary_bot,
        bot_owner=bot_owner,
        language=bot_owner.language,
        app_theme=bot_owner.app_theme,
        newsletter_optin=False,
        **kwargs
    )

    return bot
