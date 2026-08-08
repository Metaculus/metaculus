import datetime
import math

import pytest
from django.db.models import Prefetch
from django.utils.timezone import make_aware
from freezegun import freeze_time

from comments.services.common import create_comment
from misc.models import PostArticle
from posts.models import Post, PostActivityBoost, Vote
from posts.services.common import vote_post
from posts.services.hotness import (
    compute_feed_hotness,
    decay,
    compute_question_hotness,
    _compute_hotness_post_votes,
    _compute_hotness_comments,
    _compute_hotness_relevant_news,
    compute_hotness_total_boosts,
    compute_post_hotness,
    explain_post_news_hotness,
    handle_post_boost,
)
from questions.models import Question
from tests.unit.test_misc.factories import factory_itn_article
from tests.unit.test_posts.factories import factory_notebook, factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


def _annotated_matches() -> Prefetch:
    """Minimal prefetch the scorer can read without querying: the breadth annotation
    plus the joined article it takes cluster_id from. compute_feed_hotness's own
    prefetch adds a date window and deferred fields these tests don't exercise."""
    return Prefetch(
        "postarticle_set",
        queryset=PostArticle.objects.annotate_article_post_count().select_related(
            "article"
        ),
    )


@pytest.mark.parametrize(
    "dt,expected",
    [
        [make_aware(datetime.datetime(2025, 4, 18)), 10],
        [make_aware(datetime.datetime(2025, 4, 14, 12)), 10],
        [make_aware(datetime.datetime(2025, 4, 11)), 2.5],
        [make_aware(datetime.datetime(2025, 4, 4)), 0.625],
    ],
)
@freeze_time("2025-04-18")
def test_decay(dt: datetime.datetime, expected: float):
    assert decay(10, dt) == expected


@freeze_time("2025-04-18")
@pytest.mark.parametrize(
    "question_kwargs,expected",
    [
        # Upcoming question
        [
            {
                "open_time": make_aware(datetime.datetime(2025, 4, 20)),
                "scheduled_close_time": make_aware(datetime.datetime(2025, 4, 25)),
                # Should be ignored
                "movement": 10,
            },
            0,
        ],
        # Active question
        [
            {
                # 1W from now
                "open_time": make_aware(datetime.datetime(2025, 4, 11)),
                "scheduled_close_time": make_aware(datetime.datetime(2025, 4, 25)),
                "movement": 0.4,
            },
            10.5,
        ],
        # Resolved question
        [
            {
                # 1W from now
                "open_time": make_aware(datetime.datetime(2025, 4, 4)),
                "scheduled_close_time": make_aware(datetime.datetime(2025, 4, 10)),
                "resolution_set_time": make_aware(datetime.datetime(2025, 4, 11)),
                "resolution": "no",
                # Should be ignored
                "movement": 0.4,
            },
            5.625,
        ],
        # Unsuccessfully resolved question
        [
            {
                # 1W from now
                "open_time": make_aware(datetime.datetime(2025, 4, 4)),
                "scheduled_close_time": make_aware(datetime.datetime(2025, 4, 10)),
                "resolution_set_time": make_aware(datetime.datetime(2025, 4, 11)),
                "resolution": "annulled",
            },
            0.625,
        ],
    ],
)
def test_compute_question_hotness(question_kwargs, expected):
    question = create_question(
        question_type=Question.QuestionType.BINARY, **question_kwargs
    )

    assert compute_question_hotness(question) == expected


@freeze_time("2025-04-18")
def test_compute_hotness_post_votes(post_binary_public, user1, user2):
    # No votes
    assert _compute_hotness_post_votes(post_binary_public) == 0

    # 1
    vote_post(post_binary_public, user1, 1)
    # -1 / 2
    with freeze_time("2025-04-4"):
        vote_post(post_binary_public, user2, -1)

    assert _compute_hotness_post_votes(post_binary_public) == 0.9375


@freeze_time("2025-04-18")
def test_compute_hotness_comments(post_binary_public, user1):
    # No comments
    assert _compute_hotness_comments(post_binary_public) == 0

    # Excluded comment
    create_comment(user=user1, on_post=post_binary_public, text="yeah", is_private=True)

    # 2
    create_comment(user=user1, on_post=post_binary_public, text="yeah")

    # 0.5
    with freeze_time("2025-04-4"):
        create_comment(user=user1, on_post=post_binary_public, text="yeah")

    assert _compute_hotness_comments(post_binary_public) == 2.125


