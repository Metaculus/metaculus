from datetime import datetime
from django.db import models
from django.db.models import Sum, Subquery, OuterRef, Count
from django.db.models.functions import Coalesce
from django.utils import timezone
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

    def annotate_forecasts_count(self):
        return self.annotate(
            forecasts_count=(
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
        Annotates user permission for each Post based on the related Projects.
        """

        project_permissions_subquery = (
            Project.objects.annotate_user_permission(user=user)
            .filter(default_posts=models.OuterRef("pk"))
            .values("user_permission")[:1]
        )

        return self.annotate(
            user_permission=models.Case(
                # If user is the question author
                models.When(
                    author_id=user.id if user else None,
                    then=models.Value(ObjectPermission.CREATOR),
                ),
                # Otherwise, check permissions
                default=Subquery(project_permissions_subquery),
                output_field=models.CharField(),
            )
        )

    def filter_permission(
        self, user: User = None, permission: ObjectPermission = ObjectPermission.VIEWER
    ):
        """
        Returns only allowed projects for the user
        """

        user_id = user.id if user else None

        if user and user.is_superuser:
            return self

        if permission == ObjectPermission.CREATOR:
            return self.filter(author_id=user_id)

        permissions_lookup = ObjectPermission.get_included_permissions(permission) + [
            ObjectPermission.CREATOR
        ]

        return (
            self.annotate_user_permission(user=user)
            .filter(user_permission__in=permissions_lookup)
            .filter(
                models.Q(curation_status=Post.CurationStatus.APPROVED)
                | models.Q(
                    user_permission__in=[
                        ObjectPermission.CREATOR,
                        ObjectPermission.ADMIN,
                        ObjectPermission.CURATOR,
                    ]
                )
            )
        )

    def filter_public(self):
        """
        Filter public posts
        """

        return self.filter(default_project__default_permission__isnull=False)

    def filter_private(self):
        """
        Filter private posts
        """

        return self.filter(default_project__default_permission__isnull=True)


class Notebook(TimeStampedModel):
    class NotebookType(models.TextChoices):
        DISCUSSION = "discussion"
        NEWS = "news"
        PUBLIC_FIGURE = "public_figure"

    markdown = models.TextField()
    type = models.CharField(max_length=100, choices=NotebookType)
    news_type = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)


class Post(TimeStampedModel):
    class CurationStatus(models.TextChoices):
        # Draft, only the creator can see it
        DRAFT = "draft"
        # Pending, only creator and curators can see it, pending a review to be published or rejected
        PENDING = "pending"
        # Rejected, only the creator and curators on the project[s] can see it
        REJECTED = "rejected"
        # APPROVED, all viewers can see it
        APPROVED = "approved"
        # CLOSED, all viewers can see it, no forecasts or other interactions can happen
        DELETED = "deleted"

    curation_status = models.CharField(
        max_length=20,
        choices=CurationStatus.choices,
        default=CurationStatus.DRAFT,
        db_index=True,
    )
    curation_status_updated_at = models.DateTimeField(null=True, blank=True)

    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, models.CASCADE, related_name="posts")

    curated_last_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
        blank=True,
    )
    published_at = models.DateTimeField(db_index=True, null=True, blank=True)

    aim_to_close_at = models.DateTimeField(null=True, blank=True)
    aim_to_resolve_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    resolved = models.BooleanField(default=False)

    def set_aim_to_close_at(self) -> datetime | None:
        if self.question:
            self.aim_to_close_at = self.question.aim_to_close_at
        elif self.group_of_questions:
            self.aim_to_close_at = max(
                question.aim_to_close_at
                for question in self.group_of_questions.questions.all()
            )
        elif self.conditional:
            self.aim_to_close_at = self.conditional.condition_child.aim_to_close_at
        else:
            self.aim_to_close_at = None

    def set_aim_to_resolve_at(self) -> datetime | None:
        if self.question:
            self.aim_to_resolve_at = self.question.aim_to_resolve_at
        elif self.group_of_questions:
            self.aim_to_resolve_at = max(
                question.aim_to_resolve_at
                for question in self.group_of_questions.questions.all()
            )
        elif self.conditional:
            self.aim_to_resolve_at = self.conditional.condition_child.aim_to_resolve_at
        else:
            self.aim_to_resolve_at = None

    def set_closed_at(self) -> datetime | None:
        if self.question:
            self._closed_at = self.question.aim_to_close_at
        elif self.group_of_questions:
            self._closed_at = max(
                question.aim_to_close_at
                for question in self.group_of_questions.questions.all()
            )
        elif self.conditional:
            self._closed_at = self.conditional.condition_child.aim_to_close_at
        else:
            self._closed_at = None

    def set_resolved(self):
        if self.question:
            if self.question.resolution:
                self.resolved = True
            else:
                self.resolved = False
        elif self.group_of_questions:
            resolutions = [
                (
                    True
                    if question.resolution is not None and question.resolution != ""
                    else False
                )
                for question in self.group_of_questions.questions.all()
            ]
            self.resolved = resolutions and all(resolutions)
        elif self.conditional:
            resolutions = [
                (
                    True
                    if question.resolution is not None and question.resolution != ""
                    else False
                )
                for question in self.group_of_questions.questions.all()
            ]
            self.resolved = (
                self.conditional.condition_child.resolution is not None
                and self.conditional.condition_child.resolution != ""
                and self.conditional.condition.resolution is not None
                and self.conditional.condition.resolution != ""
            )
        else:
            self.resolved = False

    def update_pseudo_materialized_fields(self):
        self.set_aim_to_close_at()
        self.set_closed_at()
        self.set_aim_to_resolve_at()
        self.set_resolved()
        self.save()

    maybe_try_to_resolve_at = models.DateTimeField(
        db_index=True, default=timezone.now() + timezone.timedelta(days=40 * 365)
    )
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

    notebook = models.OneToOneField(
        Notebook, models.CASCADE, related_name="post", null=True, blank=True
    )

    # TODO: make required in the future
    default_project = models.ForeignKey(
        Project, related_name="default_posts", on_delete=models.PROTECT, null=True
    )
    projects = models.ManyToManyField(Project, related_name="posts", blank=True)

    objects = models.Manager.from_queryset(PostQuerySet)()

    # Annotated fields
    forecasts_count: int = 0
    nr_forecasters: int = 0
    vote_score: int = 0
    user_vote = None
    user_permission: ObjectPermission = None

    def __str__(self):
        return self.title

    def update_curation_status(self, status: CurationStatus):
        self.curation_status = status
        self.curation_status_updated_at = timezone.now()


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
