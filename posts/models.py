from django.db import models
from django.db.models import Sum, Subquery, OuterRef, Count
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from projects.models import Project
from projects.permissions import ObjectPermission
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
                Coalesce(
                    SubqueryAggregate("question__forecast", aggregate=Count),
                    # Conditional questions
                    Coalesce(
                        SubqueryAggregate(
                            "conditional__question_yes__forecast",
                            aggregate=Count,
                        ),
                        0,
                    )
                    + Coalesce(
                        SubqueryAggregate(
                            "conditional__question_no__forecast",
                            aggregate=Count,
                        ),
                        0,
                    ),
                    # Question groups
                    SubqueryAggregate(
                        "group_of_questions__questions__forecast",
                        aggregate=Count,
                    ),
                )
            )
        )

    def annotate_nr_forecasters(self):
        return self.annotate(
            nr_forecasters=Coalesce(
                SubqueryAggregate(
                    "question__forecast__author", aggregate=Count, distinct=True
                ),
                # Conditional questions
                Coalesce(
                    SubqueryAggregate(
                        "conditional__question_yes__forecast__author",
                        aggregate=Count,
                        distinct=True,
                    ),
                    0,
                )
                + Coalesce(
                    SubqueryAggregate(
                        "conditional__question_no__forecast__author",
                        aggregate=Count,
                        distinct=True,
                    ),
                    0,
                ),
                # Question groups
                SubqueryAggregate(
                    "group_of_questions__questions__forecast__author",
                    aggregate=Count,
                    distinct=True,
                ),
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

    #
    # Permissions
    #
    def annotate_user_permission(self, user: User = None):
        """
        Annotates user permission for each Post based on the related Projects
        """

        project_permissions_subquery = (
            Project.objects.annotate_user_permission(user=user)
            .filter(posts=models.OuterRef("pk"))
            .values("user_permission")
            .order_by(
                # Return the max permission level user might have;
                models.F("user_permission__numeric").desc(
                    # Ensure Nullable permissions won't affect the ordering
                    nulls_last=True
                )
            )[:1]
        )

        return self.annotate(
            user_permission=models.Case(
                # If user is the question author
                models.When(
                    author_id=user.id if user else None,
                    then=models.Value(ObjectPermission.ADMIN),
                ),
                # Otherwise, check permissions
                default=Subquery(project_permissions_subquery),
                output_field=models.CharField(),
            )
        )

    def filter_allowed(self, user: User = None):
        """
        Returns only allowed projects for the user
        """

        return self.annotate_user_permission(user=user).filter(
            user_permission__isnull=False
        )

class Post(TimeStampedModel):
    class CurationStatus(models.TextChoices):
        # Draft, only the creator can see it
        DRAFT = "draft"
        # Pending, only creator and curators can see it, pending a review to be published or rejected
        PENDING = "pending"
        # Rejected, only the creator and curators on the project[s] can see it
        REJECTED = "rejected"
        # PUBLISHED, all viewers can see it
        PUBLISHED = "published"
        # CLOSED, all viewers can see it, no forecasts or other interactions can happen
        CLOSED = "closed"

    curation_status = models.CharField(max_length=20, choices=CurationStatus.choices, default=CurationStatus.DRAFT)
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, models.CASCADE, related_name="posts")

    closed_at = models.DateTimeField(db_index=True, null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
        blank=True,
    )
    published_at = models.DateTimeField(db_index=True, null=True, blank=True)
    closed_at = models.DateTimeField(db_index=True, null=True, blank=True)

    # Relations
    # TODO: add db constraint to have only one not-null value of these fields
    question = models.OneToOneField(
        Question, models.CASCADE, related_name="post", null=True, blank=True
    )
    conditional = models.OneToOneField(
        Conditional, models.CASCADE, related_name="post", null=True, blank=True
    )
    group_of_questions = models.OneToOneField(
        GroupOfQuestions, models.CASCADE, related_name="post", null=True, blank=True
    )

    projects = models.ManyToManyField(Project, related_name="posts")

    objects = models.Manager.from_queryset(PostQuerySet)()

    # Annotated fields
    predictions_count: int = 0
    nr_forecasters: int = 0
    vote_score: int = 0
    user_vote = None
    user_permission: ObjectPermission = None

    def __str__(self):
        return self.title


# TODO: create votes app
class Vote(models.Model):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE, related_name="votes")
    post = models.ForeignKey(Post, models.CASCADE, related_name="votes")
    # comment = models.ForeignKey(Comment, models.CASCADE, related_name="votes")
    direction = models.SmallIntegerField(choices=VoteDirection.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="votes_unique_user_question", fields=["user_id", "post_id"]
            ),
            # models.CheckConstraint(
            #    name='has_question_xor_comment',
            #    check=(
            #        models.Q(post__isnull=True, comment__isnull=False) |
            #        models.Q(post__isnull=False, comment__isnull=True)
            #    )
            # )
        ]
