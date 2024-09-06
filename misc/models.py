from django.db import models
from pgvector.django import VectorField

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


class Bulletin(TimeStampedModel):
    bulletin_start = models.DateTimeField()
    bulletin_end = models.DateTimeField()
    text = models.TextField()


class BulletinViewedBy(TimeStampedModel):
    bulletin = models.ForeignKey(Bulletin, on_delete=models.CASCADE)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)


# TODO: index new posts
# TODO: ensure we sync PostITNArticle new articles only
# TODO: create a sync command + cron job