@freeze_time("2025-04-18")
def test_compute_hotness_total_boosts(post_binary_public, user1):
    assert compute_hotness_total_boosts(post_binary_public) == 0

    with freeze_time("2025-04-04"):
        PostActivityBoost.objects.create(user=user1, post=post_binary_public, score=-20)

    assert compute_hotness_total_boosts(post_binary_public) == -1.25

    PostActivityBoost.objects.create(user=user1, post=post_binary_public, score=20)

    assert compute_hotness_total_boosts(post_binary_public) == 18.75


@freeze_time("2025-04-18")
def test_compute_hotness_relevant_news(post_binary_public):
    assert _compute_hotness_relevant_news(post_binary_public) == 0

    with freeze_time("2025-04-11"):
        # relevance max(0, 0.42 - 0.4) = 0.02, decayed by (7 / 3.5) ** -2 = 0.25
        PostArticle.objects.create(
            post=post_binary_public,
            article=factory_itn_article(),
            distance=0.4,
        )
        # relevance max(0, 0.42 - 0.1) = 0.32, decayed by 0.25
        PostArticle.objects.create(
            post=post_binary_public, article=factory_itn_article(), distance=0.1
        )

    assert _compute_hotness_relevant_news(post_binary_public) == pytest.approx(0.085)


@freeze_time("2025-04-18")
def test_compute_hotness_relevant_news_deduplicates_article_clusters(
    post_binary_public,
):
    # Two near-duplicate articles (same cluster) plus a distinct one. The cluster
    # contributes only its single strongest match, not the sum of both.
    PostArticle.objects.create(
        post=post_binary_public,
        article=factory_itn_article(cluster_id=1),
        distance=0.1,  # relevance 0.32
    )
    PostArticle.objects.create(
        post=post_binary_public,
        article=factory_itn_article(cluster_id=1),
        distance=0.2,  # relevance 0.22, dropped in favour of the closer one above
    )
    PostArticle.objects.create(
        post=post_binary_public,
        article=factory_itn_article(cluster_id=2),
        distance=0.3,  # relevance 0.12
    )

    # 0.32 (best of cluster 1) + 0.12 (cluster 2); no time decay (created today)
    assert _compute_hotness_relevant_news(post_binary_public) == pytest.approx(0.44)


@freeze_time("2025-04-18")
def test_compute_hotness_relevant_news_penalizes_broad_articles(
    post_binary_public, user1
):
    # A generic article matched to many posts is discounted by the breadth
    # (inverse document frequency) factor 1 / ln(e + post_count). The count is an
    # annotation, so score through the prefetch compute_feed_hotness uses.
    broad_article = factory_itn_article()
    PostArticle.objects.create(
        post=post_binary_public,
        article=broad_article,
        distance=0.1,  # relevance 0.32
    )
    # Three further posts match it, so it is matched to 4 posts in total
    for _ in range(3):
        PostArticle.objects.create(
            post=factory_post(author=user1), article=broad_article, distance=0.1
        )

    post = Post.objects.prefetch_related(_annotated_matches()).get(
        pk=post_binary_public.pk
    )

    expected = 0.32 / math.log(math.e + 4)
    assert _compute_hotness_relevant_news(post) == pytest.approx(expected)

    # Without the annotation article_post_count falls back to its model default of
    # 0, i.e. no breadth penalty, rather than raising.
    assert _compute_hotness_relevant_news(post_binary_public) == pytest.approx(0.32)


@freeze_time("2025-04-18")
def test_compute_feed_hotness_applies_breadth_penalty(post_binary_public, user1):
    # Guards the wiring rather than the arithmetic: the feed job's prefetch has to
    # carry the breadth annotation, because without it article_post_count silently
    # falls back to 0 and every stored news_hotness loses the penalty.
    broad_article = factory_itn_article()
    PostArticle.objects.create(
        post=post_binary_public,
        article=broad_article,
        distance=0.1,  # relevance 0.32
    )
    for _ in range(3):
        PostArticle.objects.create(
            post=factory_post(author=user1), article=broad_article, distance=0.1
        )

    compute_feed_hotness()

    post_binary_public.refresh_from_db()
    assert post_binary_public.news_hotness == pytest.approx(0.32 / math.log(math.e + 4))


