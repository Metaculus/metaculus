from django.db import models
from django.db.models import (
    Count,
    FilteredRelation,
    Q,
    F,
    BooleanField,
    Exists,
    OuterRef,
    Sum,
)
from django.db.models.functions import Coalesce
from django.utils import timezone as django_timezone
from sql_util.aggregates import SubqueryAggregate
from django.contrib.postgres.expressions import ArraySubquery

from projects.permissions import ObjectPermission
from questions.constants import UnsuccessfulResolutionType
from scoring.constants import LeaderboardScoreTypes
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

    def filter_leaderboard_tags(self):
        return self.filter(type=Project.ProjectTypes.LEADERBOARD_TAG)

    def filter_communities(self):
        return self.filter(type=Project.ProjectTypes.COMMUNITY)

    def annotate_top_n_post_titles(self, n: int = 3):
        from posts.models import Post

        now = django_timezone.now()
        # We must query the M2M through table directly instead of Post.objects.filter(projects=OuterRef("pk"))
        # When filtering Post with an M2M relation using OuterRef, Django generates a JOIN that
        # includes extra columns in the SELECT. ArraySubquery wraps the query in PostgreSQL's ARRAY()
        # which requires exactly one column. Querying the through table with a direct FK lookup
        # generates a clean single-column SELECT.
        ThroughModel = Post.projects.through
        subquery = (
            ThroughModel.objects.filter(
                project_id=OuterRef("pk"),
                post__curation_status=Post.CurationStatus.APPROVED,
                post__open_time__lte=now,
            )
            .filter(
                Q(post__actual_close_time__isnull=True)
                | Q(post__actual_close_time__gt=now)
            )
            .order_by("-post__hotness")
            .values("post__title")[:n]
        )
        return self.annotate(top_n_post_titles=ArraySubquery(subquery))

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
                        UnsuccessfulResolutionType.AMBIGUOUS,
                        UnsuccessfulResolutionType.ANNULLED,
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
                        UnsuccessfulResolutionType.AMBIGUOUS,
                        UnsuccessfulResolutionType.ANNULLED,
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
        LEADERBOARD_TAG = "leaderboard_tag"
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

    # SEO
    html_metadata_json = models.JSONField(
        help_text="Custom JSON for HTML meta tags. Supported fields are: title, description",
        null=True,
        blank=True,
        default=None,
    )

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
    show_on_services_page = models.BooleanField(
        default=False, db_index=True, help_text="Show project on the Services page."
    )

    forecasts_flow_enabled = models.BooleanField(
        default=True, help_text="Enables new forecast flow for tournaments"
    )

    # Stored counters
    followers_count = models.PositiveIntegerField(
        default=0, db_index=True, editable=False
    )
    forecasts_count = models.PositiveIntegerField(default=0, editable=False)
    forecasters_count = models.PositiveIntegerField(default=0, editable=False)

    # Index Project Data
    index = models.OneToOneField(
        "ProjectIndex", models.SET_NULL, related_name="project", null=True, blank=True
    )

    # Annotated fields
    posts_count: int = 0
    is_subscribed: bool = False
    user_permission: ObjectPermission = None

    objects = models.Manager.from_queryset(ProjectsQuerySet)()

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

        # Auto-create index object
        if self.type == self.ProjectTypes.INDEX and not self.index_id:
            self.index = ProjectIndex.objects.create()

        # Delete index for non-index projects
        if self.type != self.ProjectTypes.INDEX and self.index:
            self.index.delete()
            self.index = None

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
                score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
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

    def update_forecasts_count(self):
        from posts.models import Post

        result = Post.objects.filter_projects(self).aggregate(
            total_forecasts=Sum("forecasts_count")
        )

        self.forecasts_count = result["total_forecasts"] or 0

    def update_forecasters_count(self):
        from posts.models import PostUserSnapshot

        self.forecasters_count = (
            PostUserSnapshot.objects.filter(
                last_forecast_date__isnull=False,
                user__is_staff=False,
                # TODO: don't count project admins
            )
            .filter(Q(post__default_project=self) | Q(post__projects=self))
            .values("user_id")
            .distinct()
            .count()
        )


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


class ProjectIndex(TimeStampedModel):
    class IndexType(models.TextChoices):
        DEFAULT = "default"
        MULTI_YEAR = "multi_year"

    type = models.CharField(
        max_length=32, choices=IndexType.choices, default=IndexType.DEFAULT
    )
    min = models.SmallIntegerField(default=-100, help_text="Y-axis min")
    min_label = models.CharField(
        max_length=200,
        blank=True,
        help_text="Label at the minimum end of the scale (left). Example: “Less democratic”",
    )
    max = models.SmallIntegerField(default=100, help_text="Y-axis max")
    max_label = models.CharField(
        max_length=200,
        blank=True,
        help_text="Label at the maximum end of the scale (right). Example: “More democratic”",
    )
    increasing_is_good = models.BooleanField(
        default=True,
        help_text=(
            "Color polarity: if on, higher values are good (green → right, red → left); "
            "if off, invert the colors"
        ),
    )

    class Meta:
        verbose_name = "Index"
        verbose_name_plural = "Indexes"


class ProjectIndexPost(TimeStampedModel):
    """
    Index project post weights
    """

    index = models.ForeignKey(
        ProjectIndex, on_delete=models.CASCADE, related_name="post_weights"
    )
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        help_text="Index Post",
        related_name="index_weights",
    )
    weight = models.FloatField(
        help_text=(
            "Weight of the post within the index. "
            "If the post includes a group of questions, "
            "the same weight will be applied to all subquestions."
        ),
        default=1.0,
    )

    order = models.IntegerField(
        help_text="Will be displayed ordered by this field inside each section",
        default=0,
    )

    class Meta:
        ordering = ("order",)
        constraints = [
            models.UniqueConstraint(
                name="projectindexpost_unique_project_question",
                fields=["index", "post"],
            )
        ]

    def save(self, *args, **kwargs):
        # Always add index post to the project
        if self.post.default_project_id != self.index.project.id:
            self.post.projects.add(self.index.project)

        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # On removal from index, also remove the post from the project
        self.post.projects.remove(self.index.project)

        return super().delete(*args, **kwargs)
