from datetime import timedelta, datetime
from typing import TYPE_CHECKING

import dateutil.parser
from django.conf import settings
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models, transaction
from django.db.models import QuerySet
from django.utils import timezone
from rest_framework.authtoken.models import Token
from social_django.models import UserSocialAuth

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

    class ApiAccessTier(models.TextChoices):
        RESTRICTED = "restricted", "Restricted"
        UNRESTRICTED = "unrestricted", "Unrestricted"

    api_access_tier = models.CharField(
        max_length=32,
        choices=ApiAccessTier.choices,
        default=ApiAccessTier.RESTRICTED,
        help_text="Indicates the API access tier for the user.",
    )

    # Metadata - to update the intended use of this field, update description in Admin
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text=(
            "Optional. This is a field for storing any extra data unique to this user. "
            "Structure of this field is not enforced, but should be a dictionary with specific keys. See description in admin panel for an example."
        ),
    )

    # Bot properties
    is_bot = models.BooleanField(default=False, db_index=True)
    is_primary_bot = models.BooleanField(
        default=False,
        db_index=True,
        help_text=(
            "Marks the user’s primary bot. Only the primary bot can post public comments, "
            "be eligible for prizes, count toward peer scores, "
            "and appear on leaderboards."
        ),
    )
    bot_owner = models.ForeignKey(
        "self",
        related_name="bots",
        null=True,
        blank=True,
        # TODO: what should we do if user deletes their own profile?
        on_delete=models.PROTECT,
        help_text="The human owner of the bot. This property can only be changed for bot users.",
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
        constraints = [
            models.CheckConstraint(
                check=models.Q(is_bot=True) | models.Q(bot_owner__isnull=True),
                name="user_bot_owner_only_for_bots",
                violation_error_message="Bot owner can be set only for bot account",
            ),
            models.CheckConstraint(
                check=models.Q(is_bot=True) | models.Q(is_primary_bot=False),
                name="user_is_primary_bot_only_for_bots",
                violation_error_message="Is Primary Bot could be set only for bot account",
            ),
            models.UniqueConstraint(
                fields=["bot_owner"],
                condition=models.Q(is_primary_bot=True),
                name="unique_primary_bot_per_bot_owner",
                violation_error_message="Bot owner could have only one primary bot",
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

        from posts.models import Post

        # set soft delete comments
        comments = self.comment_set.all()
        posts: QuerySet[Post] = Post.objects.filter(comments__in=comments).distinct()
        comments.update(is_soft_deleted=True)
        # update comment counts on said questions
        for post in posts:
            post.update_comment_count()

        # soft delete user's authored posts
        self.posts.update(curation_status=Post.CurationStatus.DELETED)

        self.save()

    @transaction.atomic
    def clean_user_data_delete(self: "User") -> None:
        # Update User object
        self.is_active = False
        self.bio = ""
        self.old_usernames = []
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
        self.username = "deleted_user-" + str(self.id)
        self.first_name = ""
        self.last_name = ""
        self.email = ""
        self.set_password(None)
        self.save()

        # Comments
        self.comment_set.filter(is_private=True).delete()
        # don't touch public comments

        # Token
        Token.objects.filter(user=self).delete()

        # Social Auth login credentials
        UserSocialAuth.objects.filter(user=self).delete()

        # Posts (Notebooks/Questions)
        from posts.models import Post

        def hard_delete_post(post: Post):
            if question := post.question:
                question.delete()
            if group_of_questions := post.group_of_questions:
                group_of_questions.delete()
            if conditional := post.conditional:
                conditional.delete()
            if notebook := post.notebook:
                notebook.delete()
            post.delete()

        posts = self.posts.all()
        for post in posts:
            # keep if there is at least one non-author comment
            if post.comments.exclude(author=self).exists():
                continue
            # keep if there is at least one non-author forecast
            if post.forecasts.exclude(author=self).exists():
                continue
            hard_delete_post(post)


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
