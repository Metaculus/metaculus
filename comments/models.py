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
)
from django.db.models.functions import Coalesce
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
        KeyFactorDriver, models.PROTECT, related_name="key_factor", null=True
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
        # Used to get rid of the type error which complains
        # about the two Meta classes in the 2 parent classes
        pass


class KeyFactorVote(TimeStampedModel):
    class VoteType(models.TextChoices):
        STRENGTH = "strength"
        DIRECTION = "direction"

    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

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
