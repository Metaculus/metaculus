from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.fields.files import ImageFieldFile
from django.utils.html import strip_tags
from pgvector.django import VectorField

from posts.models import Post
from projects.models import Project
from users.constants import ApiAccessLevel, ApiAccessTier
from users.models import User
from utils.models import TimeStampedModel


class ITNArticle(TimeStampedModel):
    aid = models.BigIntegerField(unique=True)
    title = models.CharField()
    text = models.CharField()
    url = models.CharField()
    img_url = models.CharField(default="")
    favicon_url = models.CharField(default="")
    media_name = models.CharField(default="")
    media_label = models.CharField(default="")

    embedding_vector = VectorField(
        help_text="Vector embeddings of the ITN Article content",
        null=True,
        blank=True,
    )
    is_removed = models.BooleanField(default=False)

    # Id of the near-duplicate cluster this article belongs to (the id of the
    # cluster's representative article). Articles covering the same story share a
    # cluster so that repeated coverage counts only once towards news hotness.
    cluster_id = models.BigIntegerField(null=True, blank=True, db_index=True)


class PostArticleQuerySet(models.QuerySet):
    def annotate_article_post_count(self):
        """Annotate each match with the number of distinct posts its article is
        matched to, shadowing PostArticle.article_post_count's default.

        Counts the article's matches in full: callers narrow which matches they
        *score*, not which ones make an article broad.
        """
        return self.annotate(
            article_post_count=models.Count(
                "article__postarticle__post_id", distinct=True
            )
        )


class PostArticle(TimeStampedModel):
    article = models.ForeignKey(ITNArticle, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    distance = models.FloatField(null=False, db_index=True)

    objects = PostArticleQuerySet.as_manager()

    # Number of distinct posts the article is matched to
    article_post_count: int = 0

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="post_article_unique", fields=["article_id", "post_id"]
            ),
        ]


class Bulletin(TimeStampedModel):
    bulletin_start = models.DateTimeField()
    bulletin_end = models.DateTimeField()
    text = models.TextField()

    def __str__(self):
        plain_text = strip_tags(self.text)
        return plain_text[:150] + "..." if len(plain_text) > 150 else plain_text


class BulletinViewedBy(TimeStampedModel):
    bulletin = models.ForeignKey(Bulletin, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class UserDataAccess(TimeStampedModel):
    """Whitelists a user to read user-level data they could not otherwise see.

    Purely additive: an entry only ever widens what its user may read, and a user with
    no entry sees the default aggregated, anonymized data. Nothing here affects the
    user's API access level - that lives in UserApiAccess.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="data_accesses"
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="data_accesses",
        help_text="Optional. Scopes this entry to a specific project. "
        "If neither project nor post is set while `view_user_data` is True, this entry "
        "will apply globally with respect to viewing user data. "
        "The API access tier will apply to this project if it exceeds the user's "
        "base tier. If neither project nor post is set, the api_access_tier will be "
        "taken from the User's base tier.",
    )
    post = models.ForeignKey(
        Post,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="data_accesses",
        help_text="Optional. Scopes this entry to a specific post. "
        "The API access tier will apply to this post if it exceeds the user's "
        "base tier. If neither project nor post is set, the entry applies globally.",
    )

    # Deprecated, and no longer read: API access levels live in
    # UserApiAccess. TEMPORARY - retained only so this branch can be
    # exercised against the API gateway. The RemoveField migration must land
    # before this merges.
    api_access_tier = models.CharField(
        max_length=32,
        choices=ApiAccessTier.choices,
        default=ApiAccessTier.RESTRICTED,
        help_text="Indicates the API access tier relevant to this data access entry.",
    )
    view_user_data = models.BooleanField(
        default=False,
        help_text="If True, the user can view user-level data (e.g., download datasets "
        "with user-level information included). If False, the user can only access "
        "aggregated data or anonymized user-level data.",
    )
    view_deanonymized_data = models.BooleanField(
        default=False,
        help_text="If False, all downloaded data will be anonymized.",
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Optional notes about the data access grant, e.g., reason for access. "
        "Please note any specific conditions.",
    )

    class Meta:
        unique_together = [("user", "project", "post")]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(project__isnull=True) | models.Q(post__isnull=True),
                name="userdataaccess_project_or_post_not_both",
            )
        ]


class UserApiAccess(TimeStampedModel):
    """Raises the API access level an external API gateway grants a user.

    This model is inert on its own. Nothing in this codebase reads it to make an access
    decision; it is only serialized to an external API gateway (which Metaculus runs in
    front of this backend), and that gateway decides what a request may read. A
    deployment without such a gateway can ignore this model entirely.

    Resolution rules:

    - A user with no entry is `restricted`, the default level. There is deliberately no
      stored `restricted` level, since a grant conferring it would mean nothing.
    - An entry with no project is global: it applies to every request the user makes.
    - An entry with a project applies only to data belonging to that project.
    - The most permissive applicable level wins. A project entry can therefore only
      widen a global one, never narrow it: a user who is globally `benchmarking` and
      `unrestricted` on one project is `unrestricted` there and `benchmarking`
      everywhere else.

    Read access to *user-level* data is a separate axis, granted by UserDataAccess. A
    level here decides which fields and endpoints the gateway exposes; it never causes
    another forecaster's identity to be revealed.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="api_accesses"
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="api_accesses",
        help_text="Optional. Scopes this grant to data belonging to one project. "
        "Leave blank to grant the level globally, on every request the user makes.",
    )
    access_level = models.CharField(
        max_length=32,
        choices=ApiAccessLevel.choices,
        help_text="The level granted at this scope. Omit the entry entirely to leave "
        "the user restricted; the most permissive applicable grant always wins.",
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Optional notes about the grant, e.g. who asked for it and why. "
        "Please note any specific conditions.",
    )

    class Meta:
        verbose_name_plural = "user api accesses"
        constraints = [
            # One grant per scope per user, counting "no project" as a scope of its own
            # (nulls_distinct=False), so a user cannot hold two conflicting global rows.
            models.UniqueConstraint(
                fields=["user", "project"],
                name="userapiaccess_unique_user_project",
                nulls_distinct=False,
            )
        ]

    def __str__(self) -> str:
        scope = self.project.name if self.project_id else "global"
        return f"{self.user}: {self.access_level} ({scope})"


