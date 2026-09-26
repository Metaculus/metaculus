import datetime

from django.utils.timezone import make_aware
from freezegun import freeze_time

from misc.models import PostArticle
from misc.services.itn import (
    assign_article_clusters,
    rebuild_related_articles_for_post,
)
from questions.models import Question
from tests.unit.test_misc.factories import factory_itn_article
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question


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


def _post(vector):
    return factory_post(
        question=create_question(question_type=Question.QuestionType.BINARY),
        embedding_vector=vector,
    )


@freeze_time("2025-04-10")
def test_rebuild_related_articles_for_post_rebuilds_matches():
    post = _post([1, 0, 0])
    near = _article([1, 0.1, 0], (2025, 4, 4))
    far = _article([0, 1, 0], (2025, 4, 9))
    # Matched from the post's previous vector
    PostArticle.objects.create(post=post, article=far, distance=0.1)

    rebuild_related_articles_for_post(post)

    matches = list(PostArticle.objects.filter(post=post))
    assert [m.article_id for m in matches] == [near.pk]
    # Dated by the article, so time decay treats old coverage as old
    assert matches[0].created_at == near.created_at


def test_rebuild_related_articles_for_post_without_vector_clears_matches():
    post = _post(None)
    article = _article([1, 0, 0], (2025, 4, 4))
    PostArticle.objects.create(post=post, article=article, distance=0.1)

    rebuild_related_articles_for_post(post)

    assert not PostArticle.objects.filter(post=post).exists()
