from django.db import models


class CommentReportType(models.TextChoices):
    SPAM = "span"
    VIOLATION = "violation"
