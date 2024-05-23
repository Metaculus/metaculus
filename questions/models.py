from django.db import models

from users.models import User


class Question(models.Model):
    QUESTION_TYPES = (
        ("binary", "Binary"),
        ("numeric", "Numeric Range"),
        ("date", "Date Range"),
        ("multiple_choice", "Multiple Choice"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, models.CASCADE, related_name="submitted_questions")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(db_index=True, null=True)
    approved_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(db_index=True, null=True)
    resolved_at = models.DateTimeField(null=True)

    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
    )

    type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    possibilities = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)

    _url_id = models.CharField(max_length=200, blank=True, default="")


class Forecast(models.Model):
    pass
