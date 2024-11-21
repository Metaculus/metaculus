from typing import TYPE_CHECKING
from datetime import timedelta, datetime
import textwrap

import dateutil.parser
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from django.conf import settings
from utils.models import TimeStampedModel
from utils.email import send_email_async

if TYPE_CHECKING:
    from comments.models import Comment
    from posts.models import Post


class User(TimeStampedModel, AbstractUser):
    # typing
    id: int
    comment_set: QuerySet["Comment"]
    posts: QuerySet["Post"]

    # Profile data
    bio = models.TextField(default="", blank=True)
    is_bot = models.BooleanField(default=False)

    old_usernames = models.JSONField(default=list, null=False, editable=False)

    # Social Link
    website = models.CharField(max_length=100, default=None, null=True, blank=True)
    twitter = models.CharField(max_length=100, default=None, null=True, blank=True)
    linkedin = models.CharField(max_length=100, default=None, null=True, blank=True)
    facebook = models.CharField(max_length=100, default=None, null=True, blank=True)
    github = models.CharField(max_length=100, default=None, null=True, blank=True)

    # Forecasting Platform Links
    good_judgement_open = models.CharField(
        max_length=100, default=None, null=True, blank=True
    )
    kalshi = models.CharField(max_length=100, default=None, null=True, blank=True)
    manifold = models.CharField(max_length=100, default=None, null=True, blank=True)
    infer = models.CharField(max_length=100, default=None, null=True, blank=True)
    hypermind = models.CharField(max_length=100, default=None, null=True, blank=True)

    # Personal Details
    occupation = models.CharField(max_length=100, default=None, null=True, blank=True)
    location = models.CharField(max_length=100, default=None, null=True, blank=True)

    # @Hlib TODO: Can you add profile picture + update logic for profile picture images ? (Not urgent)
    profile_picture = models.ImageField(null=True, blank=True, default=None)

    # Subscription settings
    unsubscribed_mailing_tags = ArrayField(
        models.CharField(max_length=200), blank=True, default=list
    )
    hide_community_prediction = models.BooleanField(default=False)

    # Onboarding
    is_onboarding_complete = models.BooleanField(default=False)

    objects: models.Manager["User"] = UserManager()

    class Meta:
        indexes = [
            models.Index(
                models.Func("username", function="UPPER"),
                name="upper_username_idx",
            ),
        ]

    def get_old_usernames(self) -> list[tuple[str, datetime]]:
        return [
            (name, dateutil.parser.parse(date)) for name, date in self.old_usernames
        ]

    def get_formerly_known_as(self) -> str | None:
        if old_usernames := self.get_old_usernames():
            username, date_changed = old_usernames[-1]

            # Don't show old username if changed shortly after registration
            joined_threshold = self.date_joined + timedelta(days=3)
            # Don't show old name if changed over 30 days ago
            change_threshold = timezone.now() - timedelta(days=30)

            if joined_threshold < date_changed and change_threshold < date_changed:
                return username

    def update_username(self, val: str):
        self.old_usernames.append((self.username, timezone.now().isoformat()))
        self.username = val

    def soft_delete(self: "User") -> None:
        # set to inactive
        self.is_active = False

        # set soft delete comments
        self.comment_set.update(is_soft_deleted=True)

        # soft delete posts
        from posts.models import Post

        self.posts.update(curation_status=Post.CurationStatus.DELETED)

        self.save()

        send_email_async.send(
            subject="Your Metaculus Account Has Been Deactivated",
            message=textwrap.dedent(
                """Your Metaculus account has been deactivated by an administrator or an automated system. Possible reasons could include
                - Suspicious activity
                - Spam/Ad/Inappropriate content in comments
                - Spam/Ad/Inappropriate content in profile bio
                - Manual review for bot and spam accounts

                If you believe this was done in error, please contact support@metaculus.com and we will reactivate your account."""
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[self.email],
        )
