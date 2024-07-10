from django.db import models
from django.db.models import Sum, OuterRef, Subquery

from sql_util.aggregates import SubqueryAggregate
from posts.models import Post
from projects.models import Project
from questions.models import Forecast
from users.models import User


class CommentQuerySet(models.QuerySet):
    def annotate_vote_score(self):
        return self.annotate(
            vote_score=SubqueryAggregate("comment_votes__direction", aggregate=Sum)
        )

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                CommentVote.objects.filter(user=user, comment=OuterRef("pk")).values("direction")[
                    :1
                ]
            ),
        )

    def annotate_author_object(self):
        return self.prefetch_related("author")

    # def annotate_children(self):
    #    return self.annotate(children=Comment.objects.filter(parent=self))


class Comment(models.Model):
    objects = models.Manager.from_queryset(CommentQuerySet)()
    author = models.ForeignKey(User, models.CASCADE)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    # auto_now_add=True must be disabled when the migration is run
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
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


class CommentDiff(models.Model):
    comment = models.ForeignKey(Comment, models.CASCADE)
    author = models.ForeignKey(User, models.CASCADE)
    edited_at = models.DateTimeField(auto_now_add=True, editable=False)
    text_diff = models.TextField()


class CommentVote(models.Model):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE, related_name="comment_vote")
    comment = models.ForeignKey(Comment, models.CASCADE, related_name="comment_votes")
    direction = models.SmallIntegerField(choices=VoteDirection.choices)
    # auto_now_add=True must be disabled when the migration is run
    # we may need to migrate edited_at to be the created_at field?  who knows.  i guess as long as it's before 2024 then it doesn't matter?  urgh
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_comment", fields=["user_id", "comment_id"]
            ),
        ]
