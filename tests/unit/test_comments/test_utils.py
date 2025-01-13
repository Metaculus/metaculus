import re

import pytest

from comments.utils import USERNAME_PATTERN, get_mention_for_user
from tests.unit.fixtures import *  # noqa


@pytest.mark.parametrize(
    "mention,actual_username",
    [
        ["@username", "username"],
        ["@(username)", "(username)"],
        ["@username.", "username"],
        ["@(user name)", "(user name)"],
    ],
)
def test_username_pattern(mention, actual_username):
    assert re.findall(USERNAME_PATTERN, mention)[0] == actual_username


@pytest.mark.parametrize(
    "mentions,expected",
    [
        [["user1", "moderators"], "user1"],
        [
            ["user2", "admins", "moderators", "predictors"],
            "predictors",
        ],
        [
            ["admins", "moderators", "curators"],
            "moderators",
        ],
        [
            ["admins", "curators"],
            "curators",
        ],
    ],
)
def test_get_mention_label_for_user(user1, mentions, expected):
    assert get_mention_for_user(user1, mentions) == expected