@freeze_time("2025-04-18")
def test_explain_post_news_hotness(post_binary_public, user1):
    # Two near-duplicate articles (cluster 1) plus a distinct one (cluster 2).
    PostArticle.objects.create(
        post=post_binary_public,
        article=factory_itn_article(cluster_id=1),
        distance=0.1,  # relevance 0.32 — cluster 1 winner
    )
    PostArticle.objects.create(
        post=post_binary_public,
        article=factory_itn_article(cluster_id=1),
        distance=0.2,  # relevance 0.22 — deduped away
    )
    broad_article = factory_itn_article(cluster_id=2)
    PostArticle.objects.create(
        post=post_binary_public,
        article=broad_article,
        distance=0.1,  # relevance 0.32 but breadth penalised
    )
    for _ in range(3):
        PostArticle.objects.create(
            post=factory_post(author=user1), article=broad_article, distance=0.1
        )

    breakdown = explain_post_news_hotness(post_binary_public)
    articles = breakdown["articles"]

    # Strongest contribution first, and every matched article is listed.
    assert len(articles) == 3
    assert [a["contribution"] for a in articles] == sorted(
        (a["contribution"] for a in articles), reverse=True
    )

    # Exactly one article per cluster counts towards the score.
    counted = [a for a in articles if a["counts_towards_score"]]
    assert len(counted) == 2
    assert {a["cluster_id"] for a in counted} == {1, 2}
    # The deduped near-duplicate (distance 0.2) is not counted.
    assert not next(a for a in articles if a["distance"] == 0.2)["counts_towards_score"]

    # Total matches the sum of counted contributions, and the score the feed job
    # stores for the post.
    assert breakdown["news_hotness"] == pytest.approx(
        sum(a["contribution"] for a in counted)
    )
    assert breakdown["news_hotness"] == pytest.approx(
        _compute_hotness_relevant_news(
            Post.objects.prefetch_related(_annotated_matches()).get(
                pk=post_binary_public.pk
            )
        )
    )


@freeze_time("2025-04-18")
def test_compute_hotness_relevant_news_breadth_is_live(post_binary_public, user1):
    # The breadth count is computed when scoring, so a match created by indexing a
    # brand new post lands on the next hotness run instead of the next ITN sync.
    article = factory_itn_article()
    PostArticle.objects.create(
        post=post_binary_public,
        article=article,
        distance=0.1,  # relevance 0.32
    )

    def score():
        return _compute_hotness_relevant_news(
            Post.objects.prefetch_related(_annotated_matches()).get(
                pk=post_binary_public.pk
            )
        )

    assert score() == pytest.approx(0.32 / math.log(math.e + 1))

    PostArticle.objects.create(
        post=factory_post(author=user1), article=article, distance=0.1
    )

    assert score() == pytest.approx(0.32 / math.log(math.e + 2))


@freeze_time("2025-04-18")
def test_compute_hotness_relevant_news_uses_prefetch(
    post_binary_public, django_assert_num_queries
):
    # Scoring a prefetched post must not query: compute_feed_hotness relies on it,
    # and one query per post would be an N+1 over the whole feed.
    PostArticle.objects.create(
        post=post_binary_public, article=factory_itn_article(), distance=0.1
    )

    post = Post.objects.prefetch_related(_annotated_matches()).get(
        pk=post_binary_public.pk
    )

    with django_assert_num_queries(0):
        assert _compute_hotness_relevant_news(post) > 0


@freeze_time("2025-04-18")
def test_explain_post_news_hotness_skips_notebooks(user1):
    # Notebooks are excluded from the score, so the breakdown must not claim one
    # for them either, even if legacy article matches exist.
    notebook_post = factory_post(author=user1, notebook=factory_notebook())
    PostArticle.objects.create(
        post=notebook_post, article=factory_itn_article(), distance=0.1
    )

    assert _compute_hotness_relevant_news(notebook_post) == 0
    assert explain_post_news_hotness(notebook_post) == {
        "news_hotness": 0.0,
        "articles": [],
    }


