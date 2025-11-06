from typing import Iterable

from django.db import models
from django.db.models import (
    Sum,
    OuterRef,
    Subquery,
    QuerySet,
    IntegerField,
    BooleanField,
    Count,
    Exists,
    Value,
    Func,
)
from django.db.models.functions import Coalesce
from django.db.models.lookups import Exact
from django.utils import timezone
from sql_util.aggregates import SubqueryAggregate

from posts.models import Post
from projects.models import Project
from questions.models import Forecast
from users.models import User
from utils.models import TimeStampedModel, TranslatedModel


class CommentQuerySet(models.QuerySet):
    def annotate_vote_score(self):
        return self.annotate(
            vote_score=Coalesce(
                SubqueryAggregate("comment_votes__direction", aggregate=Sum),
                0,
                output_field=IntegerField(),
            )
        )

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                CommentVote.objects.filter(user=user, comment=OuterRef("pk")).values(
                    "direction"
                )[:1]
            ),
        )

    def annotate_author_object(self):
        return self.prefetch_related("author")

    def annotate_included_forecast(self):
        return self.prefetch_related("included_forecast")

    def annotate_cmm_info(self, user):
        changed_my_mind_count = Count("changedmymindentry")
        user_has_changed_my_mind = Value(False, output_field=BooleanField())

        if user and user.is_authenticated:
            # Check if the current user has marked the comment with changed my mind
            user_has_changed_my_mind = Exists(
                ChangedMyMindEntry.objects.filter(comment=OuterRef("pk"), user=user)
            )

        self = self.annotate(
            changed_my_mind_count=changed_my_mind_count,
            user_has_changed_my_mind=user_has_changed_my_mind,
        )
        return self

    def filter_by_user_permission(self, user):
        """
        Filters comments under posts that are available for the user
        """

        return self.filter(
            on_post__in=Post.objects.annotate_user_permission(user).filter(
                user_permission__isnull=False
            )
        )


class Comment(TimeStampedModel, TranslatedModel):
    comment_votes: QuerySet["CommentVote"]
    key_factors: QuerySet["KeyFactor"]

    author = models.ForeignKey(User, models.CASCADE)  # are we sure we want this?
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="child_comments",
    )
    # Thread root comment id
    root = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="thread_comments",
    )
    # auto_now_add=True must be disabled when the migration is run
    is_soft_deleted = models.BooleanField(default=False, db_index=True)
    text = models.TextField(max_length=150_000)
    on_post = models.ForeignKey(
        Post, models.CASCADE, null=True, related_name="comments"
    )
    on_project = models.ForeignKey(Project, models.CASCADE, null=True, blank=True)
    included_forecast = models.ForeignKey(
        Forecast, on_delete=models.SET_NULL, null=True, default=None, blank=True
    )
    is_private = models.BooleanField(default=False, db_index=True)
    edit_history = models.JSONField(default=list, null=False, blank=True)
    is_pinned = models.BooleanField(default=False, db_index=True)

    # The edited_at field updates whenever any comment attribute changes.
    # We need a separate field to track text changes only
    text_edited_at = models.DateTimeField(null=True, blank=True, editable=False)

    # annotated fields
    vote_score: int = 0
    user_vote: int = 0

    objects = models.Manager.from_queryset(CommentQuerySet)()

    class Meta:
        constraints = [
            # Pinned comment could be root only
            models.CheckConstraint(
                check=models.Q(is_pinned=False) | models.Q(root__isnull=True),
                name="comment_check_pinned_comment_is_root",
            )
        ]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.on_post or self.on_project}"

    def save(self, **kwargs):
        if self.parent:
            self.root = self.root or self.parent.root or self.parent

        return super().save(**kwargs)


class CommentDiff(TimeStampedModel):
    comment = models.ForeignKey(Comment, models.CASCADE)
    author = models.ForeignKey(User, models.CASCADE)  # are we sure we want this?
    text_diff = models.TextField()


class CommentVote(TimeStampedModel):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE, related_name="comment_votes")
    comment = models.ForeignKey(Comment, models.CASCADE, related_name="comment_votes")
    direction = models.SmallIntegerField(choices=VoteDirection.choices)

    # auto_now_add=True must be disabled when the migration is run
    # we may need to migrate edited_at to be the created_at field?  who knows.  i guess as long as it's before 2024 then it doesn't matter?  urgh

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_comment", fields=["user_id", "comment_id"]
            ),
        ]


class ChangedMyMindEntry(TimeStampedModel):
    """
    Entry saved whenever an user marks a comment to have changed their mind
    """

    user = models.ForeignKey(User, models.CASCADE)
    comment = models.ForeignKey(Comment, models.CASCADE)
    forecast = models.ForeignKey(Forecast, models.CASCADE, null=True, blank=True)

    class Meta:
        unique_together = ("user", "comment")


class KeyFactorQuerySet(models.QuerySet):
    def for_posts(self, posts: Iterable[Post]):
        return self.filter(comment__on_post__in=posts)

    def filter_active(self):
        return self.filter(is_active=True)

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                KeyFactorVote.objects.filter(
                    user=user, key_factor=OuterRef("pk")
                ).values("score")[:1]
            ),
        )


class ImpactDirection(models.IntegerChoices):
    INCREASE = 1
    DECREASE = -1


class KeyFactorDriver(TimeStampedModel, TranslatedModel):
    text = models.TextField(blank=True)
    impact_direction = models.SmallIntegerField(
        choices=ImpactDirection.choices, null=True, blank=True
    )
    certainty = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Driver {self.text}"


