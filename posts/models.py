from datetime import timedelta
from itertools import chain

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import (
    Sum,
    Subquery,
    OuterRef,
    Q,
    F,
    Max,
    Min,
    Prefetch,
    QuerySet,
    FilteredRelation,
    Exists,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from pgvector.django import VectorField

from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import (
    Question,
    Conditional,
    GroupOfQuestions,
    Forecast,
)
from scoring.models import Score, ArchivedScore
from users.models import User
from utils.models import TimeStampedModel


class PostQuerySet(models.QuerySet):
    def prefetch_projects(self):
        return self.prefetch_related("projects").select_related("default_project")

    def prefetch_user_forecasts(self, user_id: int):
        question_relations = [
            "question",
            "conditional__question_yes",
            "conditional__question_no",
            "group_of_questions__questions",
        ]

        prefetches = []

        for rel in question_relations:
            prefetches += [
                Prefetch(
                    f"{rel}__user_forecasts",
                    queryset=Forecast.objects.filter(author_id=user_id).order_by(
                        "start_time"
                    ),
                    to_attr="request_user_forecasts",
                ),
                Prefetch(
                    f"{rel}__scores",
                    queryset=Score.objects.filter(user_id=user_id),
                    to_attr="user_scores",
                ),
                Prefetch(
                    f"{rel}__archived_scores",
                    queryset=ArchivedScore.objects.filter(user_id=user_id),
                    to_attr="user_archived_scores",
                ),
            ]

        return self.prefetch_related(*prefetches)

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

    def prefetch_condition_post(self):
        return self.prefetch_related(
            "conditional__condition__related_posts__post",
            "conditional__condition_child__related_posts__post",
        )

    def prefetch_questions_scores(self):
        question_relations = [
            "question",
            "conditional__question_yes",
            "conditional__question_no",
            "group_of_questions__questions",
        ]

        return self.prefetch_related(
            *chain.from_iterable(
                [
                    [
                        Prefetch(
                            f"{rel}__scores",
                            Score.objects.filter(aggregation_method__isnull=False),
                        ),
                        Prefetch(
                            f"{rel}__archived_scores",
                            Score.objects.filter(aggregation_method__isnull=False),
                        ),
                    ]
                    for rel in question_relations
                ]
            )
        )

    def prefetch_user_subscriptions(self, user: User):
        return self.prefetch_related(
            Prefetch(
                "subscriptions",
                queryset=PostSubscription.objects.filter(user=user).order_by(
                    "-created_at"
                ),
                to_attr="user_subscriptions",
            )
        )

    def prefetch_user_snapshots(self, user: User):
        return self.prefetch_related(
            Prefetch(
                "snapshots",
                queryset=PostUserSnapshot.objects.filter(user=user),
                to_attr="user_snapshots",
            )
        )

    def annotate_user_last_forecasts_date(self, author_id: int):
        """
        Annotate last forecast date for user
        """
        last_forecast_date_subquery = PostUserSnapshot.objects.filter(
            user_id=author_id, post_id=OuterRef("pk")
        ).values("last_forecast_date")[:1]

        return self.annotate(
            user_last_forecasts_date=Coalesce(
                Subquery(last_forecast_date_subquery), Value(None)
            )
        )

    def annotate_unread_comment_count(self, user_id: int):
        """
        Annotate last forecast date for user on predicted questions
        """

        return self.filter(snapshots__user_id=user_id).annotate(
            unread_comment_count=F("comment_count") - F("snapshots__comments_count"),
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

    def annotate_divergence(self, user_id: int):
        return self.filter(snapshots__user_id=user_id).annotate(
            divergence=F("snapshots__divergence")
        )

    #
    # Permissions
    #
    def annotate_user_permission(self, user: User = None):
        from projects.services.common import get_site_main_project

        user_id = user.id if user else None
        site_main_project = get_site_main_project()

        # Annotate with user-specific permission or project's default permission
        qs = self.annotate(
            user_permission_override=FilteredRelation(
                "default_project__projectuserpermission",
                condition=Q(default_project__projectuserpermission__user_id=user_id),
            ),
            _user_permission=Coalesce(
                F("user_permission_override__permission"),
                F("default_project__default_permission"),
            ),
        )

        # Exclude posts user doesn't have access to
        qs = qs.filter(
            Q(author_id=user_id)
            | (
                Q(
                    _user_permission__in=[
                        ObjectPermission.ADMIN,
                        ObjectPermission.CURATOR,
                    ]
                )
                & Q(curation_status=Post.CurationStatus.PENDING)
            )
            | (
                Q(_user_permission__isnull=False)
                & (
                    (
                        Q(default_project_id=site_main_project.pk)
                        & Q(curation_status=Post.CurationStatus.PENDING)
                    )
                    | Q(curation_status=Post.CurationStatus.APPROVED)
                )
            )
        )

        qs = qs.annotate(
            user_permission=models.Case(
                # Admin/Curator is more important than Creator
                models.When(
                    Q(
                        _user_permission__in=[
                            ObjectPermission.ADMIN,
                            ObjectPermission.CURATOR,
                        ]
                    ),
                    then=F("_user_permission"),
                ),
                models.When(
                    author_id=user.id if user else None,
                    then=models.Value(ObjectPermission.CREATOR),
                ),
                default=F("_user_permission"),
                output_field=models.CharField(),
            ),
        )

        return qs

    def filter_permission(
        self, user: User = None, permission: ObjectPermission = ObjectPermission.VIEWER
    ):
        """
        Returns posts visible to the user
        """

        user_id = user.id if user else None

        if permission == ObjectPermission.CREATOR:
            return self.filter(author_id=user_id)

        permissions_lookup = ObjectPermission.get_included_permissions(permission) + [
            ObjectPermission.CREATOR
        ]

        return self.annotate_user_permission(user).filter(
            user_permission__in=permissions_lookup
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

    def filter_projects(self, p: list[Project] | Project):
        if isinstance(p, Project):
            p = [p]

        return self.filter(
            Q(default_project__in=p)
            | Exists(
                Post.projects.through.objects.filter(
                    post_id=OuterRef("pk"), project__in=p
                )
            )
        )

    def filter_questions(self):
        """
        Filter by question post type
        """

        return self.filter(
            Q(question_id__isnull=False)
            | Q(conditional_id__isnull=False)
            | Q(group_of_questions_id__isnull=False)
        )


class PostManager(models.Manager.from_queryset(PostQuerySet)):
    def get_queryset(self) -> PostQuerySet:
        return super().get_queryset().defer("embedding_vector")


class Notebook(TimeStampedModel):
    class NotebookType(models.TextChoices):
        DISCUSSION = "discussion"
        NEWS = "news"
        PUBLIC_FIGURE = "public_figure"

    markdown = models.TextField()
    type = models.CharField(max_length=100, choices=NotebookType)
    news_type = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.ImageField(null=True, blank=True, upload_to="user_uploaded")

    def __str__(self):
        return f"{self.type} Notebook for {self.post} by {self.post.author}"


class Post(TimeStampedModel):
    # typing
    id: int
    votes: QuerySet["Vote"]
    forecasts: QuerySet["Forecast"]
    question_id: int | None
    conditional_id: int | None
    group_of_questions_id: int | None

    # Annotated fields
    user_vote = None
    user_permission: ObjectPermission = None
    user_last_forecasts_date = None
    divergence: int = None

    objects: QuerySet["Post"] = PostManager()

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

    class PostStatusChange(models.TextChoices):
        OPEN = "open", _("Open")
        CLOSED = "closed", _("Closed")
        RESOLVED = "resolved", _("Resolved")

    curation_status = models.CharField(
        max_length=20,
        choices=CurationStatus.choices,
        default=CurationStatus.DRAFT,
        db_index=True,
    )
    curation_status_updated_at = models.DateTimeField(null=True, blank=True)

    title = models.CharField(max_length=2000, blank=True)
    url_title = models.CharField(max_length=2000, default="", blank=True)
    author = models.ForeignKey(User, models.CASCADE, related_name="posts")
    coauthors = models.ManyToManyField(
        User, related_name="coauthored_posts", blank=True
    )

    curated_last_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="approved_questions",
        null=True,
        blank=True,
    )
    published_at = models.DateTimeField(db_index=True, null=True, blank=True)

    # Fields populated from Child Question objects
    open_time = models.DateTimeField(
        null=True, blank=True, db_index=True, editable=False
    )
    scheduled_close_time = models.DateTimeField(
        null=True, blank=True, db_index=True, editable=False
    )
    scheduled_resolve_time = models.DateTimeField(
        null=True, blank=True, db_index=True, editable=False
    )
    actual_close_time = models.DateTimeField(null=True, blank=True, editable=False)
    resolved = models.BooleanField(default=False, editable=False)

    embedding_vector = VectorField(
        help_text="Vector embeddings of the Post content",
        null=True,
        blank=True,
        editable=False,
    )

    preview_image_generated_at = models.DateTimeField(null=True, blank=True)

    # Whether we should display Post/Notebook on the homepage
    show_on_homepage = models.BooleanField(default=False, db_index=True)

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
            self.scheduled_resolve_time = max(
                self.conditional.condition_child.scheduled_resolve_time,
                self.conditional.condition.scheduled_resolve_time,
            )
        else:
            self.scheduled_resolve_time = None

    def set_actual_close_time(self):
        if self.question:
            self.actual_close_time = self.question.actual_close_time
        elif self.group_of_questions:
            close_times = [
                question.actual_close_time
                for question in self.group_of_questions.questions.all()
            ]
            if None in close_times:
                self.actual_close_time = None
            else:
                self.actual_close_time = max(close_times)
        elif self.conditional:
            self.actual_close_time = self.conditional.condition_child.actual_close_time
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
                question.resolution is not None
                for question in self.group_of_questions.questions.all()
            ]
            self.resolved = resolutions and all(resolutions)
        elif self.conditional:
            self.resolved = (
                self.conditional.condition_child.resolution is not None
                and self.conditional.condition.resolution is not None
            )
        else:
            self.resolved = False

    def set_open_time(self):
        open_time = None

        if self.question_id:
            open_time = self.question.open_time
        elif self.conditional_id:
            open_time = max(
                self.conditional.condition.open_time,
                self.conditional.condition_child.open_time,
            )
        elif self.group_of_questions_id:
            questions = self.group_of_questions.questions.all()
            open_times = [x.open_time for x in questions if x.open_time]

            if open_times:
                open_time = min(open_times)

        self.open_time = open_time

    def updated_related_conditionals(self):
        if self.question:
            related_conditionals = [
                *self.question.conditional_conditions.all(),
                *self.question.conditional_children.all(),
            ]
            for conditional in related_conditionals:
                conditional.post.update_pseudo_materialized_fields()
                print("Updated conditional in post: ", conditional.post)

    def update_pseudo_materialized_fields(self):
        self.set_scheduled_close_time()
        self.set_actual_close_time()
        self.set_scheduled_resolve_time()
        self.set_open_time()
        self.set_resolved()
        self.save()
        # Note: No risk of infinite loops since conditionals can't father other conditionals
        self.updated_related_conditionals()

    def get_open_time(self):
        if self.question:
            return self.question.open_time

        if self.conditional:
            return max(
                self.conditional.condition.open_time,
                self.conditional.condition_child.open_time,
            )

        if self.group_of_questions:
            questions = self.group_of_questions.questions.all()
            open_times = [x.open_time for x in questions if x.open_time]

            if open_times:
                return min(open_times)

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
    movement = models.FloatField(
        null=True, blank=True, db_index=True
    )  # Jeffrey's Divergence
    # TODO: these two fields might be necessary for display purposes
    # movement_total = models.FloatField(null=True, blank=True)
    # movement_asymmetric = models.FloatField(null=True, blank=True)
    hotness = models.IntegerField(null=True, blank=True, editable=False, db_index=True)
    forecasts_count = models.PositiveIntegerField(
        default=0, editable=False, db_index=True
    )
    forecasters_count = models.PositiveIntegerField(default=0, editable=False)
    vote_score = models.IntegerField(default=0, db_index=True, editable=False)
    comment_count = models.PositiveIntegerField(
        default=0, db_index=True, editable=False
    )

    # Indicates whether we triggered "handle_post_open" event
    # And guarantees idempotency of "on post open" evens
    published_at_triggered = models.BooleanField(default=False)

    def update_forecasts_count(self):
        """
        Update forecasts count cache
        """

        self.forecasts_count = self.forecasts.count()
        self.save(update_fields=["forecasts_count"])

    def update_forecasters_count(self):
        self.forecasters_count = self.get_forecasters().count()
        self.save(update_fields=["forecasters_count"])

    def update_vote_score(self):
        self.vote_score = self.get_votes_score()
        self.save(update_fields=["vote_score"])

        return self.vote_score

    def update_comment_count(self):
        self.comment_count = self.get_comment_count()
        self.save(update_fields=["comment_count"])

        return self.comment_count

    def __str__(self):
        return self.title

    def update_curation_status(self, status: CurationStatus):
        self.curation_status = status
        self.curation_status_updated_at = timezone.now()

        if status == status.APPROVED:
            self.published_at = timezone.now()

    def get_questions(self) -> list[Question]:
        """
        Generate list of questions available for forecasting
        """

        if self.question_id:
            return [self.question]
        if self.group_of_questions_id:
            return self.group_of_questions.questions.all().prefetch_related("group")
        elif self.conditional_id:
            return [self.conditional.question_yes, self.conditional.question_no]
        else:
            return []

    def get_forecasters(self) -> QuerySet["User"]:
        return User.objects.filter(forecast__post=self).distinct("pk")

    def get_votes_score(self) -> int:
        return self.votes.aggregate(Sum("direction")).get("direction__sum") or 0

    def get_comment_count(self) -> int:
        return self.comments.filter(is_private=False).count()

    def get_url_title(self):
        return self.url_title or self.title

    def clean_fields(self, exclude=None):
        """
        Ensure django won't perform boolean check against ndarray produced by pgvector
        """

        if exclude is None:
            exclude = set()

        exclude.add("embedding_vector")

        return super().clean_fields(exclude=exclude)


class PostSubscription(TimeStampedModel):
    # typing
    user_id: int

    class SubscriptionType(models.TextChoices):
        CP_CHANGE = "cp_change"
        NEW_COMMENTS = "new_comments"
        MILESTONE = "milestone"
        STATUS_CHANGE = "status_change"
        SPECIFIC_TIME = "specific_time"

    user = models.ForeignKey(User, models.CASCADE, related_name="subscriptions")
    post = models.ForeignKey(Post, models.CASCADE, related_name="subscriptions")

    type = models.CharField(choices=SubscriptionType.choices, db_index=True)
    last_sent_at = models.DateTimeField(null=True, db_index=True, blank=True)

    next_trigger_value = models.FloatField(null=True, db_index=True, blank=True)
    next_trigger_datetime = models.DateTimeField(null=True, db_index=True, blank=True)

    # Notification-specific fields
    comments_frequency = models.PositiveSmallIntegerField(null=True, blank=True)
    recurrence_interval = models.DurationField(null=True, blank=True)
    milestone_step = models.FloatField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    # 0. -> 1.
    cp_change_threshold = models.FloatField(null=True, blank=True)

    # Indicate it's a global subscription which was auto-created
    # When user forecasted on the question
    # Or it was manually created by post subscription
    is_global = models.BooleanField(default=False, db_index=True)

    def update_last_sent_at(self):
        self.last_sent_at = timezone.now()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="postsubscription_unique_type_user_post",
                fields=["type", "user_id", "post_id", "is_global"],
                condition=~Q(type="specific_time"),
            ),
        ]


class PostUserSnapshot(models.Model):
    user = models.ForeignKey(User, models.CASCADE, related_name="post_snapshots")
    post = models.ForeignKey(Post, models.CASCADE, related_name="snapshots")

    # Comments count in the moment of viewing post by the user
    last_forecast_date = models.DateTimeField(db_index=True, default=None, null=True)
    comments_count = models.IntegerField(default=0)
    viewed_at = models.DateTimeField(db_index=True, default=timezone.now)

    # Evaluated Fields
    divergence = models.FloatField(
        null=True, blank=True, db_index=True
    )  # Jeffrey's Divergence

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
                "comments_count": post.get_comment_count(),
                "viewed_at": timezone.now(),
            },
        )


class PostActivityBoost(TimeStampedModel):
    user = models.ForeignKey(User, models.CASCADE)
    post = models.ForeignKey(Post, models.CASCADE, related_name="activity_boosts")
    score = models.IntegerField()

    @classmethod
    def get_post_score(cls, post_id: int):
        return (
            cls.objects.filter(
                post_id=post_id, created_at__gte=timezone.now() - timedelta(days=7)
            ).aggregate(total_score=Sum("score"))["total_score"]
            or 0
        )


class Vote(TimeStampedModel):
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
        ]
