import contextlib
import logging
import os
import stat
import tempfile
from datetime import timedelta

import mysql.connector
import numpy as np
from django.conf import settings
from django.utils import timezone
from pgvector.django import CosineDistance
from sshtunnel import SSHTunnelForwarder

from misc.models import ITNArticle, PostArticle
from posts.models import Post
from utils.db import paginate_cursor
from utils.openai import chunked_tokens, generate_text_embed_vector

MAX_RELEVANT_DISTANCE = 0.5

logger = logging.getLogger(__name__)

BLOCKED_MEDIAS = [
    # Purpose: russian foreign intelligence agency
    # https://en.wikipedia.org/wiki/New_Eastern_Outlook
    "neweasternoutlook",
    # Purpose: russian foreign intelligence agency
    # https://en.wikipedia.org/wiki/RT_(TV_network)
    "rt",
]


def check_itn_enabled():
    return bool(settings.ITN_DB_MACHINE_SSH_ADDR)


@contextlib.contextmanager
def itn_db():
    with tempfile.NamedTemporaryFile() as tmp_ssh_key:
        tmp_ssh_key.write(settings.ITN_DB_MACHINE_SSH_KEY.encode())
        tmp_ssh_key.flush()
        os.fchmod(tmp_ssh_key.fileno(), stat.S_IRUSR | stat.S_IWUSR)
        ssh_key_path = tmp_ssh_key.name

        print(ssh_key_path)
        with SSHTunnelForwarder(
            (settings.ITN_DB_MACHINE_SSH_ADDR, 22),
            ssh_username=settings.ITN_DB_MACHINE_SSH_USER,
            ssh_pkey=ssh_key_path,
            remote_bind_address=("127.0.0.1", 3306),
        ) as tunnel:
            connection = mysql.connector.connect(
                host=tunnel.local_bind_host,
                user=settings.ITN_DB_USER,
                password=settings.ITN_DB_PASSWORD,
                database="itaculus",
                port=tunnel.local_bind_port,
                use_pure=True,
            )

            with connection:
                with connection.cursor() as cursor:
                    yield cursor


def get_itn_max_age():
    """
    Max age of ITN article
    """

    return timezone.now() - timedelta(days=10)


def clear_old_itn_news():
    ITNArticle.objects.filter(created_at__lt=get_itn_max_age()).delete()


def sync_itn_news():
    articles_count = ITNArticle.objects.count()
    last_fetch_date = (
        ITNArticle.objects.order_by("-created_at")
        .values_list("created_at", flat=True)
        .first()
    )

    if not last_fetch_date or last_fetch_date < get_itn_max_age():
        last_fetch_date = get_itn_max_age()

    bunch = []
    itersize = 500

    with itn_db() as cursor:
        for article in paginate_cursor(
            cursor,
            f"""
           SELECT a.aID, a.title, t.text, a.url, a.imgurl, m.favicon, a.timestamp, a.medianame, m.name as media_label
           FROM itaculus.articles a
           JOIN fulltext.articletext t ON a.aid = t.aid
           LEFT JOIN itaculus.media m on m.label = a.medianame
           WHERE a.timestamp >= %s and a.medianame not in ({','.join(['%s'] * len(BLOCKED_MEDIAS))})
           """,
            [last_fetch_date, *BLOCKED_MEDIAS],
            itersize=itersize,
        ):
            bunch.append(
                ITNArticle(
                    aid=article["aID"],
                    title=article["title"],
                    text=article["text"],
                    url=article["url"],
                    img_url=article["imgurl"],
                    favicon_url=article["favicon"] or "",
                    created_at=article["timestamp"],
                    media_name=article["medianame"],
                    media_label=article["media_label"] or "",
                )
            )

            if len(bunch) >= itersize:
                ITNArticle.objects.bulk_create(bunch, ignore_conflicts=True)
                bunch = []

                print("Synced 500 articles", end="\r")

    ITNArticle.objects.bulk_create(bunch, ignore_conflicts=True)

    articles_count = ITNArticle.objects.count() - articles_count
    logger.info(f"Synced {articles_count} ITN articles")


def update_article_embedding_vector(obj: ITNArticle):
    content = "\n".join([obj.title, obj.text])
    chunk_embeddings = []

    # Step 1: generate embedding chunks
    for chunk in chunked_tokens(content):
        chunk_embeddings.append(generate_text_embed_vector(chunk))

    # Step 2: weight them
    vector = np.average(
        chunk_embeddings, axis=0, weights=[len(ch) for ch in chunk_embeddings]
    )

    obj.embedding_vector = vector
    obj.save()


def generate_related_posts_for_article(article: ITNArticle):
    """
    Generates related posts for the given ITN Article

    Generates relevant posts for the given ITN article and saves them to the PostArticle cache table
    """

    relevant_posts = (
        Post.objects.filter_public()
        .filter_published()
        .annotate(distance=CosineDistance("embedding_vector", article.embedding_vector))
        .filter(distance__lte=MAX_RELEVANT_DISTANCE)
    )

    PostArticle.objects.bulk_create(
        [
            PostArticle(article=article, post=post, distance=post.distance)
            for post in relevant_posts
        ],
        ignore_conflicts=True,
        batch_size=100,
    )


def generate_related_articles_for_post(post: Post):
    """
    Generates related ITN Articles for the given Post and saves them in the PostArticle cache table.
    Takes only 20 relevant objects
    """

    relevant_articles = (
        ITNArticle.objects.annotate(
            distance=CosineDistance("embedding_vector", post.embedding_vector),
            # Take only fresh news
            created_at__gte=timezone.now() - timedelta(days=2),
        )
        .filter(distance__lte=MAX_RELEVANT_DISTANCE)
        .order_by("distance")[:20]
    )

    PostArticle.objects.bulk_create(
        [
            PostArticle(article=article, post=post, distance=article.distance)
            for article in relevant_articles
        ],
        ignore_conflicts=True,
    )


def get_post_similar_articles(post: Post):
    article_ids = (
        PostArticle.objects.filter(
            post=post,
            article__is_removed=False,
            created_at__gte=timezone.now() - timedelta(days=14),
        )
        .order_by("distance")
        .values_list("article_id")[:18]
    )

    return ITNArticle.objects.filter(pk__in=article_ids).order_by("-created_at")


def remove_article(article: ITNArticle):
    article.is_removed = True
    article.save(update_fields=["is_removed"])
