from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count, QuerySet, Q, F, Exists, OuterRef
from django.utils import timezone
from django_better_admin_arrayfield.models.fields import ArrayField
from sql_util.aggregates import SubqueryAggregate

from questions.constants import QuestionStatus
from questions.types import AggregationMethod, OptionsHistoryType
from scoring.constants import ScoreTypes
from users.models import User
from utils.models import TimeStampedModel, TranslatedModel

if TYPE_CHECKING:
    from posts.models import Post
    from scoring.models import Score, ArchivedScore

DEFAULT_INBOUND_OUTCOME_COUNT = 200


def validate_options_history(value):
    # Expect: [ (float, [str, ...]), ... ] or equivalent
    if not isinstance(value, list):
        raise ValidationError("Must be a list.")
    for i, item in enumerate(value):
        if (
            not isinstance(item, (list, tuple))
            or len(item) != 2
            or not isinstance(item[0], str)
            or not isinstance(item[1], list)
            or not all(isinstance(s, str) for s in item[1])
        ):
            raise ValidationError(f"Bad item at index {i}: {item!r}")
        try:
            datetime.fromisoformat(item[0])
        except ValueError:
            raise ValidationError(
                f"Bad datetime format at index {i}: {item[0]!r}, must be isoformat string"
            )


class QuestionQuerySet(QuerySet):
    def annotate_forecasts_count(self):
        return self.annotate(
            forecasts_count=SubqueryAggregate("forecast", aggregate=Count)
        )

    def filter_public(self):
        return self.filter(post__default_project__default_permission__isnull=False)


class QuestionManager(models.Manager.from_queryset(QuestionQuerySet)):
    def get_queryset(self):
        return super().get_queryset()


