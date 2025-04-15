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
    text = models.TextField()
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


class KeyFactor(TimeStampedModel, TranslatedModel):
    comment = models.ForeignKey(Comment, models.CASCADE, related_name="key_factors")
    text = models.TextField(blank=True)
    votes_score = models.IntegerField(default=0, db_index=True, editable=False)
    is_active = models.BooleanField(default=True, db_index=True)

    def get_votes_score(self) -> int:
        """
        Aggregate function applies only to A-type Votes.
        B and C types can't be aggregated this way, so we exclude them for now.
        TODO: This may need to be revisited in the future for broader vote type support.
        """

        return (
            self.votes.filter(vote_type=KeyFactorVote.VoteType.A_UPVOTE_DOWNVOTE)
            .aggregate(Sum("score"))
            .get("score__sum")
            or 0
        )

    def update_vote_score(self):
        self.votes_score = self.get_votes_score()
        self.save(update_fields=["votes_score"])

        return self.votes_score

    objects = models.Manager.from_queryset(KeyFactorQuerySet)()

    # Annotated placeholders
    vote_type: str = None

    def __str__(self):
        return f"KeyFactor {getattr(self.comment.on_post, 'title', None)}: {self.text}"

    class Meta:
        # Used to get rid of the type error which complains
        # about the two Meta classes in the 2 parent classes
        pass


class KeyFactorVote(TimeStampedModel):
    class VoteType(models.TextChoices):
        A_UPVOTE_DOWNVOTE = "a_updown"
        B_TWO_STEP_SURVEY = "b_2step"
        C_LIKERT_SCALE = "c_likert"

    class VoteScore(models.IntegerChoices):
        UP = 1
        DOWN = -1
        # Using a simple integer value to encode scores for both B and C options
        # B and C are conceptually on different scales than A, because they should
        # capture the change in probability caused by the key factor, and not whether
        # the key factor is relevant or not (as the UP/DOWN vote type does)
        # But we do use the same field to store these given this is temporary and simpler.
        DECREASE_HIGH = -5
        DECREASE_MEDIUM = -3
        DECREASE_LOW = -2
        NO_IMPACT = 0
        INCREASE_LOW = 2
        INCREASE_MEDIUM = 3
        INCREASE_HIGH = 5

    user = models.ForeignKey(User, models.CASCADE, related_name="key_factor_votes")
    key_factor = models.ForeignKey(KeyFactor, models.CASCADE, related_name="votes")
    score = models.SmallIntegerField(choices=VoteScore.choices, db_index=True)
    # This field will be removed once we decide on the type of vote
    vote_type = models.CharField(
        choices=VoteType.choices, max_length=20, default=VoteType.A_UPVOTE_DOWNVOTE
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_key_factor",
                fields=["user_id", "key_factor_id", "vote_type"],
            )
        ]
        indexes = [
            models.Index(fields=["key_factor", "score"]),
        ]
