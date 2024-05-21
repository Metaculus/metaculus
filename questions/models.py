from django.db import models
from django.contrib.auth.models import User


class Question(models.Model):
    QUESTION_TYPES = (
        ('binary', 'Binary'),
        ('numeric', 'Numeric Range'),
        ('date', 'Date Range'),
        ('multiple_choice', 'Multiple Choice'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    # Fields for Binary questions
    binary_question = models.BooleanField(null=True, blank=True)

    # Fields for Range questions
    min = models.FloatField(null=True, blank=True)
    max = models.FloatField(null=True, blank=True)

    # Fields for Multiple Choice questions
    multiple_choice_options = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


class Forecast(models.Model):
    pass


