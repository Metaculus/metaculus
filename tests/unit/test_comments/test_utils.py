import re

from comments.utils import (
    USERNAME_PATTERN,
    get_mention_for_user,
    comment_extract_user_mentions,
)
from projects.models import Project
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import factory_forecast
from tests.unit.test_users.factories import factory_user


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


@pytest.mark.parametrize(
    "text,expected_usernames,expected_mentions",
    [
        ["No mention", set(), set()],
        ["Wanna mention @mentioned_user", {"mentioned_user"}, {"mentioned_user"}],
        ["Wanna mention @predictors", {"forecaster"}, {"predictors"}],
        [
            "Wanna mention @mentioned_user and @predictors",
            {"mentioned_user", "forecaster"},
            {"mentioned_user", "predictors"},
        ],
        ["Wanna mention @curators", {"curator", "admin", "superuser"}, {"curators"}],
        ["Wanna mention @admins", {"admin", "superuser"}, {"admins"}],
        [
            "Wanna mention @admins @curators",
            {"curator", "admin", "superuser"},
            {"curators", "admins"},
        ],
    ],
)
def test_comment_extract_user_mentions(
    question_binary, text, expected_usernames, expected_mentions
):
    # Random user
    factory_user(username="mentioned_user")

    forecaster = factory_user(username="forecaster")
    curator = factory_user(username="curator")
    admin = factory_user(username="admin")
    # Superuser
    factory_user(username="superuser", is_superuser=True)

    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                curator: ObjectPermission.CURATOR,
                admin: ObjectPermission.ADMIN,
            },
        ),
    )
    factory_forecast(question=question_binary, author=forecaster)

    # Case 1: no mentions
    qs, mentions = comment_extract_user_mentions(
        factory_comment(on_post=post, text_original=text)
    )

    assert {x.username for x in qs} == expected_usernames
    assert mentions == expected_mentions
