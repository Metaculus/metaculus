from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.utils import timezone

from utils.models import TimeStampedModel


class User(TimeStampedModel, AbstractUser):
    # Profile data
    bio = models.TextField(default="", blank=True)
    website = models.CharField(max_length=100, default="", blank=True)

    username_change_date = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    def update_username(self, val: str):
        self.username = val
        self.username_change_date = timezone.now()