@freeze_time("2025-04-18")
def test_explain_post_news_hotness_keeps_old_matches(post_binary_public):
    # Article matches have no age cutoff — ITN articles are dropped after
    # get_itn_max_age() and their matches cascade, so an old one is left to decay
    # rather than filtered out, and the breakdown lists it like any other.
    stale_at = make_aware(datetime.datetime(2025, 1, 1))
    with freeze_time(stale_at):
        PostArticle.objects.create(
            post=post_binary_public, article=factory_itn_article(), distance=0.1
        )
    PostArticle.objects.create(
        post=post_binary_public, article=factory_itn_article(), distance=0.1
    )

    breakdown = explain_post_news_hotness(post_binary_public)

    # relevance max(0, 0.42 - 0.1), over a breadth of one post each
    fresh = 0.32 / math.log(math.e + 1)
    assert len(breakdown["articles"]) == 2
    assert breakdown["news_hotness"] == pytest.approx(fresh + decay(fresh, stale_at))
    # Decay alone makes the old match negligible, which is why no cutoff is needed
    assert decay(fresh, stale_at) < fresh / 100


@freeze_time("2025-04-18")
def test_compute_post_hotness(user1):
    post = factory_post(
        author=user1,
        # score: 5
        published_at=make_aware(datetime.datetime(2025, 4, 4)),
        open_time=make_aware(datetime.datetime(2025, 4, 4)),
        scheduled_close_time=make_aware(datetime.datetime(2025, 5, 4)),
        scheduled_resolve_time=make_aware(datetime.datetime(2025, 5, 5)),
        group_of_questions=factory_group_of_questions(
            questions=[
                # Will be scored as 15
                create_question(
                    question_type=Question.QuestionType.BINARY,
                    open_time=make_aware(datetime.datetime(2025, 4, 4)),
                    scheduled_close_time=make_aware(datetime.datetime(2025, 4, 10)),
                    resolution_set_time=make_aware(datetime.datetime(2025, 4, 11)),
                    resolution="yes",
                ),
                # Will be scored as 18
                create_question(
                    question_type=Question.QuestionType.BINARY,
                    open_time=make_aware(datetime.datetime(2025, 4, 11)),
                    scheduled_close_time=make_aware(datetime.datetime(2025, 4, 25)),
                ),
            ]
        ),
    )

    # Add boost
    PostActivityBoost.objects.create(user=user1, post=post, score=100)

    # Add comment. Score: 2
    create_comment(user=user1, on_post=post, text="yeah")

    # Add vote. Score: 1
    vote_post(post, user1, 1)

    # Add ITN article. News score: max(0, 0.42 - 0.1) = 0.32
    PostArticle.objects.create(post=post, article=factory_itn_article(), distance=0.1)

    assert compute_post_hotness(post) == pytest.approx(108.945)


@freeze_time("2025-04-18")
def test_handle_post_boost(user1):
    post = factory_post(
        author=user1,
        published_at=make_aware(datetime.datetime(2025, 4, 17, 23)),
    )

    post.hotness = compute_post_hotness(post)
    post.save()

    assert post.hotness == 0

    # Boost
    handle_post_boost(user1, post, Vote.VoteDirection.UP)
    assert post.hotness == 20

    # Bury
    handle_post_boost(user1, post, Vote.VoteDirection.DOWN)
    assert post.hotness == -10


@pytest.mark.parametrize(
    "now,expected_hotness",
    [
        # Within the 3.5 day grace window: no decay. 0.02 + 0.32 = 0.34
        ["2025-04-14 12:00:00", 0.34],
        # 7 days from creation: decayed by (7 / 3.5) ** -2 = 0.25
        ["2025-04-18", 0.085],
        # 14 days from creation: decayed by (14 / 3.5) ** -2 = 0.0625
        ["2025-04-25", 0.02125],
    ],
)
def test_compute_hotness_relevant_news_time_decay(
    post_binary_public, now, expected_hotness
):
    with freeze_time("2025-04-11"):
        PostArticle.objects.create(
            post=post_binary_public,
            article=factory_itn_article(),
            distance=0.4,
        )
        PostArticle.objects.create(
            post=post_binary_public, article=factory_itn_article(), distance=0.1
        )

    with freeze_time(now):
        assert _compute_hotness_relevant_news(post_binary_public) == pytest.approx(
            expected_hotness
        )
