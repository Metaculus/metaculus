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


class BulletinViewedBy(TimeStampedModel):
    bulletin = models.ForeignKey(Bulletin, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class WhitelistUser(TimeStampedModel):
    """Whitelist for users for permission to download user-level data"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="whitelists")
    project = models.ForeignKey(
        Project,
        null=True,
        on_delete=models.CASCADE,
        related_name="whitelists",
        help_text="Optional. If provided, this allows the user to download user-level "
        "data for the project. If neither project nor post is set, the user is "
        "whitelisted for all data.",
    )
    post = models.ForeignKey(
        Post,
        null=True,
        on_delete=models.CASCADE,
        related_name="whitelists",
        help_text="Optional. If provided, this allows the user to download user-level "
        "data for the post. If neither project nor post is set, the user is "
        "whitelisted for all data.",
    )
