from django.contrib.auth.models import AbstractUser
from django.db import models

from base.models import TimeStampedModel


class User(TimeStampedModel, AbstractUser):
    # Profile data
    bio = models.TextField(default="", blank=True)
    website = models.CharField(max_length=100, default="", blank=True)
