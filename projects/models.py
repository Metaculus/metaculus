from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Count, FilteredRelation, Q, F
from django.db.models.functions import Coalesce
from django.db.models.query import QuerySet
from django.utils import timezone as django_timezone
from sql_util.aggregates import SubqueryAggregate

from projects.permissions import ObjectPermission
from users.models import User
from utils.models import validate_alpha_slug, TimeStampedModel

if TYPE_CHECKING:
    from scoring.models import Leaderboard


class ProjectsQuerySet(models.QuerySet):
    def filter_topic(self):
        return self.filter(type=Project.ProjectTypes.TOPIC)

    def filter_category(self):
        return self.filter(type=Project.ProjectTypes.CATEGORY)

    def filter_tournament(self):
        return self.filter(
            type__in=(
                Project.ProjectTypes.TOURNAMENT,
                Project.ProjectTypes.QUESTION_SERIES,
            )
        )

    def filter_news(self):
        return self.filter(type=Project.ProjectTypes.NEWS_CATEGORY)

    def filter_tags(self):
        return self.filter(type=Project.ProjectTypes.TAG)

    def filter_active(self):
        return self.filter(is_active=True)

    def annotate_posts_count(self):
        return self.annotate(
            posts_count=Coalesce(SubqueryAggregate("posts__id", aggregate=Count), 0)
            + Coalesce(SubqueryAggregate("default_posts__id", aggregate=Count), 0)
        )

    # Permissions
    def annotate_user_permission(self, user: User = None):
        """
        Annotates user permission for the project
        """

        user_id = user.id if user else None

        return self.annotate(
            user_permission_override=FilteredRelation(
                "projectuserpermission",
                condition=Q(
                    projectuserpermission__user_id=user_id,
                ),
            ),
            user_permission=Coalesce(
                F("user_permission_override__permission"),
                F("default_permission"),
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


class Project(TimeStampedModel):
    id: int
    leaderboards: QuerySet["Leaderboard"]

    class ProjectTypes(models.TextChoices):
        SITE_MAIN = "site_main"
        TOURNAMENT = "tournament"
        QUESTION_SERIES = "question_series"
        PERSONAL_PROJECT = "personal_project"
        NEWS_CATEGORY = "news_category"
        PUBLIC_FIGURE = "public_figure"
        CATEGORY = "category"
        TAG = "tag"
        TOPIC = "topic"

        @classmethod
        def can_have_permissions(cls, tp):
            """
            Detects whether this project type can have permission configuration
            """

            return tp not in [cls.CATEGORY, cls.TAG, cls.TOPIC]

    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics"
        HOT_CATEGORIES = "hot_categories"

    add_posts_to_main_feed = models.BooleanField(default=False)

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
    include_bots_in_leaderboard = models.BooleanField(default=False)

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

    is_active = models.BooleanField(
        default=True,
        help_text="Inactive projects are not accessible to all users",
        db_index=True,
    )

    # Tournament-specific fields
    prize_pool = models.DecimalField(
        default=None, decimal_places=2, max_digits=15, null=True, blank=True
    )
    start_date = models.DateTimeField(null=True, blank=True)
    close_date = models.DateTimeField(null=True, blank=True)
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
        models.CASCADE,
        related_name="created_projects",
        default=None,
        null=True,
        blank=True,
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

    objects = models.Manager.from_queryset(ProjectsQuerySet)()

    # Annotated fields
    posts_count: int = 0
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

    @property
    def is_ongoing(self):
        if self.type in (
            self.ProjectTypes.TOURNAMENT,
            self.ProjectTypes.QUESTION_SERIES,
        ):
            return self.close_date > django_timezone.now() if self.close_date else True

    def _get_users_for_permissions(
        self, permissions: list[ObjectPermission]
    ) -> QuerySet["User"]:
        qs = User.objects.all()

        if self.default_permission in permissions:
            return qs

        return qs.filter(
            projectuserpermission__project=self,
            projectuserpermission__permission__in=permissions,
        )

    def get_users_for_permission(
        self, permission: ObjectPermission
    ) -> QuerySet["User"]:
        """
        Returns a QuerySet of users that have given permission level OR greater for the given project
        """

        return self._get_users_for_permissions(
            ObjectPermission.get_included_permissions(permission)
        )

    def get_admins(self) -> QuerySet["User"]:
        """
        Returns admins only
        """

        return self._get_users_for_permissions([ObjectPermission.ADMIN])

    def get_curators(self) -> QuerySet["User"]:
        """
        Returns curators/mods only
        """

        return self._get_users_for_permissions([ObjectPermission.CURATOR])


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
