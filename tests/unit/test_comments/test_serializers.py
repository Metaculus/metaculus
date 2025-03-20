import pytest  # noqa

from comments.serializers import serialize_key_factors_many
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_users.factories import factory_user


def test_serialize_key_factors_many(user1, user2):
    comment = factory_comment(author=user1, on_post=factory_post(author=user1))
    user3 = factory_user()

    kf = factory_key_factor(
        comment=comment,
        text_en="Key Factor Text",
        votes={user1: 1, user2: -1, user3: -1},
        votes_score=-1,
    )

    data = serialize_key_factors_many([kf], current_user=user1)

    assert data[0]["id"] == kf.id
    assert data[0]["text"] == "Key Factor Text"
    assert data[0]["user_vote"] == 1
    assert data[0]["votes_score"] == -1
