from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, Q
from django.utils import timezone
from sql_util.aggregates import SubqueryAggregate

from questions.constants import QuestionStatus
from questions.types import AggregationMethod
from users.models import User
from utils.models import TimeStampedModel
from utils.the_math.measures import percent_point_function

if TYPE_CHECKING:
    from posts.models import Post
    from scoring.models import Score, ArchivedScore

CDF_SIZE = 201


class QuestionQuerySet(models.QuerySet):
    def annotate_forecasts_count(self):
        return self.annotate(
            forecasts_count=SubqueryAggregate("forecast", aggregate=Count)
        )

    def filter_public(self):
        return self.filter(
            Q(post__default_project__default_permission__isnull=False)
            | Q(group__post__default_project__default_permission__isnull=False)
            | Q(conditional_no__post__default_project__default_permission__isnull=False)
            | Q(
                conditional_yes__post__default_project__default_permission__isnull=False
            )
        )

    def prefetch_related_post(self):
        return self.prefetch_related("related_posts__post")


class QuestionManager(models.Manager.from_queryset(QuestionQuerySet)):
    def get_queryset(self):
        return super().get_queryset()


class Question(TimeStampedModel):
    # typing
    user_forecasts: models.QuerySet["Forecast"]
    aggregate_forecasts: models.QuerySet["AggregateForecast"]
    scores: models.QuerySet["Score"]
    archived_scores: models.QuerySet["ArchivedScore"]
    objects: QuestionQuerySet["Question"]
    id: int

    # Annotated fields
    forecasts_count: int = 0
    request_user_forecasts: list["Forecast"]
    user_scores: list["Score"]
    user_archived_scores: list["ArchivedScore"]

    # utility
    objects: models.Manager["Question"] = QuestionManager()

    # Common fields
    class QuestionType(models.TextChoices):
        BINARY = "binary"
        NUMERIC = "numeric"
        DATE = "date"
        MULTIPLE_CHOICE = "multiple_choice"

    type = models.CharField(max_length=20, choices=QuestionType.choices)
    resolution = models.TextField(null=True, blank=True)
    include_bots_in_aggregates = models.BooleanField(default=False)

    # description fields
    title = models.CharField(max_length=2000)
    description = models.TextField(blank=True)
    resolution_criteria = models.TextField(blank=True)
    fine_print = models.TextField(blank=True)

    # time fields
    open_time = models.DateTimeField(db_index=True, null=True, blank=True)
    scheduled_close_time = models.DateTimeField(
        db_index=True,
        null=False,
        blank=False,
        default=timezone.make_aware(timezone.now().max),
    )
    scheduled_resolve_time = models.DateTimeField(
        db_index=True,
        null=False,
        blank=False,
        default=timezone.make_aware(timezone.now().max),
    )
    actual_resolve_time = models.DateTimeField(db_index=True, null=True, blank=True)
    resolution_set_time = models.DateTimeField(db_index=True, null=True, blank=True)
    actual_close_time = models.DateTimeField(db_index=True, null=True, blank=True)
    cp_reveal_time = models.DateTimeField(null=True, blank=True)

    # continuous range fields
    range_max = models.FloatField(null=True, blank=True)
    range_min = models.FloatField(null=True, blank=True)
    zero_point = models.FloatField(null=True, blank=True)
    open_upper_bound = models.BooleanField(null=True, blank=True)
    open_lower_bound = models.BooleanField(null=True, blank=True)

    # list of multiple choice option labels
    options = ArrayField(models.CharField(max_length=200), blank=True, null=True)

    # Legacy field that will be removed
    possibilities = models.JSONField(null=True, blank=True)

    # Group
    label = models.TextField(blank=True, null=True)
    group = models.ForeignKey(
        "GroupOfQuestions",
        null=True,
        blank=True,
        related_name="questions",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return f"{self.type} {self.title}"

    def get_post(self) -> "Post | None":
        posts = [x.post for x in self.related_posts.all()]

        if len(posts) == 0:
            return None
        if len(posts) == 1:
            return posts[0]
        if len(posts) > 1:
            raise ValueError(f"Question {self.id} has more than one post: {posts}")

    @property
    def status(self) -> QuestionStatus:
        """
        Please note: this status does not represent curation status!
        """

        now = timezone.now()

        if not self.open_time or self.open_time > now:
            return QuestionStatus.UPCOMING

        if self.resolution or (
            self.actual_resolve_time and self.actual_resolve_time < now
        ):
            return QuestionStatus.RESOLVED

        if self.actual_close_time and self.actual_close_time < now:
            return QuestionStatus.CLOSED

        return QuestionStatus.OPEN

    def get_global_leaderboard_dates(self) -> tuple[datetime, datetime] | None:
        # returns the global leaderboard dates that this question counts for
        from scoring.models import global_leaderboard_dates

        forecast_horizon_start = self.open_time
        forecast_horizon_end = self.scheduled_close_time
        if forecast_horizon_start is None or forecast_horizon_end is None:
            return (None, None)
        global_leaderboard_dates = global_leaderboard_dates()

        # iterate over the global leaderboard dates in reverse order
        # to find the shortest interval that this question counts for
        shortest_window = (None, None)
        for gl_start, gl_end in global_leaderboard_dates[::-1]:
            if forecast_horizon_start < gl_start or gl_end < forecast_horizon_start:
                continue
            if forecast_horizon_end > gl_end + timedelta(days=3):
                continue
            if (
                self.resolution_set_time
                and self.resolution_set_time > gl_end + timedelta(days=100)
            ):
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

    def __str__(self):
        return f"Conditional {self.condition} -> {self.condition_child}"


class GroupOfQuestions(TimeStampedModel):
    # typing
    questions: models.QuerySet[Question]

    class GroupOfQuestionsGraphType(models.TextChoices):
        FAN_GRAPH = "fan_graph"
        MULTIPLE_CHOICE_GRAPH = "multiple_choice_graph"

    description = models.TextField(blank=True)
    resolution_criteria = models.TextField(blank=True, null=True)
    fine_print = models.TextField(blank=True, null=True)

    group_variable = models.TextField(blank=True, null=True)
    graph_type = models.CharField(
        max_length=256,
        choices=GroupOfQuestionsGraphType.choices,
        default=GroupOfQuestionsGraphType.MULTIPLE_CHOICE_GRAPH,
    )

    def __str__(self):
        return f"Group of Questions {self.post}"


class Forecast(models.Model):
    # typing
    id: int
    author_id: int

    # times
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
        size=CDF_SIZE,
    )
    # binary prediction
    probability_yes = models.FloatField(null=True)
    # multiple choice prediction
    probability_yes_per_category = ArrayField(models.FloatField(), null=True)

    # continuous prediction - migrated from old version
    distribution_components = ArrayField(
        models.JSONField(null=True),
        size=5,
        null=True,
        help_text="The components for a continuous prediction. Used to generate prediction_values.",
    )

    author = models.ForeignKey(User, models.CASCADE)
    question = models.ForeignKey(
        Question, models.CASCADE, related_name="user_forecasts"
    )
    # TODO: make required
    post = models.ForeignKey(
        "posts.Post",
        models.CASCADE,
        null=True,
        editable=False,
        blank=False,
        related_name="forecasts",
    )

    slider_values = models.JSONField(null=True)

    class Meta:
        indexes = [
            models.Index(fields=["author", "question", "start_time"]),
        ]

    def __str__(self):
        pv = self.get_prediction_values()
        if len(pv) > 64:
            q1, q2, q3 = percent_point_function(pv, [25, 50, 75])
            pvs = f"{round(q2, 5)} ({round(q1, 5)} - {round(q3, 5)})"
        else:
            pvs = str(pv)
        return (
            f"Forecast at {str(self.start_time).split(".")[0]} "
            f"by {self.author.username} on {self.question.id}: {pvs}"
        )

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

    def save(self, **kwargs):
        if not self.post:
            self.post = self.question.get_post()

        return super().save(**kwargs)


