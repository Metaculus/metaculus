from datetime import timedelta, datetime
import random
from typing import TYPE_CHECKING

import dateutil.parser
from django.conf import settings
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from rest_framework.authtoken.models import Token

from utils.models import TimeStampedModel

if TYPE_CHECKING:
    from comments.models import Comment
    from posts.models import Post


class User(TimeStampedModel, AbstractUser):
    class AppTheme(models.TextChoices):
        SYSTEM = "system"
        LIGHT = "light"
        DARK = "dark"

    class InterfaceType(models.TextChoices):
        CONSUMER_VIEW = "consumer_view"
        FORECASTER_VIEW = "forecaster_view"

    # typing
    id: int
    comment_set: QuerySet["Comment"]
    posts: QuerySet["Post"]

    # Profile data
    bio = models.TextField(default="", blank=True)
    is_bot = models.BooleanField(default=False, db_index=True)
    is_spam = models.BooleanField(default=False, db_index=True)
    check_for_spam = models.BooleanField(default=True)

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
    # We use None to indicate that the user has not yet made a choice
    newsletter_optin = models.BooleanField(default=None, null=True)
    unsubscribed_mailing_tags = ArrayField(
        models.CharField(max_length=200), blank=True, default=list
    )
    hide_community_prediction = models.BooleanField(default=False)
    prediction_expiration_percent = models.IntegerField(
        default=10, null=True, blank=True
    )

    # Onboarding
    is_onboarding_complete = models.BooleanField(default=False)

    # App theme preference.
    # This field is nullable to support a smooth transition and preserve user preferences
    # set before this feature was introduced. If `app_theme` is not null, the frontend will
    # ignore any theme stored in LocalStorage and use this value instead.
    # By default, all users (existing and new) will have this field set to null.
    # This ensures that if a user had previously selected a theme (stored in LocalStorage),
    # their choice will be respected. The database value remains null until the user explicitly
    # updates their theme preference via the UI, at which point the value is saved.
    app_theme = models.CharField(
        max_length=32, null=True, blank=True, choices=AppTheme.choices
    )
    interface_type = models.CharField(
        max_length=32,
        default=InterfaceType.FORECASTER_VIEW,
        choices=InterfaceType.choices,
    )
    language = models.CharField(
        max_length=32,
        null=True,
        blank=True,
        choices=settings.LANGUAGES,
    )

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

    def clean_user_data_delete(self: "User") -> None:
        # Update User object
        self.is_active = False
        self.bio = ""
        self.old_usernames = None
        self.website = None
        self.twitter = None
        self.linkedin = None
        self.facebook = None
        self.github = None
        self.good_judgement_open = None
        self.kalshi = None
        self.manifold = None
        self.infer = None
        self.hypermind = None
        self.occupation = None
        self.location = None
        self.profile_picture = None
        self.unsubscribed_mailing_tags = []
        self.language = None
        self.username = "deleted_user-" + "".join(
            random.choices("qwertyuioopasdfghjklzxxcvbnm", k=20)
        )
        self.first_name = ""
        self.last_name = ""
        self.email = ""
        self.set_password(None)
        self.save()

        # wipe comments content
        self.comment_set.update(is_soft_deleted=True, text="")
        # TODO: remove text from translations

        # Token
        Token.objects.filter(user=self).delete()

        # TODO: Conversion rates, event tracking
        # TODO: Session Identifiers
        # TODO: Advertiser cookies and pixels
        # TODO: Facebook or Google login credentials

        # soft delete posts, wipe content fields
        from posts.models import Post

        posts = self.posts.all()
        for post in posts:
            post.curation_status = Post.CurationStatus.DELETED
            post.title = ""
            post.short_title = ""
            post.save()
            # TODO: wipe content from assicated questions and
            # group of questions etc
            # be sure to address translations... Maybe hard delete
            # post & questions if no other user's forecasts
            # and dont do anything if yes other user's forecasts?

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
