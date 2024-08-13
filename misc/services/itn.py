import contextlib
import logging
import os
import stat
import tempfile
from datetime import timedelta
from typing import Union

import mysql.connector
import numpy as np
from django.conf import settings
from django.db.models import F, ExpressionWrapper, Func, IntegerField
from django.db.models.functions import Now
from django.utils import timezone
from pgvector.django import CosineDistance
from sshtunnel import SSHTunnelForwarder

from misc.models import ITNArticle, PostITNArticle
from posts.models import Post
from utils.cache import cache_get_or_set
from utils.db import paginate_cursor
from utils.management import parallel_command_executor
from utils.openai import chunked_tokens, generate_text_embed_vector

logger = logging.getLogger(__name__)


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


def sync_itn_news():
    last_fetch_date = ITNArticle.objects.order_by("-created_at").values_list(
        "created_at", flat=True
    ).first() or timezone.now() - timedelta(days=7)

    bunch = []
    itersize = 500

    with itn_db() as cursor:
        for article in paginate_cursor(
            cursor,
            """
                                                                                                                                                                                                                    SELECT a.aID, a.title, t.text, a.url, a.imgurl, m.favicon, a.timestamp
                                                                                                                                                                                                                    FROM itaculus.articles a
                                                                                                                                                                                                                    JOIN fulltext.articletext t ON a.aid = t.aid
                                                                                                                                                                                                                    LEFT JOIN itaculus.media m on m.label = a.medianame
                                                                                                                                                                                                                    WHERE a.timestamp >= %s
                                                                                                                                                                                                                    """,
            [last_fetch_date],
            itersize=itersize,
        ):
            bunch.append(
                ITNArticle(
                    aid=article["aID"],
                    title=article["title"],
                    text=article["text"],
                    url=article["url"],
                    img_url=article["imgurl"],
                    favicon_url=article["favicon"],
                    created_at=article["timestamp"],
                )
            )

            if len(bunch) >= itersize:
                ITNArticle.objects.bulk_create(bunch, ignore_conflicts=True)
                bunch = []

                print("Processed 500 articles")

    ITNArticle.objects.bulk_create(bunch, ignore_conflicts=True)


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


def generate_embedding_vectors__worker(ids, worker_idx):
    for idx, article in enumerate(
        ITNArticle.objects.filter(id__in=ids).iterator(chunk_size=100)
    ):
        try:
            update_article_embedding_vector(article)
            if idx % 10 == 0:
                print(f"[W{worker_idx}] Processed total {idx} of {len(ids)} records")
        except Exception:
            logger.exception("Error during generation of the vector")


def generate_embedding_vectors():
    article_ids = list(
        ITNArticle.objects.filter(embedding_vector__isnull=True).values_list(
            "id", flat=True
        )
    )

    # TODO: decrease  num workers
    parallel_command_executor(
        article_ids, generate_embedding_vectors__worker, num_processes=20
    )


def qs_annotate_rank(qs: Union[Post.objects, ITNArticle.objects]):
    return (
        qs.annotate(rank=(1 - F("distance") - (F("nr_days_old") / 600)))
        .filter(rank__isnull=False)
        .order_by("-rank")
    )


def generate_post_article_relations(qs: Post.objects):
    """
    Find similar articles for posts
    """

    m2m_bunch = []
    itersize = 500

    for idx, post in enumerate(qs):
        articles = qs_annotate_rank(
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
        )[:9]

        for article in articles:
            m2m_bunch.append(
                PostITNArticle(article=article, post=post, distance=article.distance)
            )

            if len(m2m_bunch) >= itersize:
                PostITNArticle.objects.bulk_create(m2m_bunch, ignore_conflicts=True)
                m2m_bunch = []

        if idx % itersize == 0:
            print(f"Processed {idx + 1} Post<>ItnArticle m2m relations", end="\r")

    PostITNArticle.objects.bulk_create(m2m_bunch, ignore_conflicts=True)

    return qs


def get_post_get_similar_articles_qs(post: Post):
    return qs_annotate_rank(
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
    )


def get_post_get_similar_articles(post: Post):
    return cache_get_or_set(
        f"post_similar_itn_articles:v1:{post.pk}",
        lambda: get_post_get_similar_articles_qs(post)[:9],
        # 12h
        timeout=3600 * 12,
    )
