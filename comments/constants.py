from django.db import models


class CommentReportType(models.TextChoices):
    SPAM = "spam"
    VIOLATION = "violation"
