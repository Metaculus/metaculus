import datetime

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from django.utils.timezone import make_aware

from comments.models import KeyFactorNews
from misc.models import ITNArticle, PostArticle
from misc.services.itn import assign_article_clusters, clear_old_itn_news
from tests.unit.test_misc.factories import factory_itn_article
from tests.unit.test_posts.factories import factory_post


def _article(vector, created_at, **kwargs):
    return factory_itn_article(
        embedding_vector=vector,
        created_at=make_aware(datetime.datetime(*created_at)),
        **kwargs,
    )


def test_assign_article_clusters_groups_near_duplicates():
    # Processed oldest-first, so the earliest article of each story becomes the
    # cluster representative. Vectors are chosen so a/b and c/d are within the
    # ARTICLE_CLUSTER_MAX_DISTANCE (0.1) cosine radius, while the two stories are
    # far apart.
    a = _article([1, 0, 0], (2025, 4, 1))  # story 1 representative
    b = _article([10, 1, 0], (2025, 4, 2))  # near-duplicate of a
    c = _article([0, 1, 0], (2025, 4, 3))  # story 2 representative
    d = _article([0, 10, 1], (2025, 4, 4))  # near-duplicate of c

    assign_article_clusters()

    for obj in (a, b, c, d):
        obj.refresh_from_db()

    # a starts its own cluster; b joins it.
    assert a.cluster_id == a.pk
    assert b.cluster_id == a.pk
    # c is too far from story 1, so it opens a new cluster; d joins c.
    assert c.cluster_id == c.pk
    assert d.cluster_id == c.pk


def test_assign_article_clusters_starts_new_cluster_without_neighbour():
    article = _article([1, 0, 0], (2025, 4, 1))

    assign_article_clusters()

    article.refresh_from_db()
    assert article.cluster_id == article.pk


def test_assign_article_clusters_skips_already_clustered_and_unembedded():
    # Already-clustered articles keep their cluster; articles without an embedding
    # are ignored entirely.
    clustered = _article([1, 0, 0], (2025, 4, 1), cluster_id=999)
    unembedded = factory_itn_article(embedding_vector=None)

    assign_article_clusters()

    clustered.refresh_from_db()
    unembedded.refresh_from_db()
    assert clustered.cluster_id == 999
    assert unembedded.cluster_id is None


@pytest.mark.parametrize("chunk_size", [1, 2, 500])
def test_assign_article_clusters_joins_existing_cluster(mocker, chunk_size):
    mocker.patch("misc.services.itn.ARTICLE_CLUSTER_CHUNK_SIZE", chunk_size)

    _article([0, 0, 1], (2025, 4, 1), cluster_id=111)
    _article([1, 0, 0], (2025, 4, 2), cluster_id=999)
    # Clustered articles are candidates even when newer than the new article
    _article([0, 1, 0], (2025, 4, 9), cluster_id=555)
    near_999 = _article([10, 1, 0], (2025, 4, 3))
    near_555 = _article([0, 10, 1], (2025, 4, 4))
    far = _article([1, 1, 1], (2025, 4, 5))

    assign_article_clusters()

    for obj in (near_999, near_555, far):
        obj.refresh_from_db()

    assert near_999.cluster_id == 999
    assert near_555.cluster_id == 555
    assert far.cluster_id == far.pk


def test_assign_article_clusters_prefers_nearest_across_new_and_existing():
    _article([20, 8, 0], (2025, 4, 1), cluster_id=999)
    a = _article([20, 0, 8], (2025, 4, 2))  # too far from 999: own cluster
    b = _article([20, 3, 6], (2025, 4, 3))  # within range of both, nearer to a
    c = _article([20, 6, 3], (2025, 4, 4))  # within range of all, nearest to 999

    assign_article_clusters()

    for obj in (a, b, c):
        obj.refresh_from_db()

    assert a.cluster_id == a.pk
    assert b.cluster_id == a.pk
    assert c.cluster_id == 999


def test_clear_old_itn_news_deletes_without_reading_text_or_embeddings(user1):
    old = _article([1, 0, 0], (2025, 4, 1))
    fresh = factory_itn_article(embedding_vector=[0, 1, 0], created_at=timezone.now())
    PostArticle.objects.create(
        article=old, post=factory_post(author=user1), distance=0.1
    )
    news = KeyFactorNews.objects.create(itn_article=old)

    with CaptureQueriesContext(connection) as ctx:
        clear_old_itn_news()

    assert list(ITNArticle.objects.values_list("pk", flat=True)) == [fresh.pk]
    assert not PostArticle.objects.exists()
    news.refresh_from_db()
    assert news.itn_article is None
    select_lists = [
        q["sql"].split(" FROM ")[0]
        for q in ctx.captured_queries
        if q["sql"].startswith("SELECT")
    ]
    assert not any('."text"' in s or "embedding_vector" in s for s in select_lists)