class Question(TimeStampedModel, TranslatedModel):  # type: ignore
    # typing
    user_forecasts: QuerySet["Forecast"]
    aggregate_forecasts: QuerySet["AggregateForecast"]
    scores: QuerySet["Score"]
    archived_scores: QuerySet["ArchivedScore"]
    id: int
    group_id: int | None
    post_id: int | None

    # Annotated fields
    forecasts_count: int = 0
    request_user_forecasts: list["Forecast"]
    user_scores: list["Score"]
    user_archived_scores: list["ArchivedScore"]

    # utility
    objects = QuestionManager()

    # Common fields
    class QuestionType(models.TextChoices):
        BINARY = "binary"
        MULTIPLE_CHOICE = "multiple_choice"
        NUMERIC = "numeric"
        DATE = "date"
        DISCRETE = "discrete"

    type = models.CharField(max_length=20, choices=QuestionType.choices)
    resolution = models.TextField(null=True, blank=True)
    include_bots_in_aggregates = models.BooleanField(default=False)
    question_weight = models.FloatField(default=1.0)
    default_score_type = models.CharField(
        max_length=20,
        choices=ScoreTypes.choices,
        default=ScoreTypes.PEER,
        db_index=True,
        help_text="""Default score type for this question.
        Generally, this should be either "peer" or "spot_peer".
        Determines which score will be most prominently displayed in the UI.
        Also, for Leaderboards that have a "score type" of "default", this question's
        default score type will be the one that contributes to the leaderboard.
        """,
    )
    default_aggregation_method: AggregationMethod = models.CharField(
        max_length=20,
        choices=AggregationMethod.choices,
        default=AggregationMethod.RECENCY_WEIGHTED,
        help_text="""Default aggregation method for this question.
        Determines which aggregation is calculated and presented for this question.
        <br>This should generally be "Recency Weighted", but for very short-term
        questions, or ones where forecasting is done live, "Unweighted" is likely
        a better choice.
        """,
    )

    # description fields
    title = models.CharField(max_length=2000)
    description = models.TextField(blank=True)
    resolution_criteria = models.TextField(blank=True)
    fine_print = models.TextField(blank=True)

    # time fields
    open_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when this question opens for forecasting.
        Defines the beginning of the forecasting period used in scoring. Do not change
        after forecasts have been made.""",
    )
    scheduled_close_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when this question closes for forecasting.
        Defines the end of the forecasting period used in scoring. Do not change
        after forecasts have been made.""",
    )
    scheduled_resolve_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when it is predicted that the resolution will become known.""",
    )
    actual_resolve_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when the resolution actually became known.""",
    )
    resolution_set_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when the resolution was set.""",
    )
    actual_close_time = models.DateTimeField(
        db_index=True,
        null=True,
        blank=True,
        help_text="""Time when the question actually closed.
        This is the minimum of scheduled_close_time and actual_resolve_time once
        the resolution is known.""",
    )
    cp_reveal_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Time when the community prediction is revealed.""",
        db_index=True,
    )
    spot_scoring_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Time when spot scores are evaluated.
        If not set, defaults to cp reveal time.""",
    )

    # continuous fields
    range_min = models.FloatField(
        null=True,
        blank=True,
        help_text="""For Continuous only.
        Minimum inbound value. For Discrete, this is 1/2 a unit's width below the
        displayed lower bound.""",
    )
    range_max = models.FloatField(
        null=True,
        blank=True,
        help_text="""For Continuous only.
        Maximum inbound value. For Discrete, this is 1/2 a unit's width above the
        displayed upper bound.""",
    )
    zero_point = models.FloatField(
        null=True,
        blank=True,
        help_text="""For Continuous only. NOT for Discrete.
        If logarithmically scaled, the value of the zero point.""",
    )
    open_upper_bound = models.BooleanField(
        null=True,
        blank=True,
        help_text="""For Continuous only.
        If there can be a resolution above the range_max.""",
    )
    open_lower_bound = models.BooleanField(
        null=True,
        blank=True,
        help_text="""For Continuous only.
        If there can be a resolution below the range_min.""",
    )
    inbound_outcome_count = models.IntegerField(
        null=True,
        blank=True,
        help_text="""For Discrete only.
        Number of possible outcomes NOT including out of bounds values.""",
    )
    unit = models.CharField(max_length=25, blank=True)

    # multiple choice fields
    options: list[str] | None = ArrayField(
        models.CharField(max_length=200), blank=True, null=True
    )
    options_history: OptionsHistoryType | None = models.JSONField(
        null=True,
        blank=True,
        validators=[validate_options_history],
        help_text="""For Multiple Choice only.
        <br>list of tuples: (isoformat_datetime, options_list). (json stores them as lists)
        <br>Records the history of options over time.
        <br>Initialized with (datetime.min.isoformat(), self.options) upon question creation.
        <br>Updated whenever options are changed.""",
    )

    # Legacy field that will be removed
    possibilities = models.JSONField(null=True, blank=True)

    # Post relation (canonical ownership - every question belongs to exactly one post)
    post = models.ForeignKey(
        "posts.Post",
        null=True,  # Temporarily nullable for migration; should always be set
        # TODO: check if it's still possible to create a question
        blank=False,
        on_delete=models.CASCADE,
        related_name="questions",
        editable=False,
        help_text="The post this question belongs to. Set automatically.",
    )

    # Group
    group_variable = models.CharField(blank=True, null=False)
    label = models.TextField(blank=True, null=False)
    group: "GroupOfQuestions" = models.ForeignKey(
        "GroupOfQuestions",
        null=True,
        blank=True,
        related_name="questions",
        on_delete=models.CASCADE,
    )
    group_rank = models.IntegerField(null=True, blank=True)

    # Indicates whether we triggered "handle_post_open" event
    # And guarantees idempotency of "on post open" evens
    open_time_triggered = models.BooleanField(
        default=False, db_index=True, editable=False
    )

    # Indicates whether we triggered "handle_cp_revealed" event
    # And guarantees idempotency of "on cp revealed" events
    cp_reveal_time_triggered = models.BooleanField(
        default=False, db_index=True, editable=False
    )

    # Jeffrey's Divergence
    movement = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.type} {self.title}"

    def clean(self):
        super().clean()

        # Validate open_time < scheduled_close_time
        if (
            self.open_time is not None
            and self.scheduled_close_time is not None
            and self.open_time >= self.scheduled_close_time
        ):
            raise ValidationError("Scheduled Close Time must be after open_time")

        # Validate open_time < scheduled_resolve_time
        if (
            self.open_time is not None
            and self.scheduled_resolve_time is not None
            and self.open_time >= self.scheduled_resolve_time
        ):
            raise ValidationError("Scheduled Resolve Time must be after open_time")

    def save(self, **kwargs):
        # Ensure resolution is always null or non-empty string
        if self.resolution is not None and self.resolution.strip() == "":
            self.resolution = None

        # Some simple field enforcement
        if self.type not in [
            self.QuestionType.DATE,
            self.QuestionType.NUMERIC,
            self.QuestionType.DISCRETE,
        ]:
            self.range_min = None
            self.range_max = None
            self.open_upper_bound = False
            self.open_lower_bound = False
            self.unit = ""
            self.inbound_outcome_count = None
        if self.type not in [
            self.QuestionType.DATE,
            self.QuestionType.NUMERIC,
        ]:
            self.zero_point = None
        # handle options and options history
        if self.type != self.QuestionType.MULTIPLE_CHOICE:
            self.options = None
        elif not self.options_history:
            # initialize options history on first save
            self.options_history = [(datetime.min.isoformat(), self.options or [])]
        elif self.id and not self.user_forecasts.exists():
            # we're still before forecasts, make
            # sure that the options matches current options
            last_entry = self.options_history[-1]
            self.options_history[-1] = (last_entry[0], self.options or [])
            update_fields = kwargs.get("update_fields", None)
            if update_fields is not None:
                kwargs["update_fields"] = list(update_fields) + ["options_history"]

        return super().save(**kwargs)

    def get_post(self) -> "Post | None":
        """Get the post this question belongs to."""
        if self.post_id:
            return self.post

    @property
    def status(self) -> QuestionStatus:
        """
        Please note: this status does not represent curation status!
        """

        now = timezone.now()

        if not self.scheduled_close_time or not self.open_time or self.open_time > now:
            return QuestionStatus.UPCOMING

        if self.resolution or (
            self.actual_resolve_time and self.actual_resolve_time < now
        ):
            return QuestionStatus.RESOLVED

        if self.scheduled_close_time <= now or (
            self.actual_close_time and self.actual_close_time <= now
        ):
            return QuestionStatus.CLOSED

        return QuestionStatus.OPEN

    @property
    def is_cp_hidden(self):
        return (
            not self.resolution  # always show cp when resolved or annulled
            and self.cp_reveal_time
            and self.cp_reveal_time > timezone.now()
        )

    def get_global_leaderboard_dates(
        self, gl_dates: list[tuple[datetime, datetime]] | None = None
    ) -> tuple[datetime, datetime] | None:
        # returns the global leaderboard dates that this question counts for

        forecast_horizon_start = self.open_time
        forecast_horizon_end = self.scheduled_close_time
        if forecast_horizon_start is None or forecast_horizon_end is None:
            return None
        if gl_dates is None:
            from scoring.models import global_leaderboard_dates

            gl_dates = global_leaderboard_dates()

        # iterate over the global leaderboard dates in reverse order
        # to find the shortest interval that this question counts for
        shortest_window = (None, None)
        for gl_start, gl_end in gl_dates[::-1]:
            if forecast_horizon_start < gl_start or gl_end < forecast_horizon_start:
                continue
            if forecast_horizon_end > gl_end + timedelta(days=3):
                continue
            if (
                self.resolution_set_time or self.scheduled_resolve_time
            ) > gl_end + timedelta(days=100):
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

    def get_inbound_outcome_count(self):
        return (
            self.inbound_outcome_count
            if self.inbound_outcome_count
            else DEFAULT_INBOUND_OUTCOME_COUNT
        )

    def get_spot_scoring_time(self) -> datetime | None:
        if self.spot_scoring_time:
            return self.spot_scoring_time
        elif (
            self.cp_reveal_time
            and self.open_time
            and self.cp_reveal_time > self.open_time
        ):
            return self.cp_reveal_time
        elif self.actual_close_time:
            return self.actual_close_time
        elif self.scheduled_close_time:
            return self.scheduled_close_time
        return None

    def get_forecasters(self) -> QuerySet["User"]:
        return User.objects.filter(
            Exists(
                Forecast.objects.filter(
                    question=self, author=OuterRef("id")
                ).filter_within_question_period()
            )
        )

    class Meta:
        indexes = [
            # Partial indexes for question-level status filtering in feed queries
            # Used by Exists() subqueries in get_posts_feed()
            models.Index(
                fields=["post"],
                name="idx_question_post_unresolved",
                condition=Q(resolution__isnull=True),
            ),
            models.Index(
                fields=["post"],
                name="idx_question_post_resolved",
                condition=Q(resolution__isnull=False),
            ),
            models.Index(
                fields=["post", "scheduled_close_time"],
                name="idx_question_post_close_time",
                condition=Q(resolution__isnull=True),
            ),
            models.Index(
                fields=["post", "scheduled_resolve_time"],
                name="idx_question_post_resolve_time",
                condition=Q(resolution__isnull=True),
            ),
        ]


QUESTION_CONTINUOUS_TYPES = [
    Question.QuestionType.NUMERIC,
    Question.QuestionType.DATE,
    Question.QuestionType.DISCRETE,
]


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

    def get_title(self):
        return f"{self.condition.title} → {self.condition_child.title}"

    def __str__(self):
        return f"Conditional {self.get_title()}"


class GroupOfQuestions(TimeStampedModel, TranslatedModel):  # type: ignore
    class GroupOfQuestionsSubquestionsOrder(models.TextChoices):
        MANUAL = "MANUAL"
        CP_ASC = "CP_ASC"
        CP_DESC = "CP_DESC"

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
    subquestions_order = models.CharField(
        max_length=12,
        choices=GroupOfQuestionsSubquestionsOrder.choices,
        default=GroupOfQuestionsSubquestionsOrder.CP_DESC,
    )

    def __str__(self):
        return f"Group of Questions {self.post}"


class ForecastQuerySet(QuerySet):
    def filter_within_question_period(self):
        """
        Filters forecast which were made within the period when question was active
        """

        return self.filter(
            (
                # Has no end time or an end time after question open time
                Q(end_time__isnull=True)
                | Q(end_time__gt=F("question__open_time"))
            )
            & (
                # Has a start time earlier than the questions actual close time (if it is set)
                (
                    Q(question__actual_close_time__isnull=False)
                    & Q(start_time__lt=F("question__actual_close_time"))
                )
                # or scheduled close time (if actual isn't set)
                | (
                    Q(question__actual_close_time__isnull=True)
                    & Q(start_time__lt=F("question__scheduled_close_time"))
                )
            ),
        )

    def filter_active_at(self, timestamp: datetime):
        return self.filter(start_time__lte=timestamp).filter(
            Q(end_time__gt=timestamp) | Q(end_time__isnull=True)
        )

    def exclude_non_primary_bots(self):
        return self.filter(
            Q(author__is_bot=False) | Q(author__is_primary_bot=True),
        )

    def active(self):
        """
        Returns active forecasts.

        An active forecast is one that:
        - start_time is in the past
        - end_time is either None, or in the future
        - their question is still open (question.actual_close_time is None and
          question.scheduled_close_time is in the future and question.open_time is in the past)
        """
        now = timezone.now()

        # Forecast timing conditions
        forecast_started = Q(start_time__lte=now)
        forecast_not_ended = Q(end_time__isnull=True) | Q(end_time__gt=now)

        # Question status conditions
        question_not_closed = Q(question__actual_close_time__isnull=True)
        question_still_accepting_forecasts = Q(question__scheduled_close_time__gt=now)
        question_opened = Q(question__open_time__lte=now)

        return self.filter(
            forecast_started
            & forecast_not_ended
            & question_not_closed
            & question_still_accepting_forecasts
            & question_opened
        )


class ForecastNoSpamManager(models.Manager.from_queryset(ForecastQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(author__is_spam=False)


class Forecast(models.Model):
    # typing
    id: int
    author_id: int

    # custom manager for filtering out spam by default
    objects = ForecastNoSpamManager()
    all_objects = models.Manager()

    # times
    start_time = models.DateTimeField(
        help_text="Beginning time when this prediction is active",
        db_index=True,
    )
    end_time = models.DateTimeField(
        null=True,
        help_text="Time at which this prediction is no longer active",
        db_index=True,
        blank=True,
    )

    # CDF of a continuous forecast
    # evaluated at [0.0, 0.005, 0.010, ..., 0.995, 1.0] (internal representation)
    continuous_cdf: list[float] = ArrayField(
        models.FloatField(),
        null=True,
        max_length=DEFAULT_INBOUND_OUTCOME_COUNT + 1,
        blank=True,
    )
    # binary prediction
    probability_yes: float = models.FloatField(
        null=True,
        blank=True,
    )
    # multiple choice prediction
    probability_yes_per_category: list[float | None] = ArrayField(
        models.FloatField(null=True),
        null=True,
        blank=True,
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

    class SourceChoices(models.TextChoices):
        API = "api"  # made via the api
        UI = "ui"  # made using the api
        # an automatically assigned forecast
        # usually this means a regular forecast was split
        AUTOMATIC = "automatic"

    # logging the source of the forecast for data purposes
    source = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        choices=SourceChoices.choices,
        default="",
        db_index=True,
    )

    distribution_input = models.JSONField(
        null=True,
        blank=True,
    )

    class Meta:
        indexes = [
            models.Index(fields=["author", "question", "start_time"]),
            models.Index(fields=["author", "post", "question"]),
        ]
        constraints = [
            # end_time > start_time
            models.CheckConstraint(
                check=Q(end_time__isnull=True) | Q(end_time__gt=F("start_time")),
                name="end_time_after_start_time",
            ),
        ]

    def __str__(self):
        from utils.the_math.measures import percent_point_function

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
        """
        gets prediction values for this forecast:
            pmf for binary and multiple choice
            cdf for continuous
        replaces "None"s with "nan"s
        """
        if self.probability_yes:
            return [1 - self.probability_yes, self.probability_yes]
        if self.probability_yes_per_category:
            return [
                float("nan") if v is None else v
                for v in self.probability_yes_per_category
            ]  # replace None with float("nan")
        return self.continuous_cdf

    def get_pmf(self) -> list[float]:
        """
        gets the PMF for this forecast
        replaces "None"s with "nan"s
        """
        if self.probability_yes:
            return [1 - self.probability_yes, self.probability_yes]
        if self.probability_yes_per_category:
            return [
                float("nan") if v is None else v
                for v in self.probability_yes_per_category
            ]  # replace None with float("nan")
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


class AggregateForecastQuerySet(QuerySet):
    def filter_default_aggregation(self):
        return self.filter(method=F("question__default_aggregation_method"))


class AggregateForecast(models.Model):
    id: int
    question_id: int

    # Annotations
    question_type: str

    question = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_forecasts"
    )
    method = models.CharField(max_length=200, choices=AggregationMethod.choices)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(null=True, db_index=True)
    forecast_values: list[float | None] = ArrayField(
        models.FloatField(null=True), max_length=DEFAULT_INBOUND_OUTCOME_COUNT + 1
    )
    forecaster_count: int | None = models.IntegerField(null=True)
    interval_lower_bounds = ArrayField(models.FloatField(), null=True)
    centers = ArrayField(models.FloatField(), null=True)
    interval_upper_bounds = ArrayField(models.FloatField(), null=True)
    means = ArrayField(models.FloatField(), null=True)
    histogram = ArrayField(models.FloatField(), null=True, size=100)

    objects = AggregateForecastQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=["question", "start_time"]),
            models.Index(fields=["method", "question", "-start_time"]),
        ]

    def __str__(self):
        from utils.the_math.measures import percent_point_function

        pv = self.get_prediction_values()
        if len(pv) > 64:
            q1, q2, q3 = percent_point_function(pv, [25, 50, 75])
            pvs = f"{round(q2, 5)} ({round(q1, 5)} - {round(q3, 5)})"
        else:
            pvs = str(pv)
        return (
            f"<Forecast at {str(self.start_time).split(".")[0]} "
            f"by {self.method} on {self.question_id}: {pvs}>"
        )

    def get_pmf(self) -> list[float]:
        """
        gets the PMF for this forecast
        replaces "None"s with "nan"s
        """
        # grab annotation if it exists for efficiency
        question_type = getattr(self, "question_type", self.question.type)
        forecast_values = self.forecast_values
        if question_type == Question.QuestionType.MULTIPLE_CHOICE:
            return [
                float("nan") if v is None else v for v in forecast_values
            ]  # replace None with float("nan")
        if question_type in QUESTION_CONTINUOUS_TYPES:
            cdf: list[float] = forecast_values  # type: ignore
            pmf = [cdf[0]]
            for i in range(1, len(cdf)):
                pmf.append(cdf[i] - cdf[i - 1])
            pmf.append(1 - cdf[-1])
            return pmf
        return forecast_values

    def get_prediction_values(self) -> list[float]:
        """
        gets prediction values for this forecast:
            pmf for binary and multiple choice
            cdf for continuous
        replaces "None"s with "nan"s
        """
        return [float("nan") if v is None else v for v in self.forecast_values]


class UserForecastNotification(models.Model):
    id: int

    user = models.ForeignKey(
        User,
        models.CASCADE,
        related_name="forecast_withdrawal_notifications",
        null=False,
    )
    question = models.ForeignKey(
        Question,
        models.CASCADE,
        related_name="forecast_withdrawal_notifications",
        null=False,
    )
    trigger_time = models.DateTimeField(null=False, db_index=True)
    email_sent = models.BooleanField(default=False, db_index=True)
    forecast = models.ForeignKey(
        Forecast,
        models.CASCADE,
        related_name="notifications",
        null=False,
    )

    class Meta:
        unique_together = ("user", "question")
