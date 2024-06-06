import numpy as np
from typing import Optional

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, Subquery, OuterRef, Sum
from sql_util.aggregates import SubqueryAggregate

from projects.models import Project
from users.models import User


class QuestionQuerySet(models.QuerySet):
    def prefetch_projects(self):
        return self.prefetch_related("projects")

    def prefetch_forecasts(self):
        return self.prefetch_related("forecast_set")

    def annotate_predictions_count(self):
        return self.annotate(predictions_count=Count("forecast", distinct=True))

    def annotate_predictions_count__unique(self):
        return self.annotate(
            predictions_count_unique=Count("forecast__author", distinct=True)
        )

    def annotate_vote_score(self):
        return self.annotate(
            vote_score=SubqueryAggregate("votes__direction", aggregate=Sum)
        )

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                Vote.objects.filter(user=user, question=OuterRef("pk")).values(
                    "direction"
                )[:1]
            ),
        )


class Question(models.Model):
    QUESTION_TYPES = (
        ("binary", "binary"),
        ("numeric", "numeric"),
        ("date", "date"),
        ("multiple_choice", "multiple_choice"),
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

    max = models.FloatField(null=True)
    min = models.FloatField(null=True)
    zero_point = models.FloatField(null=True)

    open_upper_bound = models.BooleanField(null=True)
    open_lower_bound = models.BooleanField(null=True)
    options = ArrayField(models.CharField(max_length=200), blank=True, null=True)

    type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    # Legacy field that will be removed
    possibilities = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)

    projects = models.ManyToManyField(Project, related_name="questions")

    _url_id = models.CharField(max_length=200, blank=True, default="")

    objects = models.Manager.from_queryset(QuestionQuerySet)()

    # Annotated fields
    predictions_count: int = 0
    predictions_count_unique: int = 0
    vote_score: int = 0
    user_vote = None

    @property
    def status(self):
        if self.resolved_at:
            return "resolved"
        if self.closed_at:
            return "closed"
        if self.published_at:
            return "active"
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


class Vote(models.Model):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE, related_name="votes")
    question = models.ForeignKey(Question, models.CASCADE, related_name="votes")
    direction = models.SmallIntegerField(choices=VoteDirection.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_question", fields=["user_id", "question_id"]
            ),
        ]


# TODO: find a better place for this
def get_actual_location(question: Question, internal_location: float) -> float:
    if question.zero_point:
        deriv_ratio = (question.max - question.zero_point) / (
            question.min - question.zero_point
        )
        return question.min + (question.max - question.min) * (
            deriv_ratio**internal_location - 1
        ) / (deriv_ratio - 1)
    return question.min + (question.max - question.min) * internal_location