class KeyFactorBaseRate(TimeStampedModel, TranslatedModel):
    class BaseRateType(models.TextChoices):
        FREQUENCY = "frequency"
        TREND = "trend"

    class ExtrapolationType(models.TextChoices):
        LINEAR = "linear"
        EXPONENTIAL = "exponential"
        OTHER = "other"

    reference_class = models.CharField(max_length=256)
    type = models.CharField(choices=BaseRateType.choices, max_length=20)

    # Trend-specific fields
    rate_numerator = models.PositiveIntegerField(blank=True, null=True)
    rate_denominator = models.PositiveIntegerField(blank=True, null=True)

    # Frequency-specific fields
    projected_value = models.FloatField(blank=True, null=True)
    projected_by_year = models.IntegerField(blank=True, null=True)

    unit = models.CharField(max_length=25)
    extrapolation = models.CharField(
        choices=ExtrapolationType.choices, max_length=32, default="", blank=True
    )

    based_on = models.CharField(max_length=256, blank=True, default="")
    source = models.CharField()

    def __str__(self):
        return f"Base Rate {self.type} {self.reference_class}"


class KeyFactorNews(TimeStampedModel):
    itn_article = models.ForeignKey(
        "misc.ITNArticle",
        # We perform a periodic cleanup of ITN articles
        # So we want to set null when this happens
        models.SET_NULL,
        related_name="key_factor_news",
        null=True,
        blank=True,
    )

    # Even if article has an ITN reference,
    # We still duplicate its fields here
    url = models.CharField(default="", max_length=1000)
    title = models.CharField(default="", max_length=256)
    img_url = models.CharField(default="", max_length=1000, blank=True)
    source = models.CharField(default="", max_length=50)
    published_at = models.DateTimeField(default=timezone.now, blank=True)

    impact_direction = models.SmallIntegerField(
        choices=ImpactDirection.choices, null=True, blank=True
    )
    certainty = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"News {self.title[:20]}"


class KeyFactor(TimeStampedModel):
    comment = models.ForeignKey(Comment, models.CASCADE, related_name="key_factors")
    votes_score = models.FloatField(default=0, db_index=True, editable=False)
    is_active = models.BooleanField(default=True, db_index=True)

    # If KeyFactor is specifically linked to the subquestion
    question = models.ForeignKey(
        "questions.Question",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="key_factors",
    )
    # If KeyFactor is linked to the MultipleChoice option
    question_option = models.CharField(
        null=False, blank=True, max_length=32, default=""
    )

    driver = models.OneToOneField(
        KeyFactorDriver,
        models.PROTECT,
        related_name="key_factor",
        null=True,
        unique=True,
        blank=True,
    )
    base_rate = models.OneToOneField(
        KeyFactorBaseRate,
        models.PROTECT,
        related_name="key_factor",
        null=True,
        unique=True,
        blank=True,
    )
    news = models.OneToOneField(
        KeyFactorNews,
        models.PROTECT,
        related_name="key_factor",
        null=True,
        unique=True,
        blank=True,
    )

    def get_votes_count(self) -> int:
        """
        Counts the number of votes for the key factor
        """
        return self.votes.aggregate(Count("id")).get("id__count") or 0

    objects = models.Manager.from_queryset(KeyFactorQuerySet)()

    def __str__(self):
        return f"KeyFactor {getattr(self.comment.on_post, 'title', None)}"

    # Annotated fields
    user_vote: int = None

    class Meta:
        constraints = [
            # Ensure KeyFactor contains only Driver | BaseRate | News column
            models.CheckConstraint(
                name="num_nonnulls_check",
                check=Exact(
                    lhs=Func(
                        "driver",
                        "base_rate",
                        "news",
                        function="num_nonnulls",
                        output_field=IntegerField(),
                    ),
                    rhs=Value(1),
                ),
            )
        ]

    def get_label(self) -> str:
        if self.driver_id:
            return f"Key Factor {self.driver}"
        if self.base_rate_id:
            return f"Key Factor {self.base_rate}"
        if self.news_id:
            return f"Key Factor {self.news}"

        return "Key Factor"


class KeyFactorVote(TimeStampedModel):
    class VoteType(models.TextChoices):
        STRENGTH = "strength"
        DIRECTION = "direction"

    class VoteDirection(models.IntegerChoices):
        UP = 5
        DOWN = -5

    class VoteStrength(models.IntegerChoices):
        NO_IMPACT = 0
        LOW_STRENGTH = 1
        MEDIUM_STRENGTH = 2
        HIGH_STRENGTH = 5

    user = models.ForeignKey(User, models.CASCADE, related_name="key_factor_votes")
    key_factor = models.ForeignKey(KeyFactor, models.CASCADE, related_name="votes")
    score = models.SmallIntegerField(db_index=True)
    # This field will be removed once we decide on the type of vote
    vote_type = models.CharField(
        choices=VoteType.choices, max_length=20, default=VoteType.DIRECTION
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_key_factor",
                fields=["user_id", "key_factor_id"],
            )
        ]
        indexes = [
            models.Index(fields=["key_factor", "score"]),
        ]


class CommentsOfTheWeekEntry(TimeStampedModel):
    comment = models.OneToOneField(
        Comment, models.CASCADE, related_name="comments_of_the_week_entry"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    week_start_date = models.DateField()
    score = models.FloatField(default=0)
    excluded = models.BooleanField(default=False)

    # Snapshots of comment stats at the given point of time
    votes_score = models.IntegerField(default=0, editable=False)
    changed_my_mind_count = models.PositiveIntegerField(default=0, editable=False)
    key_factor_votes_score = models.FloatField(default=0.0, editable=False)


class CommentsOfTheWeekNotification(TimeStampedModel):
    """
    Used to keep track of the last time a notification was sent for
    a given week, so we avoid sending duplicate notifications
    """

    created_at = models.DateTimeField(auto_now_add=True)
    week_start_date = models.DateField()
    email_sent = models.BooleanField(default=False)
