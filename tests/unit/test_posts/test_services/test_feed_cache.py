import datetime
from datetime import timedelta

import pytest
from django.core.cache import cache as django_cache
from django.test import override_settings
from django.utils import timezone
from django_dynamic_fixture import G

from comments.models import KeyFactorDriver, KeyFactorVote
from posts.models import Post, PostUserSnapshot, Vote
from posts.serializers import serialize_post_many
from posts.services.feed_cache import (
    dumps_cached,
    loads_cached,
    fragment_cache_key,
    feed_response_cache_key,
)
from questions.models import AggregateForecast, Question
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_forecast,
    factory_group_of_questions,
)

LOCMEM = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

FEED_FLAGS = dict(
    with_cp=True,
    group_cutoff=3,
    with_key_factors=True,
    include_descriptions=False,
    include_cp_history=True,
    include_movements=True,
    include_conditional_cps=False,
    include_average_scores=True,
    include_user_forecasts=True,
)


@pytest.fixture(autouse=True)
def _patch_repeatable_read(mocker):
    # SET TRANSACTION ISOLATION LEVEL cannot run inside the test transaction;
    # downgrade movement calculation to a plain atomic block.
    from contextlib import contextmanager

    from django.db import transaction

    @contextmanager
    def plain_atomic(using="default"):
        with transaction.atomic():
            yield

    mocker.patch(
        "questions.services.movement.transaction_repeatable_read", plain_atomic
    )


def _make_aggregation(question: Question):
    now = timezone.now()
    for hours_ago in (3, 2, 1):
        G(
            AggregateForecast,
            question=question,
            method="recency_weighted",
            start_time=now - timedelta(hours=hours_ago),
            end_time=(None if hours_ago == 1 else now - timedelta(hours=hours_ago - 1)),
            forecast_values=[0.4, 0.6],
            centers=[0.4, 0.6],
            interval_lower_bounds=[0.3, 0.5],
            interval_upper_bounds=[0.5, 0.7],
            forecaster_count=5,
        )


@pytest.fixture
def feed_posts(user1, user2):
    binary_question = create_question(question_type=Question.QuestionType.BINARY)
    binary_post = factory_post(author=user1, question=binary_question)
    _make_aggregation(binary_question)
    factory_forecast(author=user2, question=binary_question)
    Vote.objects.create(user=user2, post=binary_post, direction=Vote.VoteDirection.UP)
    PostUserSnapshot.objects.create(
        user=user2, post=binary_post, comments_count=0, viewed_at=timezone.now()
    )
    comment = factory_comment(author=user1, on_post=binary_post)
    factory_key_factor(
        comment=comment,
        driver=KeyFactorDriver.objects.create(text="Key Factor Text"),
        votes={user2: 2},
        vote_type=KeyFactorVote.VoteType.STRENGTH,
    )

    group_questions = [
        create_question(question_type=Question.QuestionType.BINARY) for _ in range(2)
    ]
    group = factory_group_of_questions(questions=group_questions)
    group_post = factory_post(author=user1, group_of_questions=group)
    for q in group_questions:
        _make_aggregation(q)
    factory_forecast(
        author=user2, question=Question.objects.get(pk=group_questions[0].pk)
    )

    return [binary_post.id, group_post.id]


@pytest.mark.django_db
@override_settings(CACHES=LOCMEM)
def test_fragment_cache_parity(feed_posts, user2):
    from posts.services.feed_cache import serialize_post_many_cached

    django_cache.clear()
    fresh_anonymous = serialize_post_many(feed_posts, current_user=None, **FEED_FLAGS)
    fresh_user = serialize_post_many(feed_posts, current_user=user2, **FEED_FLAGS)

    cold_anonymous = serialize_post_many_cached(
        feed_posts, current_user=None, **FEED_FLAGS
    )
    warm_anonymous = serialize_post_many_cached(
        feed_posts, current_user=None, **FEED_FLAGS
    )
    warm_user = serialize_post_many_cached(feed_posts, current_user=user2, **FEED_FLAGS)

    # guard against a vacuous test: the user view must differ from anonymous
    assert fresh_user != fresh_anonymous
    binary = fresh_user[0]
    assert binary["question"]["my_forecasts"]["history"]
    assert binary["vote"]["user_vote"] == Vote.VoteDirection.UP
    assert "unread_comment_count" in binary
    assert binary["key_factors"][0]["vote"]["user_vote"] == 2

    assert cold_anonymous == fresh_anonymous
    assert warm_anonymous == fresh_anonymous
    assert warm_user == fresh_user


