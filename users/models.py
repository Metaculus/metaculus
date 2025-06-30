from typing import TYPE_CHECKING
from datetime import timedelta, datetime

import dateutil.parser
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from utils.models import TimeStampedModel

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
    is_bot = models.BooleanField(default=False, db_index=True)
    is_spam = models.BooleanField(default=False, db_index=True)

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
    prediction_expiration_percent = models.IntegerField(default=10, null=True, blank=True)

    # Onboarding
    is_onboarding_complete = models.BooleanField(default=False)

    objects: models.Manager["User"] = UserManager()

    class Meta:
        indexes = [
            models.Index("is_superuser", name="is_superuser_idx"),
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

    def mark_as_spam(self):
        self.is_spam = True
        self.soft_delete()

    def soft_delete(self: "User") -> None:
        # set to inactive
        self.is_active = False

        # set soft delete comments
        self.comment_set.update(is_soft_deleted=True)

        # soft delete posts
        from posts.models import Post

        self.posts.update(curation_status=Post.CurationStatus.DELETED)

        self.save()


class UserCampaignRegistration(TimeStampedModel):
    """
    This model stores registration details for a user as part of an
    campaign/initiative (e.g.: joint project with an external party).
    It includes a reference to the user, a JSON field for extra details,
    and key for tracking registration initiatives/campaigns.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="registration_details"
    )

    details = models.JSONField(default=dict, blank=True, null=False)

    key = models.CharField(
        max_length=200,
        help_text="Key to track the campaign the user registered through.",
    )

    class Meta:
        unique_together = ["user", "key"]

    def __str__(self):
        return f"UserCampaignRegistration {self.user.username}({self.key})"


class UserSpamActivity(TimeStampedModel):
    class SpamContentType(models.TextChoices):
        COMMENT = "comment"
        QUESTION = "question"
        NOTEBOOK = "notebook"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField()
    confidence = models.FloatField()
    content_type = models.CharField(max_length=200, choices=SpamContentType.choices)
    content_id = models.IntegerField(null=True, blank=True)
    text = models.TextField(blank=True)
