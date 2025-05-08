from django.db import models
from django.db.models import (
    Count,
    FilteredRelation,
    Q,
    F,
    BooleanField,
    Exists,
    OuterRef,
)
from django.db.models.functions import Coalesce
from django.utils import timezone as django_timezone
from sql_util.aggregates import SubqueryAggregate

from projects.permissions import ObjectPermission
from questions.constants import ResolutionType
from questions.models import Question
from users.models import User
from utils.models import validate_alpha_slug, TimeStampedModel, TranslatedModel


class ProjectsQuerySet(models.QuerySet):
    def filter_topic(self):
        return self.filter(type=Project.ProjectTypes.TOPIC)

    def filter_news_category(self):
        return self.filter(type=Project.ProjectTypes.NEWS_CATEGORY)

    def filter_category(self):
        return self.filter(type=Project.ProjectTypes.CATEGORY)

    def filter_tournament(self):
        return self.filter(
            type__in=(
                Project.ProjectTypes.TOURNAMENT,
                Project.ProjectTypes.QUESTION_SERIES,
                Project.ProjectTypes.INDEX,
            )
        )

    def filter_news(self):
        return self.filter(type=Project.ProjectTypes.NEWS_CATEGORY)

    def filter_tags(self):
        return self.filter(type=Project.ProjectTypes.TAG)

    def filter_communities(self):
        return self.filter(type=Project.ProjectTypes.COMMUNITY)

    def annotate_posts_count(self):
        from posts.models import Post

        return self.annotate(
            posts_count=Coalesce(
                SubqueryAggregate(
                    "posts__id",
                    filter=Q(post__curation_status=Post.CurationStatus.APPROVED),
                    aggregate=Count,
                ),
                0,
            )
            + Coalesce(
                SubqueryAggregate(
                    "default_posts__id",
                    filter=Q(curation_status=Post.CurationStatus.APPROVED),
                    aggregate=Count,
                ),
                0,
            )
        )

    def annotate_questions_count(self):
        from posts.models import Post

        return self.annotate(
            posts_questions_count=Count(
                "posts__related_questions__question_id",
                filter=Q(
                    posts__curation_status=Post.CurationStatus.APPROVED,
                    posts__related_questions__question__question_weight__gt=0,
                )
                & ~Q(
                    posts__related_questions__question__resolution__in=[
                        ResolutionType.AMBIGUOUS,
                        ResolutionType.ANNULLED,
                    ]
                ),
                distinct=True,
            ),
            default_posts_questions_count=Count(
                "default_posts__related_questions__question_id",
                filter=Q(
                    default_posts__curation_status=Post.CurationStatus.APPROVED,
                    default_posts__related_questions__question__question_weight__gt=0,
                )
                & ~Q(
                    default_posts__related_questions__question__resolution__in=[
                        ResolutionType.AMBIGUOUS,
                        ResolutionType.ANNULLED,
                    ]
                ),
                distinct=True,
            ),
        ).annotate(
            questions_count=Coalesce(F("posts_questions_count"), 0)
            + Coalesce(F("default_posts_questions_count"), 0)
        )

    def annotate_is_subscribed(self, user: User, include_members: bool = False):
        """
        Annotates user subscription if user is subscribed or is actually an admin
        """

        condition = Exists(
            ProjectSubscription.objects.filter(user=user, project=OuterRef("pk"))
        )

        if include_members:
            condition |= Exists(
                ProjectUserPermission.objects.filter(user=user, project=OuterRef("pk"))
            )

        return self.annotate(
            is_subscribed=models.Case(
                models.When(
                    condition,
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=BooleanField(),
            )
        )

    # Permissions
    def annotate_user_permission(self, user: User = None):
        """
        Annotates user permission for the project
        """

        user_id = user.id if user else None

        # Superusers automatically get admin permission for all projects
        if user and user.is_superuser:
            return self.annotate(user_permission=models.Value(ObjectPermission.ADMIN))

        return self.annotate(
            _user_permission_override=FilteredRelation(
                "projectuserpermission",
                condition=Q(
                    projectuserpermission__user_id=user_id,
                ),
            ),
            user_permission=models.Case(
                models.When(
                    Q(created_by_id__isnull=False, created_by_id=user_id),
                    then=models.Value(ObjectPermission.ADMIN),
                ),
                default=Coalesce(
                    F("_user_permission_override__permission"),
                    F("default_permission"),
                ),
                output_field=models.CharField(),
            ),
        )

    def filter_permission(self, user: User = None, permission: ObjectPermission = None):
        """
        Returns only allowed projects for the user
        """

        qs = self.annotate_user_permission(user=user)

        if permission:
            return qs.filter(
                user_permission__in=ObjectPermission.get_included_permissions(
                    permission
                )
            )

        return self.annotate_user_permission(user=user).filter(
            user_permission__isnull=False
        )


class Project(TimeStampedModel, TranslatedModel):  # type: ignore
    class ProjectTypes(models.TextChoices):
        SITE_MAIN = "site_main"
        INDEX = "index"
        TOURNAMENT = "tournament"
        QUESTION_SERIES = "question_series"
        PERSONAL_PROJECT = "personal_project"
        NEWS_CATEGORY = "news_category"
        CATEGORY = "category"
        TAG = "tag"
        TOPIC = "topic"
        COMMUNITY = "community"

    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics"
        HOT_CATEGORIES = "hot_categories"

    class Visibility(models.TextChoices):
        NORMAL = "normal"
        NOT_IN_MAIN_FEED = "not_in_main_feed"
        UNLISTED = "unlisted"

    type = models.CharField(
        max_length=32,
        choices=ProjectTypes.choices,
        db_index=True,
    )

    primary_leaderboard = models.ForeignKey(
        "scoring.Leaderboard",
        null=True,
        on_delete=models.SET_NULL,
        related_name="primary_project",
        blank=True,
    )

    class BotLeaderboardStatus(models.TextChoices):
        EXCLUDE_AND_HIDE = "exclude_and_hide"
        EXCLUDE_AND_SHOW = "exclude_and_show"
        INCLUDE = "include"
        BOTS_ONLY = "bots_only"

    bot_leaderboard_status = models.CharField(
        max_length=32,
        choices=BotLeaderboardStatus.choices,
        default=BotLeaderboardStatus.EXCLUDE_AND_SHOW,
        help_text="""Sets the status of bots in any leaderboard associated with this project.<br>
        exclude_and_hide: Bots are excluded from ranks/prizes/medals and hidden from the leaderboard.<br>
        exclude_and_show: Bots are excluded from ranks/prizes/medals but shown on the leaderboard.<br>
        include: Bots are included in ranks/prizes/medals and shown on the leaderboard.<br>
        bots_only: Only Bots are included in ranks/prizes/medals. Non-bots are still shown.<br>
        """,
    )

    name = models.CharField(max_length=200)
    slug = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        validators=[validate_alpha_slug],
        db_index=True,
    )

    subtitle = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    header_image = models.ImageField(null=True, blank=True)
    header_logo = models.ImageField(null=True, blank=True)
    emoji = models.CharField(max_length=10, default="", blank=True)

    order = models.IntegerField(
        help_text="Will be displayed ordered by this field inside each section",
        default=0,
    )

    # Tournament-specific fields
    prize_pool = models.DecimalField(
        default=None, decimal_places=2, max_digits=15, null=True, blank=True
    )
    start_date = models.DateTimeField(null=True, blank=True)
    close_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "The date the tournament wraps up and prizes will be paid. "
            "All questions that should be included in the leaderboard must close and resolve before this date. "
            "This is displayed on the front end as the “Winners announced date”"
        ),
    )
    forecasting_end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "The date the last scored question that counts for the tournament closes."
            "The date shown is the latest of the Forecasting end date "
            "and the latest question close date closing and resolving before the Close date."
        ),
    )
    sign_up_fields = models.JSONField(
        default=list, blank=True, help_text="Used during tournament onboarding."
    )

    # Topic-specific fields
    section = models.CharField(
        max_length=32,
        choices=SectionTypes.choices,
        default=None,
        null=True,
        blank=True,
        help_text="This groups topics together under the same section in the sidebar. ",
    )

    # SEO
    meta_description = models.TextField(blank=True, default="")

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,  # TODO: change to SET_NULL
        related_name="created_projects",
        default=None,
        null=True,
        blank=True,
        db_index=True,
    )

    # Permissions
    # null -> private
    default_permission = models.CharField(
        choices=ObjectPermission.choices,
        null=True,
        blank=True,
        default=ObjectPermission.FORECASTER,
        db_index=True,
    )
    override_permissions = models.ManyToManyField(User, through="ProjectUserPermission")

    visibility = models.CharField(
        choices=Visibility.choices,
        default=Visibility.NOT_IN_MAIN_FEED,
        db_index=True,
        help_text=(
            "Sets the visibility of this project:<br>"
            "<ul>"
            "  <li><strong>Normal</strong>: Visible on the main feed, contributes to global leaderboards/medals, "
            "      and lists the project in the tournaments/question series page.</li>"
            "  <li><strong>Not In Main Feed</strong>: Not visible in the main feed but can be searched for, "
            "      doesn’t contribute to global leaderboards/medals, and lists the project "
            "      in the tournaments/question series page.</li>"
            "  <li><strong>Unlisted</strong>: Not visible in the main feed, not searchable, and doesn’t contribute "
            "      to global leaderboards/medals. This is the default visibility option for newly created "
            "      Tournaments/Question Series. It ensures they don’t appear on the tournaments page until admins "
            "      populate them with questions and are ready to make them public.</li>"
            "</ul><br>"
            "<strong>Note:</strong> If this project is <b>not</b> of type <code>site_main</code>, <code>tournament</code>, "
            "or <code>question_series</code>, this field should be set to <strong>Not In Main Feed</strong> to remain neutral."
        ),
    )

    # Whether we should display tournament on the homepage
    show_on_homepage = models.BooleanField(default=False, db_index=True)

    objects = models.Manager.from_queryset(ProjectsQuerySet)()

    # Annotated fields
    followers_count = models.PositiveIntegerField(
        default=0, db_index=True, editable=False
    )

    posts_count: int = 0
    is_subscribed: bool = False
    user_permission: ObjectPermission = None

    class Meta:
        ordering = ("order",)
        constraints = [
            models.UniqueConstraint(
                name="projects_unique_type_slug", fields=["type", "slug"]
            ),
        ]

    def __str__(self):
        return f"{self.type.capitalize()}: {self.name}"

    def save(self, *args, **kwargs):
        creating = not self.pk
        # Check if the primary leaderboard is associated with this project
        if self.primary_leaderboard and self.primary_leaderboard.project != self:
            raise ValueError(
                "Primary leaderboard must be associated with this project."
            )

        super().save(*args, **kwargs)
        if (
            creating
            and not self.primary_leaderboard
            and self.type
            in (
                self.ProjectTypes.TOURNAMENT,
                self.ProjectTypes.QUESTION_SERIES,
                self.ProjectTypes.COMMUNITY,
            )
        ):
            # create default leaderboard when creating a new tournament/question series
            from scoring.models import Leaderboard

            leaderboard = Leaderboard.objects.create(
                project=self,
                score_type=Leaderboard.ScoreTypes.PEER_TOURNAMENT,
            )
            Project.objects.filter(pk=self.pk).update(primary_leaderboard=leaderboard)

    @property
    def is_ongoing(self):
        if self.type in (
            self.ProjectTypes.TOURNAMENT,
            self.ProjectTypes.QUESTION_SERIES,
            self.ProjectTypes.INDEX,
        ):
            return self.close_date > django_timezone.now() if self.close_date else True

    def get_users_for_permission(self, min_permission: ObjectPermission):
        """
        Returns a QuerySet of users that have given permission level OR greater for the given project
        """

        permissions = ObjectPermission.get_included_permissions(min_permission)

        qs = User.objects.all()

        if self.default_permission in permissions:
            return qs

        return qs.filter(
            Q(
                projectuserpermission__project=self,
                projectuserpermission__permission__in=permissions,
            )
            | Q(is_superuser=True)
        ).distinct("pk")

    def update_followers_count(self):
        self.followers_count = self.subscriptions.count()


class ProjectUserPermission(TimeStampedModel):
    """
    Table to override permissions for specific users
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    permission = models.CharField(choices=ObjectPermission.choices, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="projectuserpermission_unique_user_id_project_id",
                fields=["user_id", "project_id"],
            ),
        ]


class ProjectSubscription(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="project_subscriptions"
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="subscriptions"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="projectsubscription_unique_user_project",
                fields=["user_id", "project_id"],
            )
        ]


class ProjectIndexQuestion(TimeStampedModel):
    """
    Index project question weights
    """

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="index_questions"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        help_text="Index Post Question",
    )
    weight = models.FloatField()

    order = models.IntegerField(
        help_text="Will be displayed ordered by this field inside each section",
        default=0,
    )

    class Meta:
        ordering = ("order",)
        constraints = [
            models.UniqueConstraint(
                name="projectindexquestion_unique_project_question",
                fields=["project", "question"],
            )
        ]
