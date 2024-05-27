from django.db import models
from django.db.models import Count

from users.models import User
from utils.models import validate_alpha_slug, TimeStampedModel


class ProjectsQuerySet(models.QuerySet):
    def filter_topic(self):
        return self.filter(type=Project.ProjectTypes.TOPIC)

    def filter_category(self):
        return self.filter(type=Project.ProjectTypes.CATEGORY)

    def filter_active(self):
        return self.filter(is_active=True)

    def annotate_questions_count(self):
        return self.annotate(questions_count=Count("questions"))


class Project(TimeStampedModel):
    class ProjectTypes(models.TextChoices):
        TOURNAMENT = "tournament", "Tournament"
        CATEGORY = "category", "Category"
        TAG = "tag", "Tag"
        TOPIC = "topic", "Topic"

    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics", "Hot Topics section"
        HOT_CATEGORIES = "hot_categories", "Hot Categories section"

    type = models.CharField(
        max_length=32,
        choices=ProjectTypes.choices,
        db_index=True,
    )

    name = models.CharField(max_length=200)
    slug = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        validators=[validate_alpha_slug],
    )

    subtitle = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    # TODO: migrate to S3/ImageField in the future
    header_image = models.CharField(null=True, blank=True)
    header_logo = models.CharField(null=True, blank=True)
    emoji = models.CharField(max_length=10, default="")

    order = models.IntegerField(
        help_text="Will be displayed ordered by this field inside each section",
        default=0,
    )

    # Access
    is_public = models.BooleanField(
        default=True,
        help_text=(
            "Public projects are accessible to all users even if they're "
            "not project members."
        ),
        db_index=True,
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive projects are not accessible to all users",
        db_index=True,
    )

    # Tournament-specific fields
    prize_pool = models.DecimalField(
        default=None, decimal_places=2, max_digits=15, null=True
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

    objects = models.Manager.from_queryset(ProjectsQuerySet)()

    # Annotated fields
    questions_count: int = 0

    class Meta:
        ordering = ("order", )
        constraints = [
            models.UniqueConstraint(
                name="projects_unique_type_slug", fields=["type", "slug"]
            ),
        ]
