from datetime import datetime
from typing import TYPE_CHECKING

import django
from django.contrib.postgres.fields import ArrayField
from django.db import models

from projects.models import Project
from users.models import User
from utils.models import TimeStampedModel

if TYPE_CHECKING:
    from comments.models import Comment


class QuestionQuerySet(models.QuerySet):
    pass


class Question(TimeStampedModel):
    class QuestionType(models.TextChoices):
        BINARY = "binary"
        NUMERIC = "numeric"
        DATE = "date"
        MULTIPLE_CHOICE = "multiple_choice"

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=QuestionType.choices)

    description = models.TextField(blank=True)

    # TODO: Should it be post or question level?
    closed_at = models.DateTimeField(db_index=True, null=True)
    resolved_at = models.DateTimeField(null=True)

    max = models.FloatField(null=True)
    min = models.FloatField(null=True)
    zero_point = models.FloatField(null=True)

    open_upper_bound = models.BooleanField(null=True)
    open_lower_bound = models.BooleanField(null=True)
    options = ArrayField(models.CharField(max_length=200), blank=True, null=True)

    # Legacy field that will be removed
    possibilities = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)

    objects = models.Manager.from_queryset(QuestionQuerySet)()

    # Annotated fields
    predictions_count: int = 0
    nr_forecasters: int = 0
    vote_score: int = 0
    user_vote = None

    @property
    def status(self):
        if (
            self.resolution
            and self.resolved_at
            and self.resolved_at < django.utils.timezone.now()
        ):
            return "resolved"
        if self.closed_at and self.closed_at < django.utils.timezone.now():
            return "closed"
        if self.post.published_at:
            return "active"
        print(self.__dict__)
        print(f"!!\n\nWrong status for question: {self.id}\n\n!!")
        return "active"


class Forecast(models.Model):
    start_time = models.DateTimeField(
        help_text="Begining time when this prediction is active", db_index=True
    )
    end_time = models.DateTimeField(
        null=True,
        help_text="Time at which this prediction is no longer active",
        db_index=True,
    )

    # CDF of a continuous forecast
    # evaluated at [0.0, 0.005, 0.010, ..., 0.995, 1.0] (internal representation)
    continuous_cdf = ArrayField(
        models.FloatField(),
        null=True,
        size=201,
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

    def get_prediction_values(self) -> list[float]:
        if self.probability_yes:
            return [1 - self.probability_yes, self.probability_yes]
        if self.probability_yes_per_category:
            return self.probability_yes_per_category
        return self.continuous_cdf
