import pytest  # noqa
from django.db import connection
from django.test.utils import CaptureQueriesContext

from comments.models import KeyFactorVote, KeyFactorDriver
from comments.serializers.key_factors import serialize_key_factors_many
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_users.factories import factory_user
from users.serializers import BaseUserSerializer


def test_serialize_key_factors_many(user1, user2):
    comment = factory_comment(author=user1, on_post=factory_post(author=user1))
    user3 = factory_user()

    kf = factory_key_factor(
        comment=comment,
        driver=KeyFactorDriver.objects.create(text_en="Key Factor Text"),
        votes={user1: 1, user2: -1, user3: -1},
        votes_score=-1,
        vote_type=KeyFactorVote.VoteType.DIRECTION,
    )

    data = serialize_key_factors_many([kf], current_user=user1)

    assert data[0]["id"] == kf.id
    assert data[0]["driver"]["text"] == "Key Factor Text"
    assert data[0]["vote"]
    assert data[0]["vote"]["aggregated_data"] == [
        {"score": 1, "count": 1},
        {"score": -1, "count": 2},
    ]
    assert data[0]["vote"]["user_vote"] == 1
    assert data[0]["vote"]["score"] == -1
    assert data[0]["author"]["id"] == user1.id


def test_key_factor_comments_load_only_serialized_columns(user1, user2):
    post = factory_post(author=user1)
    user2.metadata = {"bot_details": {"model": "m"}, "private": "p"}
    user2.save()
    key_factors = [
        factory_key_factor(
            comment=factory_comment(
                author=author, on_post=post, text_original="x" * 300
            ),
            driver=KeyFactorDriver.objects.create(text_en=f"Key factor {i}"),
        )
        for i, author in enumerate([user1, user2, user2])
    ]

    with CaptureQueriesContext(connection) as ctx:
        data = serialize_key_factors_many(key_factors)

    comment_sql = [
        q["sql"] for q in ctx.captured_queries if '"comments_comment"' in q["sql"]
    ]
    assert len(comment_sql) == 1
    assert '"comments_comment"."text' not in comment_sql[0]
    assert '"posts_post"."title' not in comment_sql[0]
    assert not any(
        'FROM "users_user"' in q["sql"] or 'FROM "posts_post"' in q["sql"]
        for q in ctx.captured_queries
    )
    assert [key_factor["author"] for key_factor in data] == [
        BaseUserSerializer(user).data for user in (user1, user2, user2)
    ]
    assert [key_factor["post"]["id"] for key_factor in data] == [post.id] * 3
