from datetime import timedelta

from django.db import models
from django.db.models import (
    Sum,
    Subquery,
    OuterRef,
    Count,
    Q,
    F,
    Case,
    When,
    Value,
    Max,
    Min,
)
from django.utils import timezone
from sql_util.aggregates import SubqueryAggregate

from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Question, Conditional, GroupOfQuestions, Forecast
from scoring.models import Score
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

    def annotate_weekly_movement(self):
        """
        TODO: should be implemented in the future

        weekly_forecast = SubqueryAggregate(
            "forecasts",
            filter=Q(start_time__gte=timezone.now() - timedelta(days=7)),
            aggregate=Count,
        )
        return self.annotate(
            weekly_movement=Case(
                When(forecasts_count=0, then=Value(0)),
                default=(weekly_forecast * weekly_forecast / F("forecasts_count")),
            )
        )
        """

        return self

    def annotate_hot(self):
        """
        nb predictions in last week +
        net votes in last week * 5 +
        nb comments in last week * 10 +
        net boosts in last week * 20 +
        approved in last week * 50
        """

        last_week_dt = timezone.now() - timedelta(days=7)

        return self.annotate(
            # nb predictions in last week
            hot=SubqueryAggregate(
                "forecasts",
                filter=Q(start_time__gte=timezone.now() - timedelta(days=7)),
                aggregate=Count,
            )
            + (
                # Net votes in last week * 5
                # Please note: we dind't have this before
                SubqueryAggregate(
                    "votes__direction",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                )
                * 5
            )
            + (
                # nb comments in last week * 10
                SubqueryAggregate(
                    "comments__id",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Count,
                )
                * 10
            )
            + Case(
                # approved in last week
                When(
                    published_at__gte=last_week_dt,
                    then=Value(50),
                ),
                default=Value(0),
            )
        )

    def annotate_user_last_forecasts_date(self, author_id: int):
        """
        Annotate last forecast date for user
        """

        return self.filter(snapshots__user_id=author_id).annotate(
            user_last_forecasts_date=F("snapshots__last_forecast_date")
        )

    def annotate_unread_comment_count(self, user_id: int):
        """
        Annotate last forecast date for user
        """

        return (
            self.filter(snapshots__user_id=user_id)
            .annotate_comment_count()
            .annotate(
                unread_comment_count=F("comment_count") - F("snapshots__comment_count"),
            )
        )

    def annotate_score(self, user_id: int, desc=True):
        subquery = (
            Score.objects.filter(user_id=user_id)
            .filter(
                Q(question__post=OuterRef("pk"))
                | Q(question__group__post=OuterRef("pk"))
                | Q(question__conditional_yes__post=OuterRef("pk"))
                | Q(question__conditional_no__post=OuterRef("pk"))
            )
            .values("score")
            .annotate(agg_score=Max("score") if desc else Min("score"))
            .values("agg_score")
        )[:1]

        return self.annotate(score=subquery)

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

    def annotate_comment_count(self):
        return self.annotate(
            comment_count=SubqueryAggregate("comments__id", aggregate=Count)
        )

    def annotate_divergence(self, user_id: int):
        return (
            self.filter(snapshots__user_id=user_id)
            .annotate(
                divergence=F("snapshots__divergence")
            )
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
            # Intermediate annotation of the default_project permissions
            default_project_user_permission=Subquery(project_permissions_subquery),
            # Alter permissions based on the Ownership status
            user_permission=models.Case(
                # If user is the question author
                models.When(
                    Q(
                        default_project_user_permission__in=[
                            ObjectPermission.ADMIN,
                            ObjectPermission.CURATOR,
                        ]
                    ),
                    then=F("default_project_user_permission"),
                ),
                models.When(
                    author_id=user.id if user else None,
                    then=models.Value(ObjectPermission.CREATOR),
                ),
                default=F("default_project_user_permission"),
                output_field=models.CharField(),
            ),
        )

    def filter_permission(
        self, user: User = None, permission: ObjectPermission = ObjectPermission.VIEWER
    ):
        """
        Returns only allowed projects for the user
        """

        user_id = user.id if user else None

        if permission == ObjectPermission.CREATOR:
            return self.filter(author_id=user_id)

        permissions_lookup = ObjectPermission.get_included_permissions(permission) + [
            ObjectPermission.CREATOR
        ]

        projects = Project.objects.annotate_user_permission(user=user)

        return self.filter(
            # If author -> have access to all own posts
            Q(author_id=user_id)
            | (
                Q(
                    default_project__in=projects.filter(
                        user_permission__in=permissions_lookup
                    )
                )
                & (
                    Q(curation_status=Post.CurationStatus.APPROVED)
                    | Q(
                        default_project__in=projects.filter(
                            user_permission__in=[
                                ObjectPermission.ADMIN,
                                ObjectPermission.CURATOR,
                            ]
                        )
                    )
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

    def filter_active(self):
        """
        Filter active posts
        """

        return self.filter(
            published_at__lte=timezone.now(),
            curation_status=Post.CurationStatus.APPROVED,
        ).filter(
            Q(actual_close_time__isnull=True) | Q(actual_close_time__gte=timezone.now())
        )


class Notebook(TimeStampedModel):
    class NotebookType(models.TextChoices):
        DISCUSSION = "discussion"
        NEWS = "news"
        PUBLIC_FIGURE = "public_figure"

    markdown = models.TextField()
    type = models.CharField(max_length=100, choices=NotebookType)
    news_type = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)


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

    title = models.CharField(max_length=2000)
    author = models.ForeignKey(User, models.CASCADE, related_name="posts")

    curated_last_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
        blank=True,
    )
    published_at = models.DateTimeField(db_index=True, null=True, blank=True)
    scheduled_close_time = models.DateTimeField(null=True, blank=True)
    scheduled_resolve_time = models.DateTimeField(null=True, blank=True)
    actual_close_time = models.DateTimeField(null=True, blank=True)
    resolved = models.BooleanField(default=False)

    def set_scheduled_close_time(self):
        if self.question:
            self.scheduled_close_time = self.question.scheduled_close_time
        elif self.group_of_questions:
            self.scheduled_close_time = max(
                question.scheduled_close_time
                for question in self.group_of_questions.questions.all()
            )
        elif self.conditional:
            self.scheduled_close_time = (
                self.conditional.condition_child.scheduled_close_time
            )
        else:
            self.scheduled_close_time = None

    def set_scheduled_resolve_time(self):
        if self.question:
            self.scheduled_resolve_time = self.question.scheduled_resolve_time
        elif self.group_of_questions:
            self.scheduled_resolve_time = max(
                question.scheduled_resolve_time
                for question in self.group_of_questions.questions.all()
            )
        elif self.conditional:
            self.scheduled_resolve_time = (
                self.conditional.condition_child.scheduled_resolve_time
            )
        else:
            self.scheduled_resolve_time = None

    def set_actual_close_time(self):
        if self.question:
            self.actual_close_time = self.question.actual_close_time
        elif self.group_of_questions:
            close_times = [
                question.scheduled_close_time
                for question in self.group_of_questions.questions.all()
            ]

            if None not in close_times:
                self.actual_close_time = max(close_times)
            else:
                self.actual_close_time = None
        elif self.conditional:
            close_times = [
                question.scheduled_close_time
                for question in [
                    self.conditional.condition_child,
                    self.conditional.condition,
                ]
            ]

            if None not in close_times:
                self.actual_close_time = max(close_times)
            else:
                self.actual_close_time = None
        else:
            self.actual_close_time = None

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
            self.resolved = (
                self.conditional.condition_child.resolution is not None
                and self.conditional.condition_child.resolution != ""
                and self.conditional.condition.resolution is not None
                and self.conditional.condition.resolution != ""
            )
        else:
            self.resolved = False

    def update_pseudo_materialized_fields(self):
        self.set_scheduled_close_time()
        self.set_actual_close_time()
        self.set_scheduled_resolve_time()
        self.set_resolved()
        self.save()

    maybe_try_to_resolve_at = models.DateTimeField(
        db_index=True, default=timezone.make_aware(timezone.now().max)
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
    users = models.ManyToManyField(User, through="PostUserSnapshot")

    # Evaluated Fields
    movement = models.FloatField(null=True, blank=True)  # Jeffrey's Divergence
    # TODO: these two fields might be necessary for display purposes
    # movement_total = models.FloatField(null=True, blank=True)
    # movement_asymmetric = models.FloatField(null=True, blank=True)
    forecasts_count = models.PositiveIntegerField(
        default=0, editable=False, db_index=True
    )

    def update_forecasts_count(self):
        """
        Update forecasts count cache
        """

        self.forecasts_count = self.forecasts.count()
        self.save(update_fields=["forecasts_count"])

    objects = models.Manager.from_queryset(PostQuerySet)()

    # Annotated fields
    nr_forecasters: int = 0
    vote_score: int = 0
    user_vote = None
    user_permission: ObjectPermission = None
    comment_count: int = 0
    user_last_forecasts_date = None
    divergence: int = None

    def __str__(self):
        return self.title

    def update_curation_status(self, status: CurationStatus):
        self.curation_status = status
        self.curation_status_updated_at = timezone.now()

    def get_questions(self) -> list[Question]:
        """
        Generate list of questions available for forecasting
        """

        if self.question_id:
            return [self.question]
        if self.group_of_questions_id:
            return self.group_of_questions.questions.all()
        elif self.conditional_id:
            return [self.conditional.question_yes, self.conditional.question_no]
        else:
            return []


class PostUserSnapshot(models.Model):
    user = models.ForeignKey(User, models.CASCADE, related_name="post_snapshots")
    post = models.ForeignKey(Post, models.CASCADE, related_name="snapshots")

    # Comments count in the moment of viewing post by the user
    last_forecast_date = models.DateTimeField(db_index=True, default=None, null=True)
    comments_count = models.IntegerField(default=0)
    viewed_at = models.DateTimeField(db_index=True, default=timezone.now)

    # Evaluated Fields
    divergence = models.FloatField(null=True, blank=True)  # Jeffrey's Divergence

    # TODO: these two fields might be necessary for display purposes
    # divergence_total = models.FloatField(null=True, blank=True)
    # divergence_asymmetric = models.FloatField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="postusersnapshot_unique_user_post", fields=["user_id", "post_id"]
            )
        ]

    @classmethod
    def update_last_forecast_date(cls, post: Post, user: User):
        cls.objects.update_or_create(
            user=user,
            post=post,
            defaults={
                "last_forecast_date": timezone.now(),
            },
        )

    @classmethod
    def update_viewed_at(cls, post: Post, user: User):
        cls.objects.update_or_create(
            user=user,
            post=post,
            defaults={
                "comments_count": post.comments.count(),
                "viewed_at": timezone.now(),
            },
        )


class Vote(TimeStampedModel):
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
