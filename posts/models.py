from django.db import models
from django.db.models import Sum, Subquery, OuterRef, Count
from sql_util.aggregates import SubqueryAggregate

from projects.models import Project
from questions.models import Question, Conditional, GroupOfQuestions
from users.models import User
from utils.models import TimeStampedModel


class PostQuerySet(models.QuerySet):
    def prefetch_projects(self):
        return self.prefetch_related("projects")

    def prefetch_forecasts(self):
        return self.prefetch_related(
            "question__forecast_set",
            # Conditional
            "conditional__question_yes__forecast_set",
            "conditional__question_no__forecast_set",
            # Group Of Questions
            "group_of_questions__questions__forecast_set",
        )

    def prefetch_questions(self):
        return self.prefetch_related(
            "question",
            # Conditional
            "conditional__condition",
            "conditional__condition_child",
            "conditional__question_yes",
            "conditional__question_no",
            # Group Of Questions
            "group_of_questions__questions",
        )

    def annotate_predictions_count(self):
        return self.annotate(
            predictions_count=(
                Count("question__forecast", distinct=True)
                # Conditional questions
                + Count("conditional__question_yes__forecast", distinct=True)
                + Count("conditional__question_no__forecast", distinct=True)
                # Question groups
                + Count("group_of_questions__questions__forecast", distinct=True)
            )
        )

    def annotate_nr_forecasters(self):
        return self.annotate(
            nr_forecasters=(
                # Single question
                Count("question__forecast__author", distinct=True)
                # Conditional questions
                + Count("conditional__question_yes__forecast__author", distinct=True)
                + Count("conditional__question_no__forecast__author", distinct=True)
                # Question groups
                + Count(
                    "group_of_questions__questions__forecast__author", distinct=True
                )
            )
        )

    def annotate_vote_score(self):
        return self.annotate(
            vote_score=SubqueryAggregate("votes__direction", aggregate=Sum)
        )

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                Vote.objects.filter(user=user, post=OuterRef("pk")).values("direction")[
                    :1
                ]
            ),
        )


class Post(TimeStampedModel):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, models.CASCADE, related_name="posts")

    approved_at = models.DateTimeField(null=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
    )
    published_at = models.DateTimeField(db_index=True, null=True)

    # Relations
    # TODO: add db constraint to have only one not-null value of these fields
    question = models.OneToOneField(
        Question, models.CASCADE, related_name="post", null=True
    )
    conditional = models.OneToOneField(
        Conditional, models.CASCADE, related_name="post", null=True
    )
    group_of_questions = models.OneToOneField(
        GroupOfQuestions, models.CASCADE, related_name="post", null=True
    )

    projects = models.ManyToManyField(Project, related_name="posts")

    objects = models.Manager.from_queryset(PostQuerySet)()

    # Annotated fields
    predictions_count: int = 0
    nr_forecasters: int = 0
    vote_score: int = 0
    user_vote = None


# TODO: if we can vote on questions and comments, maybe move this elsewhere; user?
class Vote(models.Model):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE, related_name="votes")
    post = models.ForeignKey(Post, models.CASCADE, related_name="votes")
    direction = models.SmallIntegerField(choices=VoteDirection.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_question", fields=["user_id", "post_id"]
            ),
            # models.CheckConstraint(
            #    name='has_question_xor_comment',
            #    check=(
            #        models.Q(question__isnull=True, comment__isnull=False) |
            #        models.Q(question__isnull=False, comment__isnull=True)
            #    )
            # )
        ]
