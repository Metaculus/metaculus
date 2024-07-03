from django.db import models
from django.db.models import Sum

from posts.models import Post
from projects.models import Project
from questions.models import Forecast
from users.models import User


class CommentQuerySet(models.QuerySet):
    def annotate_vote_score(self):
        return self.annotate(
            vote_score=SubqueryAggregate("votes__direction", aggregate=Sum)
        )

    def annotate_author_object(self):
        return self.prefetch_related("author")

    # def annotate_children(self):
    #    return self.annotate(children=Comment.objects.filter(parent=self))


class Comment(models.Model):
    author = models.ForeignKey(User, models.CASCADE)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True)
    # auto_now_add=True must be disabled when the migration is run
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    is_soft_deleted = models.BooleanField(null=True)
    text = models.TextField()
    on_post = models.ForeignKey(Post, models.CASCADE, null=True)
    on_project = models.ForeignKey(Project, models.CASCADE, null=True)
    included_forecast = models.ForeignKey(
        Forecast, on_delete=models.SET_NULL, null=True
    )
    is_private = models.BooleanField(default=False)
    edit_history = models.JSONField(default=list, null=False)

    # annotated fields
    vote_score: int = 0
    author_username: str = ""
    # edited_at: None   # convenience field from edit_history ?
    # user_vote_score: int = 0
    children = []


class CommentDiff(models.Model):
    comment = models.ForeignKey(Comment, models.CASCADE)
    author = models.ForeignKey(User, models.CASCADE)
    edited_at = models.DateTimeField(auto_now_add=True, editable=False)
    text_diff = models.TextField()
