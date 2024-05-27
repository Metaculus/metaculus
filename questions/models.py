from django.db import models
from django.contrib.postgres.fields import ArrayField

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
    start_time = models.DateTimeField(
        help_text="Begining time when this prediction is active", db_index=True
    )
    end_time = models.DateTimeField(
        null=True,
        help_text="Time at which this prediction is no longer active",
        db_index=True,
    )
    
    # last 2 elements are represents above upper and, subsequently, below lower bound.
    continuous_prediction_values = ArrayField(
        models.FloatField(),
        null=True,
        size=202, 
    )

    probability_yes = models.FloatField(null=True)
    probability_yes_per_category = ArrayField(models.FloatField(), null=True)

    distribution_components = ArrayField(
        models.JSONField(null=True),
        size=5,
        null=True,
        help_text="The components for a continuous prediction. Used to generate prediction_values.",
    )

    author = models.ForeignKey(User, models.CASCADE)
    question = models.ForeignKey(Question, models.CASCADE)