def default_ad_tile_placements() -> list[str]:
    return [
        AdTile.Placements.QUESTIONS_FEED.value,
        AdTile.Placements.QUESTION_SIDEBAR.value,
    ]


class AdTile(TimeStampedModel):
    class Placements(models.TextChoices):
        QUESTIONS_FEED = "questions_feed"
        QUESTION_SIDEBAR = "question_sidebar"
        NEWS_FEED = "news_feed"

    title = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Required unless a Project is selected (its name is used instead).",
    )
    description = models.TextField(blank=True, default="")
    image = models.ImageField(null=True, blank=True)
    cta_text = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Call-to-action button label. If blank, no CTA button is rendered.",
    )
    url = models.CharField(
        blank=True,
        default="",
        help_text="Destination URL. Required unless a Project is selected (its link is used).",
    )

    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ad_tiles",
        help_text=(
            "Optional. Provides default title/image and de-duplicates against the "
            "auto-generated feed tile for the same project."
        ),
    )

    is_active = models.BooleanField(
        default=True, help_text="Master on/off switch, independent of the schedule."
    )
    publish_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional scheduled start. Blank = immediately.",
    )
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="Optional auto-hide time. Blank = never."
    )

    order = models.PositiveIntegerField(
        default=0, help_text="Lower numbers are served first."
    )
    exposure_rate = models.PositiveSmallIntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="1-100. Percentage chance of being shown (rolled on the frontend).",
    )
    placements = ArrayField(
        models.CharField(max_length=32, choices=Placements.choices),
        default=default_ad_tile_placements,
        help_text="Surfaces this tile may appear on. At least one is required.",
    )

    class Meta:
        ordering = ("order", "-created_at")

    def __str__(self):
        return self.display_title or self.url

    @property
    def display_title(self) -> str:
        return self.title or (self.project.name if self.project_id else "")

    @property
    def display_image(self) -> ImageFieldFile | None:
        if self.image:
            return self.image
        return self.project.header_image if self.project_id else None


class SidebarItem(TimeStampedModel):
    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics"
        # Legacy for the question feed sidebar. Feed categories now come from
        # /projects/categories/ and frontend consumers should ignore this value.
        HOT_CATEGORIES = "hot_categories"

    name = models.CharField(
        max_length=200,
        default="",
        blank=True,
        help_text=(
            "Display label for the sidebar item. "
            "For URL items, this must be set. "
            "For Post or Project items, it overrides the default title if provided."
        ),
    )

    emoji = models.CharField(
        max_length=10,
        default="",
        blank=True,
        help_text="Optional emoji or icon to display alongside the item name.",
    )

    section = models.CharField(
        max_length=32,
        choices=SectionTypes.choices,
        default="",
        blank=True,
        help_text=(
            "Assign the item to a sidebar section. "
            "If left blank, the item appears above all defined sections."
        ),
    )

    url = models.CharField(
        default="",
        blank=True,
        help_text=(
            "Optional full or relative URL. "
            "If set, the item links to this URL instead of a Post or Project."
        ),
    )

    post = models.ForeignKey(
        Post,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        help_text="Optional. If provided, the item links to the specified Post.",
    )

    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        help_text="Optional. If provided, the item links to the specified Project.",
    )

    order = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Determines the display order within its section. "
            "Lower numbers appear first."
        ),
    )

    class Meta:
        ordering = ("section", "order", "created_at")

    @property
    def display_name(self):
        names = [
            self.name,
            getattr(self.post, "title", None),
            getattr(self.project, "name", None),
        ]
        name = next((x for x in names if x), "")
        emoji = self.emoji or getattr(self.project, "emoji", None)

        return " ".join(filter(None, [emoji, name]))

    def __str__(self):
        return self.display_name
