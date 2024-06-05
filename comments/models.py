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
            vote_score=Sum(
                Case(
                    When(votes__direction=Vote.VoteDirection.UP, then=1),
                    When(votes__direction=Vote.VoteDirection.DOWN, then=-1),
                    output_field=IntegerField(),
                )
            )
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
    question = models.ForeignKey(Question, models.CASCADE)
    #project = models.ForeignKey(Project, null=True) # this seems weird
    forecast = models.ForeignKey(Forecast, on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=20, choices=CommentType.choices)

    # seems probably unnecessary
    #mentioned_users: tuple = ()
    #newly_mentioned_users: tuple = ()

    # annotated fields
    vote_score: int = 0
    # user_vote_score: int = 0
    children = []


















