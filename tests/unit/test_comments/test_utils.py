import pytest
import re

from rest_framework.exceptions import PermissionDenied

from comments.utils import (
    USERNAME_PATTERN,
    get_mention_for_user,
    comment_extract_user_mentions,
    validate_predictors_mention,
)
from projects.models import Project
from projects.permissions import ObjectPermission
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import factory_forecast
from tests.unit.test_users.factories import factory_user
from users.models import User


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
    "text,comment_author_username,expected_usernames,expected_mentions",
    [
        ["No mention", "admin", set(), set()],
        [
            "Wanna mention @mentioned_user",
            "admin",
            {"mentioned_user"},
            {"mentioned_user"},
        ],
        ["Wanna mention @predictors", "admin", {"forecaster"}, {"predictors"}],
        [
            "Wanna mention @mentioned_user and @predictors",
            "admin",
            {"mentioned_user", "forecaster"},
            {"mentioned_user", "predictors"},
        ],
        [
            "Wanna mention @curators",
            "admin",
            {"curator", "admin", "superuser"},
            {"curators"},
        ],
        ["Wanna mention @admins", "admin", {"admin", "superuser"}, {"admins"}],
        [
            "Wanna mention @admins @curators",
            "admin",
            {"curator", "admin", "superuser"},
            {"curators", "admins"},
        ],
        ["No mention", "forecaster", set(), set()],
        [
            "Wanna mention @mentioned_user",
            "forecaster",
            {"mentioned_user"},
            {"mentioned_user"},
        ],
        ["Wanna mention @predictors", "forecaster", set(), {"predictors"}],
        [
            "Wanna mention @mentioned_user and @predictors",
            "forecaster",
            {"mentioned_user"},
            {"mentioned_user", "predictors"},
        ],
        [
            "Wanna mention @curators",
            "forecaster",
            {"curator", "admin", "superuser"},
            {"curators"},
        ],
        ["Wanna mention @admins", "forecaster", {"admin", "superuser"}, {"admins"}],
        [
            "Wanna mention @admins @curators",
            "forecaster",
            {"curator", "admin", "superuser"},
            {"curators", "admins"},
        ],
    ],
)
def test_comment_extract_user_mentions(
    question_binary,
    text,
    comment_author_username,
    expected_usernames,
    expected_mentions,
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

    qs, mentions = comment_extract_user_mentions(
        factory_comment(
            author=User.objects.get(username=comment_author_username),
            on_post=post,
            text_original=text,
        )
    )

    assert {x.username for x in qs} == expected_usernames
    assert mentions == expected_mentions


def test_validate_predictors_mention_curator_allowed(question_binary):
    """Test that curators can mention @predictors"""
    curator = factory_user(username="curator")
    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                curator: ObjectPermission.CURATOR,
            },
        ),
    )

    # Should not raise an exception
    validate_predictors_mention("Hello @predictors", curator, post)


def test_validate_predictors_mention_admin_allowed(question_binary):
    """Test that admins can mention @predictors"""
    admin = factory_user(username="admin")
    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                admin: ObjectPermission.ADMIN,
            },
        ),
    )

    # Should not raise an exception
    validate_predictors_mention("Hello @predictors", admin, post)


def test_validate_predictors_mention_superuser_allowed(question_binary):
    """Test that superusers can mention @predictors"""
    superuser = factory_user(username="superuser", is_superuser=True)
    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        ),
    )

    # Should not raise an exception
    validate_predictors_mention("Hello @predictors", superuser, post)


def test_validate_predictors_mention_forecaster_denied(question_binary):
    """Test that regular forecasters cannot mention @predictors"""
    forecaster = factory_user(username="forecaster")
    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        ),
    )

    # Should raise PermissionDenied
    with pytest.raises(PermissionDenied) as exc_info:
        validate_predictors_mention("Hello @predictors", forecaster, post)

    assert "Only curators and admins can mention @predictors" in str(exc_info.value)


def test_validate_predictors_mention_no_mention(question_binary):
    """Test that validation passes when @predictors is not mentioned"""
    forecaster = factory_user(username="forecaster")
    post = factory_post(
        question=question_binary,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=ObjectPermission.FORECASTER,
        ),
    )

    # Should not raise an exception when @predictors is not mentioned
    validate_predictors_mention("Hello @someone_else", forecaster, post)
