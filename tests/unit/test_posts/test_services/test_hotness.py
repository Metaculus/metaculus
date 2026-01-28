import datetime

import pytest
from django.utils.timezone import make_aware
from freezegun import freeze_time

from comments.services.common import create_comment
from misc.models import PostArticle
from posts.models import PostActivityBoost, Vote, Post
from posts.services.common import vote_post
from posts.services.hotness import (
    decay,
    compute_question_hotness,
    _compute_hotness_post_votes,
    _compute_hotness_comments,
    _compute_hotness_relevant_news,
    compute_hotness_total_boosts,
    compute_post_hotness,
    handle_post_boost,
)
from questions.models import Question
from tests.unit.test_misc.factories import factory_itn_article
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)
from tests.unit.utils import datetime_aware, mock_psql_now


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
        PostArticle.objects.create(
            post=post_binary_public,
            article=factory_itn_article(),
            distance=0.4,
        )
        PostArticle.objects.create(
            post=post_binary_public, article=factory_itn_article(), distance=0.1
        )

    assert _compute_hotness_relevant_news(post_binary_public) == 0.125


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

    # Add ITN article
    PostArticle.objects.create(post=post, article=factory_itn_article(), distance=0.1)

    assert compute_post_hotness(post) == 109.025


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
    "psql_now,expected_hotness",
    [
        [datetime_aware(2025, 4, 14, 12), 0.5],
        # 7 days from now
        [datetime_aware(2025, 4, 18), 0.125],
        # 14 days from now
        [datetime_aware(2025, 4, 25), 0.03125],
    ],
)
def test_post_annotate_news_hotness(post_binary_public, psql_now, expected_hotness):
    with freeze_time("2025-04-11"):
        PostArticle.objects.create(
            post=post_binary_public,
            article=factory_itn_article(),
            distance=0.4,
        )
        PostArticle.objects.create(
            post=post_binary_public, article=factory_itn_article(), distance=0.1
        )

    with mock_psql_now(psql_now):
        hotness = (
            Post.objects.filter(pk=post_binary_public.pk)
            .annotate_news_hotness()
            .get()
            .news_hotness
        )

        assert hotness == expected_hotness