@pytest.mark.django_db
@override_settings(CACHES=LOCMEM)
def test_fragment_cache_hits_skip_serialization(feed_posts, mocker):
    from posts.services import feed_cache

    django_cache.clear()
    feed_cache.serialize_post_many_cached(feed_posts, current_user=None, **FEED_FLAGS)
    spy = mocker.patch(
        "posts.serializers.serialize_post_many",
        side_effect=AssertionError("must not serialize on full cache hit"),
    )
    feed_cache.serialize_post_many_cached(feed_posts, current_user=None, **FEED_FLAGS)
    assert spy.call_count == 0


@pytest.mark.django_db
@override_settings(CACHES=LOCMEM)
def test_fragment_cache_post_edit_busts_key(feed_posts):
    from posts.services.feed_cache import serialize_post_many_cached

    django_cache.clear()
    serialize_post_many_cached(feed_posts, current_user=None, **FEED_FLAGS)
    post = Post.objects.get(id=feed_posts[0])
    post.title = "Edited title"
    post.edited_at = timezone.now()
    post.save()

    result = serialize_post_many_cached(feed_posts, current_user=None, **FEED_FLAGS)
    assert result[feed_posts.index(post.id)]["title"] == "Edited title"


def test_codec_roundtrip_preserves_datetimes():
    now = timezone.now()
    payload = {"a": [1, 2.5, None], "dt": now, "nested": {"x": "ü"}}
    assert loads_cached(dumps_cached(payload)) == payload


def test_fragment_cache_key_changes_with_inputs():
    edited = timezone.now()
    flags = {"with_cp": True, "group_cutoff": 3}
    k1 = fragment_cache_key(1, edited, "en", flags)
    assert k1 == fragment_cache_key(1, edited, "en", dict(flags))
    assert k1 != fragment_cache_key(2, edited, "en", flags)
    assert k1 != fragment_cache_key(
        1, edited + datetime.timedelta(seconds=1), "en", flags
    )
    assert k1 != fragment_cache_key(1, edited, "es", flags)
    assert k1 != fragment_cache_key(1, edited, "en", {**flags, "with_cp": False})
    # None edited_at must not crash
    assert fragment_cache_key(1, None, "en", flags)


def test_response_cache_key_is_param_order_independent():
    k1 = feed_response_cache_key(
        {"statuses": ["open", "closed"], "topic": None}, {"with_cp": True}, 24, 0
    )
    k2 = feed_response_cache_key(
        {"topic": None, "statuses": ["open", "closed"]}, {"with_cp": True}, 24, 0
    )
    assert k1 == k2
    assert k1 != feed_response_cache_key(
        {"statuses": ["open"], "topic": None}, {"with_cp": True}, 24, 0
    )
    assert k1 != feed_response_cache_key(
        {"statuses": ["open", "closed"], "topic": None}, {"with_cp": True}, 24, 24
    )


def test_response_cache_key_uncacheable_shapes():
    assert feed_response_cache_key({"search": "ai"}, {}, 24, 0) is None
    assert feed_response_cache_key({"similar_to_post_id": 5}, {}, 24, 0) is None
    assert feed_response_cache_key({"ids": [1, 2]}, {}, 24, 0) is None
    assert feed_response_cache_key({}, {}, 24, 300) is None
    assert feed_response_cache_key({}, {}, None, 0) is None
