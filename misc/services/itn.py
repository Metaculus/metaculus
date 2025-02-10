import contextlib
import logging
import os
import stat
import tempfile
from datetime import timedelta

import mysql.connector
import numpy as np
from django.conf import settings
from django.core.cache import cache
from django.db.models import F, ExpressionWrapper, Func, IntegerField
from django.db.models.functions import Now
from django.utils import timezone
from pgvector.django import CosineDistance
from sshtunnel import SSHTunnelForwarder

from misc.models import ITNArticle
from posts.models import Post
from utils.cache import cache_get_or_set
from utils.db import paginate_cursor
from utils.openai import chunked_tokens, generate_text_embed_vector

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


def get_post_similar_articles_qs(post: Post):
    return (
        ITNArticle.objects.annotate(
            nr_days_old=ExpressionWrapper(
                Func(
                    Now() - F("created_at"),
                    function="EXTRACT",
                    template="%(function)s(DAY FROM %(expressions)s)",
                ),
                output_field=IntegerField(),
            ),
            distance=CosineDistance("embedding_vector", post.embedding_vector),
        )
        .annotate(rank=(1 - F("distance") - (F("nr_days_old") / 600)))
        # Exclude removed posts
        .filter(is_removed=False)
        .filter(rank__isnull=False)
        .order_by("-rank")
    )


def get_post_articles_cache(post_id: str):
    return f"post_similar_itn_article_ids:{post_id}"


def get_post_similar_articles(post: Post):
    article_ids = cache_get_or_set(
        get_post_articles_cache(post.pk),
        lambda: list(
            get_post_similar_articles_qs(post).values_list("id", flat=True)[:9]
        ),
        # 12h
        timeout=3600 * 12,
        version=1,
    )

    return ITNArticle.objects.filter(pk__in=article_ids)


def remove_article(article: ITNArticle):
    article.is_removed = True
    article.save()

    # Drop cache
    cache.delete_pattern(get_post_articles_cache("*"))
