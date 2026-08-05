import datetime

from django.utils.timezone import make_aware

from misc.services.itn import assign_article_clusters
from tests.unit.test_misc.factories import factory_itn_article


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
