import datetime

import pytest
from django.utils.timezone import make_aware
from freezegun import freeze_time

from comments.services.common import create_comment
from posts.models import PostActivityBoost
from posts.services.common import vote_post
from posts.services.hotness import (
    decay,
    compute_question_hotness,
    _compute_hotness_approval_score,
    _compute_hotness_post_votes,
    _compute_hotness_comments,
    compute_hotness_total_boosts,
    compute_post_hotness,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


@pytest.mark.parametrize(
    "dt,expected",
    [
        [make_aware(datetime.datetime(2025, 4, 18)), 10],
        [make_aware(datetime.datetime(2025, 4, 11)), 5],
        [make_aware(datetime.datetime(2025, 4, 4)), 2.5],
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
            18,
        ],
        # Resolved question
        [
            {
                # 1W from now
                "open_time": make_aware(datetime.datetime(2025, 4, 4)),
                "scheduled_close_time": make_aware(datetime.datetime(2025, 4, 10)),
                "resolution_set_time": make_aware(datetime.datetime(2025, 4, 11)),
                # Should be ignored
                "movement": 0.4,
            },
            15,
        ],
    ],
)
def test_compute_question_hotness(question_kwargs, expected):
    question = create_question(
        question_type=Question.QuestionType.BINARY, **question_kwargs
    )

    assert compute_question_hotness(question) == expected


@freeze_time("2025-04-18")
def test_compute_hotness_approval_score(post_binary_public):
    post_binary_public.published_at = make_aware(datetime.datetime(2025, 4, 20))
    assert _compute_hotness_approval_score(post_binary_public) == 0

    post_binary_public.published_at = make_aware(datetime.datetime(2025, 4, 17, 13))
    assert _compute_hotness_approval_score(post_binary_public) == 20

    post_binary_public.published_at = make_aware(datetime.datetime(2025, 4, 11))
    assert _compute_hotness_approval_score(post_binary_public) == 10


@freeze_time("2025-04-18")
def test_compute_hotness_post_votes(post_binary_public, user1, user2):
    # No votes
    assert _compute_hotness_post_votes(post_binary_public) == 0

    # 1
    vote_post(post_binary_public, user1, 1)
    # -1 / 2
    with freeze_time("2025-04-4"):
        vote_post(post_binary_public, user2, -1)

    assert _compute_hotness_post_votes(post_binary_public) == 0.75


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

    assert _compute_hotness_comments(post_binary_public) == 2.5


@freeze_time("2025-04-18")
def test_compute_hotness_total_boosts(post_binary_public, user1):
    assert compute_hotness_total_boosts(post_binary_public) == 0

    with freeze_time("2025-04-04"):
        PostActivityBoost.objects.create(user=user1, post=post_binary_public, score=-20)

    assert compute_hotness_total_boosts(post_binary_public) == -5

    PostActivityBoost.objects.create(user=user1, post=post_binary_public, score=20)

    assert compute_hotness_total_boosts(post_binary_public) == 15


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

    assert compute_post_hotness(post) == 123
