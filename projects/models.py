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
from django.db.models.query import QuerySet
from django.utils import timezone as django_timezone
from sql_util.aggregates import SubqueryAggregate

from projects.permissions import ObjectPermission
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

    def annotate_is_subscribed(self, user: User):
        """
        Annotates user subscription if user is subscribed or is actually an admin
        """

        return self.annotate(
            is_subscribed=models.Case(
                models.When(
                    Exists(
                        ProjectSubscription.objects.filter(
                            user=user, project=OuterRef("pk")
                        )
                    )
                    | Exists(
                        ProjectUserPermission.objects.filter(
                            user=user, project=OuterRef("pk")
                        )
                    ),
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

        return self.annotate(
            user_permission_override=FilteredRelation(
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
                    F("user_permission_override__permission"),
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
