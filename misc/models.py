from django.db import models
from pgvector.django import VectorField

from posts.models import Post
from utils.models import TimeStampedModel


class ITNArticle(TimeStampedModel):
    aid = models.BigIntegerField(unique=True)
    title = models.CharField(null=False)
    text = models.CharField(null=True)
    url = models.CharField(null=False)
    img_url = models.CharField(null=False)
    favicon_url = models.CharField()

    embedding_vector = VectorField(
        help_text="Vector embeddings of the ITN Article content",
        null=True,
        blank=True,
    )


# TODO: index new posts
# TODO: ensure we sync PostITNArticle new articles only
# TODO: create a sync command + cron job