class AggregateForecast(models.Model):
    id: int
    question = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_forecasts"
    )
    AggregationMethod = AggregationMethod

    method = models.CharField(max_length=200, choices=AggregationMethod.choices)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(null=True, db_index=True)
    forecast_values = ArrayField(models.FloatField(), max_length=CDF_SIZE)
    forecaster_count = models.IntegerField(null=True)
    interval_lower_bounds = ArrayField(models.FloatField(), null=True)
    centers = ArrayField(models.FloatField(), null=True)
    interval_upper_bounds = ArrayField(models.FloatField(), null=True)
    means = ArrayField(models.FloatField(), null=True)
    histogram = ArrayField(models.FloatField(), null=True, size=100)

    class Meta:
        indexes = [
            models.Index(fields=["question", "start_time"]),
            models.Index(fields=["method", "question", "-start_time"]),
        ]

    def __repr__(self):
        pv = self.get_prediction_values()
        if len(pv) > 64:
            q1, q2, q3 = percent_point_function(pv, [25, 50, 75])
            pvs = f"{round(q2, 5)} ({round(q1, 5)} - {round(q3, 5)})"
        else:
            pvs = str(pv)
        return (
            f"<Forecast at {str(self.start_time).split(".")[0]} "
            f"by {self.method}: {pvs}>"
        )

    def get_cdf(self) -> list[float] | None:
        if len(self.forecast_values) == CDF_SIZE:
            return self.forecast_values

    def get_pmf(self) -> list[float]:
        if len(self.forecast_values) == CDF_SIZE:
            cdf = self.forecast_values
            pmf = [cdf[0]]
            for i in range(1, len(cdf)):
                pmf.append(cdf[i] - cdf[i - 1])
            pmf.append(1 - cdf[-1])
            return pmf
        return self.forecast_values

    def get_prediction_values(self) -> list[float]:
        return self.forecast_values


class QuestionPost(models.Model):
    """
    Postgres View of Post<>Question relations
    """

    post = models.ForeignKey(
        "posts.Post", related_name="related_questions", on_delete=models.DO_NOTHING
    )
    question = models.ForeignKey(
        Question, related_name="related_posts", on_delete=models.DO_NOTHING
    )

    class Meta:
        managed = False
        db_table = "questions_question_post"
