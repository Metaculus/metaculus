from datetime import datetime, timezone as dt_timezone

from django.db import models
from django.db.models import Count, Q
from django.db.models.query import QuerySet
from django.db.models.functions import Coalesce
from django.utils import timezone as django_timezone

from projects.permissions import ObjectPermission
from users.models import User
from utils.models import validate_alpha_slug, TimeStampedModel

from questions.models import Question


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

    def filter_tags(self):
        return self.filter(type=Project.ProjectTypes.TAG)

    def filter_active(self):
        return self.filter(is_active=True)

    def annotate_posts_count(self):
        return self.annotate(posts_count=Count("posts", distinct=True))

    # Permissions
    def annotate_user_permission(self, user: User = None):
        """
        Annotates user permission for the project
        """

        # Step #1: find custom permission overrides
        user_permission_subquery = ProjectUserPermission.objects.filter(
            project_id=models.OuterRef("pk"), user_id=user.id if user else None
        ).values("permission")[:1]

        # Annotate the queryset
        if user and user.is_superuser:
            qs = self.annotate(user_permission=models.Value(ObjectPermission.ADMIN))
        else:
            qs = self.annotate(
                user_permission=Coalesce(
                    models.Subquery(user_permission_subquery),
                    "default_permission",
                    output_field=models.CharField(),
                )
            )

        return qs

    def filter_permission(self, user: User = None):
        """
        Returns only allowed projects for the user
        """

        return self.annotate_user_permission(user=user).filter(
            user_permission__isnull=False
        )


class Project(TimeStampedModel):
    class ProjectTypes(models.TextChoices):
        SITE_MAIN = "site_main"
        TOURNAMENT = "tournament"
        GLOBAL_LEADERBOARD = "global_leaderboard"
        QUESTION_SERIES = "question_series"
        PERSONAL_PROJECT = "personal_project"
        NEWS_CATEGORY = "news_category"
        PUBLIC_FIGURE = "public_figure"
        CATEGORY = "category"
        TAG = "tag"
        TOPIC = "topic"

        @classmethod
        def can_have_permissions(cls, tp: "ProjectTypes"):
            """
            Detects whether this project type can have permission configuration
            """

            return tp not in [cls.CATEGORY, cls.TAG, cls.TOPIC]

    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics"
        HOT_CATEGORIES = "hot_categories"

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
        User, models.CASCADE, related_name="created_projects", default=None, null=True
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
            self.ProjectTypes.GLOBAL_LEADERBOARD,
            self.ProjectTypes.QUESTION_SERIES,
        ):
            return self.close_date > django_timezone.now() if self.close_date else True


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
