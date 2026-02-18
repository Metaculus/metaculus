from datetime import timedelta

import requests
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.db import IntegrityError
from django.db.models import Case, IntegerField, Q, QuerySet, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from authentication.jwt_session import revoke_all_user_tokens
from comments.models import Comment
from notifications.constants import MailingTags
from posts.models import Post
from posts.services.common import get_post_permission_for_user
from posts.services.subscriptions import (
    disable_global_cp_reminders,
    enable_global_cp_reminders,
)
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from users.models import User, UserCampaignRegistration
from users.serializers import UserPrivateSerializer
from utils.cache import cached_singleton
from utils.email import send_email_with_template
from utils.frontend import build_frontend_email_change_url


@cached_singleton(timeout=60 * 60)
def get_recently_active_user_ids() -> set[int]:
    """
    Returns the set of user IDs with at least one non-deleted comment
    in the last year. Cached for 1 hour.
    """
    one_year_ago = timezone.now() - timedelta(days=365)
    return set(
        Comment.objects.filter(
            is_soft_deleted=False,
            created_at__gte=one_year_ago,
        )
        .values_list("author_id", flat=True)
        .distinct()
    )


def get_users(
    search: str | None = None,
    post_id: int | None = None,
    user: User | None = None,
) -> QuerySet[User]:
    """
    Applies filtering on the User QuerySet.

    When post_id is provided, users relevant to that post are prioritized:
    - Users who have commented on the post
    - The post author and coauthors
    - Users with explicit permissions on the post's default project

    Non-priority users are filtered to only those who are active and have
    posted a non-deleted comment in the last year.

    The requesting user is passed to verify they have permission to view
    the post before exposing its project members.
    """
    recently_active_user_ids = get_recently_active_user_ids()

    qs = User.objects.filter(is_active=True)

    # Search
    if search:
        qs = qs.annotate(
            full_match=Case(
                When(username__iexact=search, then=1),
                default=0,
                output_field=IntegerField(),
            )
        ).filter(username__icontains=search)

    # Annotate relevance when post_id is provided
    if post_id:
        post = get_object_or_404(Post, pk=post_id)

        # Verify the requesting user has permission to view this post
        permission = get_post_permission_for_user(post, user=user)
        ObjectPermission.can_view(permission, raise_exception=True)

        # Collect user IDs of commenters on this post
        commenter_ids = (
            Comment.objects.filter(on_post_id=post_id, is_soft_deleted=False)
            .values_list("author_id", flat=True)
            .distinct()
        )

        # Collect post author and coauthor IDs
        author_ids = [post.author_id]
        author_ids.extend(post.coauthors.values_list("id", flat=True))

        permission_user_ids = ProjectUserPermission.objects.filter(
            project_id=post.default_project_id
        ).values_list("user_id", flat=True)

        qs = qs.annotate(
            is_commenter=Case(
                When(id__in=commenter_ids, then=1),
                default=0,
                output_field=IntegerField(),
            ),
            is_author=Case(
                When(id__in=author_ids, then=1),
                default=0,
                output_field=IntegerField(),
            ),
            has_permission=Case(
                When(id__in=permission_user_ids, then=1),
                default=0,
                output_field=IntegerField(),
            ),
        )

        if search:
            # Keep priority users + recently active users only
            qs = qs.filter(
                Q(id__in=commenter_ids)
                | Q(id__in=author_ids)
                | Q(id__in=permission_user_ids)
                | Q(id__in=recently_active_user_ids)
            )
            return qs.order_by(
                "-is_commenter",
                "-is_author",
                "-has_permission",
                "-full_match",
                "username",
            )
        else:
            # No search query: return only relevant users
            return qs.filter(
                Q(id__in=commenter_ids)
                | Q(id__in=author_ids)
                | Q(id__in=permission_user_ids)
            ).order_by(
                "-is_commenter",
                "-is_author",
                "-has_permission",
                "username",
            )

    if search:
        # Without post_id, only return recently active users
        qs = qs.filter(id__in=recently_active_user_ids)
        return qs.order_by("-full_match", "username")

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


def change_user_password(user: User, new_password: str) -> None:
    """
    Change user's password and revoke all existing tokens.
    """
    validate_password(new_password, user=user)

    user.set_password(new_password)
    user.save()

    revoke_all_user_tokens(user)


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

    revoke_all_user_tokens(user)


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
