from django.db import models


class CommentReportType(models.TextChoices):
    SPAM = "spam"
    VIOLATION = "violation"


class TimeWindow(models.TextChoices):
    ALL_TIME = "all_time"
    PAST_WEEK = "past_week"
    PAST_MONTH = "past_month"
    PAST_YEAR = "past_year"
