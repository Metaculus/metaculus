from datetime import timedelta, datetime

import dateutil.parser
from django.contrib.auth.models import AbstractUser, UserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone

from utils.models import TimeStampedModel


class User(TimeStampedModel, AbstractUser):
    # typing
    id: int

    # Profile data
    bio = models.TextField(default="", blank=True)
    is_bot = models.BooleanField(default=False)

    old_usernames = models.JSONField(default=list, null=False)

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
