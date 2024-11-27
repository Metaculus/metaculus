from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.db.models import Q, Case, When, IntegerField
from django.utils.crypto import get_random_string
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.services.subscriptions import (
    disable_global_cp_reminders,
    enable_global_cp_reminders,
)
from users.models import User
from utils.email import send_email_with_template
from utils.frontend import build_frontend_email_change_url


def get_users(
    search: str = None,
) -> User.objects:
    """
    Applies filtering on the User QuerySet
    """

    qs = User.objects.filter(is_active=True)

    # Search
    if search:
        qs = (
            qs.annotate(
                full_match=Case(
                    When(username__iexact=search, then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            )
            .filter(username__icontains=search)
            .order_by("-full_match", "username")
        )

    return qs


def get_users_by_usernames(usernames: list[str]) -> list[User]:
    if not usernames:
        return User.objects.none()

    queries = Q()
    for username in usernames:
        queries |= Q(username__iexact=username)

    users = User.objects.filter(queries).distinct("pk")
    fetched_usernames = {u.username for u in users}

    for username in usernames:
        if username not in fetched_usernames:
            raise ValidationError(f"User {username} does not exist")

    return users


def user_unsubscribe_tags(user: User, tags: list[str]) -> None:
    # Newly excluded tags
    to_disable = set(tags) - set(user.unsubscribed_mailing_tags)
    to_enable = set(user.unsubscribed_mailing_tags) - set(tags)

    # If user wants to disable CP Change reminders
    if MailingTags.FORECASTED_CP_CHANGE in to_disable:
        disable_global_cp_reminders(user)

    if MailingTags.FORECASTED_CP_CHANGE in to_enable:
        enable_global_cp_reminders(user)

    user.unsubscribed_mailing_tags = tags


class EmailChangeTokenGenerator:
    def __init__(self):
        self.signer = TimestampSigner()

    def generate_token(self, user: User, new_email):
        # Create a unique token with the user ID and new email
        token = f"{user.id}:{new_email}:{get_random_string(20)}"
        signed_token = self.signer.sign(token)

        return signed_token

    def validate_token(self, token, max_age=3600):
        token = self.signer.unsign(token, max_age=max_age)

        user_id, new_email, _ = token.split(":")
        return int(user_id), new_email


def generate_email_change_token(user: User, new_email: str):
    if User.objects.filter(email__iexact=new_email).exists():
        raise ValidationError("The email is already in use")

    return EmailChangeTokenGenerator().generate_token(user, new_email)


def change_email_from_token(user: User, token: str):
    try:
        user_id, new_email = EmailChangeTokenGenerator().validate_token(token)
    except (BadSignature, SignatureExpired):
        raise ValidationError("Invalid token")

    if user.id != user_id:
        raise ValidationError("User missmatch")

    if User.objects.filter(email__iexact=new_email).exists():
        raise ValidationError("The email is already in use")

    user = User.objects.get(id=user_id)
    user.email = new_email
    user.save()


def send_email_change_confirmation_email(user: User, new_email: str):
    confirmation_token = generate_email_change_token(user, new_email)
    reset_link = build_frontend_email_change_url(confirmation_token)

    send_email_with_template(
        user.email,
        "Metaculus account email change",
        "emails/change_email_confirm.html",
        context={
            "username": user.username,
            "new_email": new_email,
            "reset_link": reset_link,
        },
    )
