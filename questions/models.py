from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, Sum, Case, When, IntegerField, Subquery, OuterRef

from projects.models import Project
from users.models import User


class QuestionQuerySet(models.QuerySet):
    def prefetch_projects(self):
        return self.prefetch_related("projects")

    def annotate_predictions_count(self):
        return self.annotate(predictions_count=Count("forecast"))

    def annotate_predictions_count__unique(self):
        return self.annotate(
            predictions_count_unique=Count("forecast__author", distinct=True)
        )

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

    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                Vote.objects.filter(user=user, question=OuterRef("pk")).values(
                    "direction"
                )[:1]
            ),
        )


class Question(models.Model):
    QUESTION_TYPES = (
        ("binary", "Binary"),
        ("numeric", "Numeric Range"),
        ("date", "Date Range"),
        ("multiple_choice", "Multiple Choice"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, models.CASCADE, related_name="submitted_questions")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(db_index=True, null=True)
    approved_at = models.DateTimeField(null=True)
    closed_at = models.DateTimeField(db_index=True, null=True)
    resolved_at = models.DateTimeField(null=True)

    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
    )

    type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    possibilities = models.JSONField(null=True, blank=True)

    # Common fields
    resolution = models.TextField(null=True, blank=True)

    projects = models.ManyToManyField(Project, related_name="questions")

    _url_id = models.CharField(max_length=200, blank=True, default="")

    objects = models.Manager.from_queryset(QuestionQuerySet)()

    # Annotated fields
    predictions_count: int = 0
    predictions_count_unique: int = 0
    vote_score: int = 0
    user_vote = None


class Forecast(models.Model):
    start_time = models.DateTimeField(
        help_text="Begining time when this prediction is active", db_index=True
    )
    end_time = models.DateTimeField(
        null=True,
        help_text="Time at which this prediction is no longer active",
        db_index=True,
    )

    # last 2 elements are represents above upper and, subsequently, below lower bound.
    continuous_prediction_values = ArrayField(
        models.FloatField(),
        null=True,
        size=202,
    )

    probability_yes = models.FloatField(null=True)
    probability_yes_per_category = ArrayField(models.FloatField(), null=True)

    distribution_components = ArrayField(
        models.JSONField(null=True),
        size=5,
        null=True,
        help_text="The components for a continuous prediction. Used to generate prediction_values.",
    )

    author = models.ForeignKey(User, models.CASCADE)
    question = models.ForeignKey(Question, models.CASCADE)


class Vote(models.Model):
    class VoteDirection(models.TextChoices):
        UP = "up"
        DOWN = "down"

    user = models.ForeignKey(User, models.CASCADE, related_name="votes")
    question = models.ForeignKey(Question, models.CASCADE, related_name="votes")
    direction = models.CharField(max_length=20, choices=VoteDirection.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_question", fields=["user_id", "question_id"]
            ),
        ]
