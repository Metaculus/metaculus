import requests
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.db import IntegrityError
from django.db.models import Q, Case, When, IntegerField
from rest_framework.exceptions import ValidationError

from notifications.constants import MailingTags
from posts.services.subscriptions import (
    disable_global_cp_reminders,
    enable_global_cp_reminders,
)
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from users.models import User, UserCampaignRegistration
from users.serializers import UserPrivateSerializer
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


class EmailChangeTokenGenerator(PasswordResetTokenGenerator):
    """
    Token generator for email change that:
    1. Stores the new email in the token (Django's generator can't do this)
    2. Inherits invalidation behavior from PasswordResetTokenGenerator
       (invalidates on password change, email change, login)
    """

    key_salt = "users.services.common.EmailChangeTokenGenerator"

    def __init__(self):
        super().__init__()
        self.signer = TimestampSigner()

    def make_token(self, user: User, new_email: str) -> str:
        """Generate a token that includes the new email."""
        # Use Django's token as the validation component
        validation_token = super().make_token(user)
        # Combine with new_email in a signed payload
        payload = f"{user.id}:{new_email}:{validation_token}"
        return self.signer.sign(payload)

    def check_token(self, user: User, token: str, max_age: int = 3600) -> str | None:
        """
        Validate token and return new_email if valid, None otherwise.
        """
        try:
            payload = self.signer.unsign(token, max_age=max_age)
            user_id, new_email, validation_token = payload.split(":", 2)

            if int(user_id) != user.pk:
                return None

            # Use Django's validation (checks password, last_login, email)
            if not super().check_token(user, validation_token):
                return None

            return new_email
        except (BadSignature, SignatureExpired, ValueError):
            return None


def generate_email_change_token(user: User, new_email: str):
    if User.objects.filter(email__iexact=new_email).exists():
        raise ValidationError("The email is already in use")

    return EmailChangeTokenGenerator().make_token(user, new_email)


def change_email_from_token(user: User, token: str):
    new_email = EmailChangeTokenGenerator().check_token(user, token)
    if new_email is None:
        raise ValidationError("Invalid or expired token")

    if User.objects.filter(email__iexact=new_email).exists():
        raise ValidationError("The email is already in use")

    user.email = new_email
    user.save()


def send_email_change_confirmation_email(user: User, new_email: str):
    confirmation_token = generate_email_change_token(user, new_email)
    reset_link = build_frontend_email_change_url(confirmation_token)

    send_email_with_template(
        user.email,
        "Metaculus Account Email Change",
        "emails/change_email_confirm.html",
        context={
            "username": user.username,
            "new_email": new_email,
            "reset_link": reset_link,
        },
        from_email=settings.EMAIL_HOST_USER,
    )


def register_user_to_campaign(
    user: User, campaign_key: str, campaign_data: dict, project: Project
):
    try:
        UserCampaignRegistration.objects.create(
            user=user, key=campaign_key, details=campaign_data
        )
        if project is not None:
            if project.default_permission is None:
                raise ValidationError("Cannot add user to a private project")

            ProjectUserPermission.objects.create(
                user=user, project=project, permission=ObjectPermission.FORECASTER
            )

        if settings.CAMPAIGN_USER_REGISTRATION_HOOK_KEY_URL_PAIR is not None:
            [key, url] = settings.CAMPAIGN_USER_REGISTRATION_HOOK_KEY_URL_PAIR.split(
                ","
            )

            if key == campaign_key:
                requests.post(
                    url,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json={
                        "user": UserPrivateSerializer(user).data,
                        "registration_data": campaign_data,
                    },
                )
    except IntegrityError:
        raise ValidationError("User already registered")
