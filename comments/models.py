from django.db import models
from django.db.models import Sum, Case, When, IntegerField

from projects.models import Project
from questions.models import Question, Forecast, Vote
from users.models import User


class CommentType(models.TextChoices):
    GENERAL = "general"
    FEEDBACK = "feedback"
    RESOLUTION = "resolution"
    PRIVATE = "private"


class CommentQuerySet(models.QuerySet):
    def annotate_vote_score(self):
        return self.annotate(
            vote_score=SubqueryAggregate("votes__direction", aggregate=Sum)
        )

    def annotate_children(self):
        return self.annotate(
            children=Comment.objects.filter(parent=self)
        )


class Comment(models.Model):
    author = models.ForeignKey(User, models.CASCADE) 
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    edited_at = models.DateTimeField(auto_now_add=True)
    is_soft_deleted = models.BooleanField(null=True)
    text = models.TextField()
    on_question = models.ForeignKey(Question, models.CASCADE)
    #on_project = models.ForeignKey(Project, null=True) 
    included_forecast = models.ForeignKey(Forecast, on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=20, choices=CommentType.choices)

    # annotated fields
    vote_score: int = 0
    # user_vote_score: int = 0
    children = []
