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
from utils.models import TimeStampedModel


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

    # def annotate_children(self):
    #    return self.annotate(children=Comment.objects.filter(parent=self))


class Comment(TimeStampedModel):
    comment_votes: QuerySet["CommentVote"]

    author = models.ForeignKey(User, models.CASCADE)
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
    is_soft_deleted = models.BooleanField(null=True)
    text = models.TextField()
    on_post = models.ForeignKey(
        Post, models.CASCADE, null=True, related_name="comments"
    )
    on_project = models.ForeignKey(Project, models.CASCADE, null=True, blank=True)
    included_forecast = models.ForeignKey(
        Forecast, on_delete=models.SET_NULL, null=True, default=None, blank=True
    )
    is_private = models.BooleanField(default=False)
    edit_history = models.JSONField(default=list, null=False, blank=True)

    # annotated fields
    vote_score: int = 0
    author_username: str = ""
    # edited_at: None   # convenience field from edit_history ?
    user_vote: int = 0
    children = []

    objects = models.Manager.from_queryset(CommentQuerySet)()

    def save(self, **kwargs):
        if self.parent:
            self.root = self.root or self.parent.root or self.parent

        return super().save(**kwargs)


class CommentDiff(TimeStampedModel):
    comment = models.ForeignKey(Comment, models.CASCADE)
    author = models.ForeignKey(User, models.CASCADE)
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
