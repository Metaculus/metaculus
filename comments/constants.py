from django.db import models
from django.utils.translation import gettext_lazy as _


class CommentReportType(models.TextChoices):
    SPAM = "spam", _("Spam")
    VIOLATION = "violation", _("Community guidelines violation")
    AI_GENERATED = "ai_generated", _("AI-generated content")


class TimeWindow(models.TextChoices):
    ALL_TIME = "all_time"
    PAST_WEEK = "past_week"
    PAST_MONTH = "past_month"
    PAST_YEAR = "past_year"
