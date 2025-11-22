from django.db import models
from pgvector.django import VectorField

from posts.models import Post
from projects.models import Project
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


class PostArticle(TimeStampedModel):
    article = models.ForeignKey(ITNArticle, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    distance = models.FloatField(null=False, db_index=True)

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

    post = models.ForeignKey(
        Post,
        null=True,
        db_index=True,
        on_delete=models.CASCADE,
        help_text="""Optional. If set, places this Bulletin only on this post's page.""",
    )
    project = models.ForeignKey(
        Project,
        null=True,
        db_index=True,
        on_delete=models.CASCADE,
        help_text="""Optional. If set, places this Bulletin only on this project's page.""",
    )

    def __str__(self):
        text = self.text
        if self.post:
            text = (self.post.short_title or self.post.title) + ": " + text
        elif self.project:
            text = self.project.name + ": " + text
        return text[:150] + "..." if len(text) > 150 else text


class BulletinViewedBy(TimeStampedModel):
    bulletin = models.ForeignKey(Bulletin, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class WhitelistUser(TimeStampedModel):
    """Whitelist for users for permission to download user-level data"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="whitelists")
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="whitelists",
        help_text="Optional. If provided, this allows the user to download user-level "
        "data for the project. If neither project nor post is set, the user is "
        "whitelisted for all data.",
    )
    post = models.ForeignKey(
        Post,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="whitelists",
        help_text="Optional. If provided, this allows the user to download user-level "
        "data for the post. If neither project nor post is set, the user is "
        "whitelisted for all data.",
    )
    view_deanonymized_data = models.BooleanField(
        default=False,
        help_text="If False, all downloaded data will be anonymized.",
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Optional notes about the whitelisting, e.g., reason for access. "
        "Please note any specific conditions.",
    )


class SidebarItem(TimeStampedModel):
    class SectionTypes(models.TextChoices):
        HOT_TOPICS = "hot_topics"
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
