from datetime import datetime, timedelta

from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count
from sql_util.aggregates import SubqueryAggregate

from users.models import User
from utils.models import TimeStampedModel


class QuestionQuerySet(models.QuerySet):
    def annotate_forecasts_count(self):
        return self.annotate(
            forecasts_count=SubqueryAggregate("forecast", aggregate=Count)
        )


class Question(TimeStampedModel):
    class QuestionType(models.TextChoices):
        BINARY = "binary"
        NUMERIC = "numeric"
        DATE = "date"
        MULTIPLE_CHOICE = "multiple_choice"

    type = models.CharField(max_length=20, choices=QuestionType.choices)
    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    # Forecast and scoring related fields set at question creation
    # When the question becomes open for forecasting
    open_time = models.DateTimeField(db_index=True, null=True, blank=True)
    # The planned time when the question closes for forecasting
    scheduled_close_time = models.DateTimeField(
        db_index=True,
        null=False,
        blank=False,
        default=timezone.make_aware(timezone.now().max),
    )
    # The time when the question is scheduled to be resolved
    # affter scheduled_close_time
    scheduled_resolve_time = models.DateTimeField(
        db_index=True,
        null=False,
        blank=False,
        default=timezone.make_aware(timezone.now().max),
    )

    # Forecast and scoring related fields set at question resolution
    # The time when the resolution of the question is known
    actual_resolve_time = models.DateTimeField(db_index=True, null=True, blank=True)
    # The time when the resolution field was set
    resolution_set_time = models.DateTimeField(db_index=True, null=True, blank=True)
    # The time when the question actually closes. For instance, it can close before
    # scheduled_close_time if the resolution becomes known before that point.
    actual_close_time = models.DateTimeField(db_index=True, null=True, blank=True)

    # continuous boundary related fields
    max = models.FloatField(null=True, blank=True)
    min = models.FloatField(null=True, blank=True)
    zero_point = models.FloatField(null=True, blank=True)
    open_upper_bound = models.BooleanField(null=True, blank=True)
    open_lower_bound = models.BooleanField(null=True, blank=True)

    # multiple choice related fields
    options = ArrayField(models.CharField(max_length=200), blank=True, null=True)

    # Legacy field that will be removed
    possibilities = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)

    objects = models.Manager.from_queryset(QuestionQuerySet)()

    # Group
    group = models.ForeignKey(
        "GroupOfQuestions",
        null=True,
        blank=True,
        related_name="questions",
        on_delete=models.CASCADE,
    )
    # typing
    forecast_set: models.QuerySet["Forecast"]

    # Annotated fields
    forecasts_count: int = 0

    def __str__(self):
        return f"{self.type} {self.title}"

    forecast_scoring_ends = models.DateTimeField(db_index=True, null=True, blank=True)

    def set_forecast_scoring_ends(self) -> datetime | None:
        if self.actual_close_time is None or self.actual_resolve_time is None:
            self.forecast_scoring_ends = None
        self.forecast_scoring_ends = min(
            self.actual_close_time, self.actual_resolve_time
        )

    def get_post(self):
        # Back-rel of One2One relations does not populate None values,
        # So we always need to check whether attr exists
        posts = []
        if hasattr(self, "post"):
            posts.append(self.post)

        if hasattr(self, "conditional_no"):
            posts.append(self.conditional_no.post)

        if hasattr(self, "conditional_yes"):
            posts.append(self.conditional_yes.post)

        if self.group:
            posts.append(self.group.post)

        if len(posts) == 0:
            return None
        if len(posts) == 1:
            return posts[0]
        if len(posts) > 1:
            raise ValueError(f"Question {self.id} has more than one post: {posts}")

    def get_global_leaderboard_dates(self) -> tuple[datetime, datetime] | None:
        # returns the global leaderboard dates that this question counts for
        from projects.models import get_global_leaderboard_dates

        forecast_horizon_start = self.open_time
        forecast_horizon_end = self.actual_close_time
        global_leaderboard_dates = get_global_leaderboard_dates()

        # iterate over the global leaderboard dates in reverse order
        # to find the shortest interval that this question counts for
        shortest_window = (None, None)
        for gl_start, gl_end in global_leaderboard_dates[::-1]:
            if forecast_horizon_start < gl_start or gl_end < forecast_horizon_start:
                continue
            if forecast_horizon_end > gl_end + timedelta(days=3):
                continue
            if self.resolution_set_time > gl_end + timedelta(days=100):
                # we allow for a 100 day buffer after the global leaderboard closes
                # for questions to be resolved
                continue
            if shortest_window[0] is None:
                shortest_window = (gl_start, gl_end)
            if gl_end - gl_start < shortest_window[1] - shortest_window[0]:
                shortest_window = (gl_start, gl_end)
        if shortest_window[0]:
            return shortest_window
        return None


class Conditional(TimeStampedModel):
    condition = models.ForeignKey(
        Question, related_name="conditional_conditions", on_delete=models.PROTECT
    )
    condition_child = models.ForeignKey(
        Question, related_name="conditional_children", on_delete=models.PROTECT
    )

    question_yes = models.OneToOneField(
        Question, related_name="conditional_yes", on_delete=models.PROTECT
    )
    question_no = models.OneToOneField(
        Question, related_name="conditional_no", on_delete=models.PROTECT
    )


class GroupOfQuestions(TimeStampedModel):
    pass


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

    slider_values = models.JSONField(null=True)

    def get_prediction_values(self) -> list[float]:
        if self.probability_yes:
            return [1 - self.probability_yes, self.probability_yes]
        if self.probability_yes_per_category:
            return self.probability_yes_per_category
        return self.continuous_cdf

    def get_pmf(self) -> list[float]:
        if self.probability_yes:
            return [1 - self.probability_yes, self.probability_yes]
        if self.probability_yes_per_category:
            return self.probability_yes_per_category
        cdf = self.continuous_cdf
        pmf = [cdf[0]]
        for i in range(1, len(cdf)):
            pmf.append(cdf[i] - cdf[i - 1])
        pmf.append(1 - cdf[-1])
        return pmf
