import contextlib
import logging
import os
import select
import socket
import stat
import tempfile
import threading
from datetime import UTC, timedelta

import mysql.connector
import numpy as np
import paramiko
from django.conf import settings
from django.db.models import Count, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone
from pgvector.django import CosineDistance

from misc.models import ITNArticle, PostArticle
from posts.models import Post
from utils.db import paginate_cursor
from utils.openai import chunked_tokens, generate_text_embed_vector

MAX_RELEVANT_DISTANCE = 0.5
# Articles within this cosine distance of each other are treated as covering the
# same story and grouped into one cluster, so repeated coverage of an event does
# not add up multiple times in the news hotness score.
ARTICLE_CLUSTER_MAX_DISTANCE = 0.1
SSH_CONNECT_TIMEOUT_S = 10
SSH_KEEPALIVE_S = 30
MYSQL_CONNECT_TIMEOUT_S = 10

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


class _SSHLocalForwarder:
    """Listens on a random local TCP port and forwards each connection through
    an open paramiko Transport to a fixed remote host:port via direct-tcpip."""

    def __init__(
        self, transport: paramiko.Transport, remote_host: str, remote_port: int
    ):
        self._transport = transport
        self._remote = (remote_host, remote_port)
        self._listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._listener.bind(("127.0.0.1", 0))
        self._listener.listen(8)
        self._listener.settimeout(1.0)
        self.local_port: int = self._listener.getsockname()[1]
        self._stop = threading.Event()
        self._accept_thread = threading.Thread(target=self._accept_loop, daemon=True)

    def __enter__(self):
        self._accept_thread.start()
        return self

    def __exit__(self, exc_type, exc, tb):
        self._stop.set()
        self._listener.close()
        self._accept_thread.join(timeout=2.0)

    def _accept_loop(self):
        while not self._stop.is_set():
            try:
                client_sock, peer = self._listener.accept()
            except TimeoutError:
                continue
            except OSError:
                break
            try:
                channel = self._transport.open_channel(
                    "direct-tcpip", self._remote, peer
                )
            except Exception:
                logger.exception("Failed to open SSH forwarding channel")
                client_sock.close()
                continue
            threading.Thread(
                target=self._pipe, args=(client_sock, channel), daemon=True
            ).start()

    @staticmethod
    def _pipe(sock: socket.socket, channel: paramiko.Channel):
        try:
            while True:
                readable, _, _ = select.select([sock, channel], [], [])
                if sock in readable:
                    data = sock.recv(4096)
                    if not data:
                        break
                    channel.sendall(data)
                if channel in readable:
                    data = channel.recv(4096)
                    if not data:
                        break
                    sock.sendall(data)
        except OSError:
            pass
        finally:
            channel.close()
            sock.close()


@contextlib.contextmanager
def itn_db():
    with tempfile.NamedTemporaryFile() as tmp_ssh_key:
        tmp_ssh_key.write(settings.ITN_DB_MACHINE_SSH_KEY.encode())
        tmp_ssh_key.flush()
        os.fchmod(tmp_ssh_key.fileno(), stat.S_IRUSR | stat.S_IWUSR)
        pkey = paramiko.PKey.from_path(tmp_ssh_key.name)

        ssh_sock = socket.create_connection(
            (settings.ITN_DB_MACHINE_SSH_ADDR, 22), timeout=SSH_CONNECT_TIMEOUT_S
        )
        ssh_sock.settimeout(None)
        transport = paramiko.Transport(ssh_sock)
        try:
            transport.connect(username=settings.ITN_DB_MACHINE_SSH_USER, pkey=pkey)
            transport.set_keepalive(SSH_KEEPALIVE_S)
            with _SSHLocalForwarder(transport, "127.0.0.1", 3306) as tunnel:
                connection = mysql.connector.connect(
                    host="127.0.0.1",
                    user=settings.ITN_DB_USER,
                    password=settings.ITN_DB_PASSWORD,
                    database="itaculus",
                    port=tunnel.local_port,
                    use_pure=True,
                    connection_timeout=MYSQL_CONNECT_TIMEOUT_S,
                    time_zone="+00:00",
                )
                with connection:
                    with connection.cursor() as cursor:
                        yield cursor
        finally:
            transport.close()


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
           WHERE a.timestamp >= %s and a.medianame not in ({",".join(["%s"] * len(BLOCKED_MEDIAS))})
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
                    created_at=article["timestamp"].replace(tzinfo=UTC),
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
        # Skip generation for notebooks
        .filter_questions()
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

    # Skip generation for notebooks
    if post.notebook_id:
        return

    relevant_articles = (
        ITNArticle.objects.annotate(
            distance=CosineDistance("embedding_vector", post.embedding_vector)
        )
        .filter(
            distance__lte=MAX_RELEVANT_DISTANCE,
            # Take only fresh news
            created_at__gte=timezone.now() - timedelta(days=2),
        )
        .order_by("distance")[:20]
    )

    PostArticle.objects.bulk_create(
        [
            PostArticle(article=article, post=post, distance=article.distance)
            for article in relevant_articles
        ],
        ignore_conflicts=True,
    )


def assign_article_clusters():
    """Group near-duplicate articles (same story, different outlets/rewrites) so
    that repeated coverage counts only once towards a post's news hotness.

    Uses single-link assignment against already-clustered articles: each not yet
    clustered article joins the cluster of its nearest neighbour within
    ARTICLE_CLUSTER_MAX_DISTANCE, or starts its own cluster otherwise. Processed
    oldest-first so earlier articles act as cluster representatives.
    """
    unclustered = (
        ITNArticle.objects.filter(
            embedding_vector__isnull=False, cluster_id__isnull=True
        )
        .order_by("created_at")
        .iterator(chunk_size=100)
    )

    for article in unclustered:
        nearest_cluster_id = (
            ITNArticle.objects.filter(
                embedding_vector__isnull=False, cluster_id__isnull=False
            )
            .exclude(pk=article.pk)
            .annotate(
                distance=CosineDistance("embedding_vector", article.embedding_vector)
            )
            .filter(distance__lte=ARTICLE_CLUSTER_MAX_DISTANCE)
            .order_by("distance")
            .values_list("cluster_id", flat=True)
            .first()
        )

        article.cluster_id = nearest_cluster_id or article.pk
        article.save(update_fields=["cluster_id"])


def refresh_article_post_counts():
    """Recompute the number of distinct posts each article is matched to. Used as
    an inverse document frequency signal when scoring news hotness."""
    post_count_subquery = (
        PostArticle.objects.filter(article_id=OuterRef("pk"))
        .values("article_id")
        .annotate(count=Count("post_id", distinct=True))
        .values("count")
    )

    ITNArticle.objects.update(post_count=Coalesce(Subquery(post_count_subquery), 0))


def get_post_similar_articles(post: Post):
    return (
        PostArticle.objects.filter(
            pk__in=PostArticle.objects.filter(
                post=post,
                article__is_removed=False,
                created_at__gte=timezone.now() - timedelta(days=14),
            )
            .order_by("distance")
            .values_list("id")[:18]
        )
        .order_by("-created_at")
        .select_related("article")
    )


def remove_article(article: ITNArticle):
    article.is_removed = True
    article.save(update_fields=["is_removed"])
