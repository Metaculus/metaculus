from datetime import datetime, timedelta, timezone as dt_timezone

import pytest

from comments.services.futureeval_comment_reminders import (
    find_bots_missing_comments,
    send_futureeval_comment_reminders,
)
from posts.models import Post
from projects.models import Project
from questions.models import Question
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question, factory_forecast
from tests.unit.test_users.factories import factory_user
from users.models import User

NOW = datetime(2026, 10, 26, 14, tzinfo=dt_timezone.utc)
IN_WINDOW = NOW - timedelta(days=3)


@pytest.fixture()
def futureeval_tournament() -> Project:
    return factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        bot_leaderboard_status=Project.BotLeaderboardStatus.BOTS_ONLY,
        slug="fall-futureeval-2026",
        name_original="Fall 2026 FutureEval Bot Tournament",
    )


@pytest.fixture()
def minibench() -> Project:
    return factory_project(
        type=Project.ProjectTypes.QUESTION_SERIES,
        bot_leaderboard_status=Project.BotLeaderboardStatus.INCLUDE,
        slug="minibench-2026-10-19",
    )


@pytest.fixture()
def owner() -> User:
    return factory_user(email="owner@example.com", username="owner")


@pytest.fixture()
def bot(owner: User) -> User:
    return factory_user(
        username="silent-bot", is_bot=True, is_primary_bot=True, bot_owner=owner
    )


def make_posts(project: Project, count: int) -> list[Post]:
    return [
        factory_post(
            question=create_question(question_type=Question.QuestionType.BINARY),
            default_project=project,
        )
        for _ in range(count)
    ]


def forecast_on(
    author: User, posts: list[Post], start_time: datetime = IN_WINDOW
) -> None:
    for post in posts:
        factory_forecast(
            author=author, question=post.question, start_time=start_time, end_time=None
        )


def comment_on(author: User, posts: list[Post], **kwargs) -> None:
    for post in posts:
        factory_comment(author=author, on_post=post, **kwargs)


def test_flags_bot_below_comment_threshold(futureeval_tournament, bot):
    posts = make_posts(futureeval_tournament, 6)
    forecast_on(bot, posts)
    comment_on(bot, posts[:2], is_private=True)

    [result] = find_bots_missing_comments(NOW)

    assert result.bot == bot
    [coverage] = result.projects
    assert coverage.project == futureeval_tournament
    assert (coverage.commented_posts, coverage.forecasted_posts) == (2, 6)


@pytest.mark.parametrize(
    "commented_count, forecasted_count",
    [(3, 6), (0, 4)],
    ids=["half_commented", "too_few_forecasts"],
)
def test_does_not_flag_bot_meeting_threshold_or_below_minimum(
    futureeval_tournament, bot, commented_count, forecasted_count
):
    posts = make_posts(futureeval_tournament, forecasted_count)
    forecast_on(bot, posts)
    comment_on(bot, posts[:commented_count])

    assert find_bots_missing_comments(NOW) == []


def test_public_comments_count_and_soft_deleted_do_not(futureeval_tournament, bot):
    posts = make_posts(futureeval_tournament, 6)
    forecast_on(bot, posts)
    comment_on(bot, posts[:3], is_private=False)
    comment_on(bot, posts[3:], is_soft_deleted=True)

    assert find_bots_missing_comments(NOW) == []

    posts[0].comments.update(is_soft_deleted=True)

    [result] = find_bots_missing_comments(NOW)
    assert result.projects[0].commented_posts == 2


def test_coverage_is_counted_per_project(futureeval_tournament, minibench, bot):
    tournament_posts = make_posts(futureeval_tournament, 6)
    minibench_posts = make_posts(minibench, 6)
    forecast_on(bot, tournament_posts + minibench_posts)
    comment_on(bot, tournament_posts)

    [result] = find_bots_missing_comments(NOW)

    assert [coverage.project for coverage in result.projects] == [minibench]


@pytest.mark.parametrize(
    "project_kwargs",
    [
        {
            "type": Project.ProjectTypes.TOURNAMENT,
            "bot_leaderboard_status": Project.BotLeaderboardStatus.INCLUDE,
            "slug": "metaculus-cup",
            "name_original": "Metaculus Cup",
        },
        {
            "type": Project.ProjectTypes.TOURNAMENT,
            "bot_leaderboard_status": Project.BotLeaderboardStatus.BOTS_ONLY,
            "slug": "ai-pathways-bots",
            "name_original": "AI Pathways Bot Tournament",
        },
        {
            "type": Project.ProjectTypes.QUESTION_SERIES,
            "bot_leaderboard_status": Project.BotLeaderboardStatus.EXCLUDE_AND_SHOW,
            "slug": "pro-benchmark-fall2026",
            "name_original": "Pro Forecasters - FutureEval 2026 Fall",
        },
    ],
    ids=["other_tournament", "bots_only_not_futureeval", "futureeval_not_bots_only"],
)
def test_ignores_projects_outside_futureeval(bot, project_kwargs):
    forecast_on(bot, make_posts(factory_project(**project_kwargs), 6))

    assert find_bots_missing_comments(NOW) == []


@pytest.mark.parametrize(
    "start_time",
    [NOW - timedelta(hours=12), NOW - timedelta(days=9)],
    ids=["within_grace_period", "before_lookback"],
)
def test_ignores_forecasts_outside_window(futureeval_tournament, bot, start_time):
    forecast_on(bot, make_posts(futureeval_tournament, 6), start_time=start_time)

    assert find_bots_missing_comments(NOW) == []


@pytest.mark.parametrize(
    "user_kwargs",
    [
        {"is_bot": False},
        {"is_bot": True, "is_primary_bot": False},
        {
            "is_bot": True,
            "is_primary_bot": True,
            "metadata": {"bot_details": {"metac_bot": True}},
        },
    ],
    ids=["human", "secondary_bot", "metac_bot"],
)
def test_ignores_humans_secondary_and_metac_bots(futureeval_tournament, user_kwargs):
    forecast_on(factory_user(**user_kwargs), make_posts(futureeval_tournament, 6))

    assert find_bots_missing_comments(NOW) == []


def test_sends_reminder_to_bot_owner(mocker, futureeval_tournament, bot, owner):
    send_email = mocker.patch(
        "comments.services.futureeval_comment_reminders.send_notification_email_with_template"
    )
    forecast_on(bot, make_posts(futureeval_tournament, 6))

    reminders = send_futureeval_comment_reminders(NOW)

    assert [(recipient, result.bot) for recipient, result in reminders] == [
        (owner, bot)
    ]
    send_email.assert_called_once()
    assert send_email.call_args.kwargs["to"] == owner.email
    assert send_email.call_args.kwargs["context"]["bot_username"] == bot.username


def test_sends_reminder_to_ownerless_bot(mocker, futureeval_tournament):
    send_email = mocker.patch(
        "comments.services.futureeval_comment_reminders.send_notification_email_with_template"
    )
    ownerless_bot = factory_user(
        email="bot@example.com", is_bot=True, is_primary_bot=True
    )
    forecast_on(ownerless_bot, make_posts(futureeval_tournament, 6))

    send_futureeval_comment_reminders(NOW)

    assert send_email.call_args.kwargs["to"] == "bot@example.com"


def test_skips_inactive_owner(mocker, futureeval_tournament, bot, owner):
    send_email = mocker.patch(
        "comments.services.futureeval_comment_reminders.send_notification_email_with_template"
    )
    owner.is_active = False
    owner.save()
    forecast_on(bot, make_posts(futureeval_tournament, 6))

    assert send_futureeval_comment_reminders(NOW) == []
    send_email.assert_not_called()


def test_dry_run_does_not_send(mocker, futureeval_tournament, bot, owner):
    send_email = mocker.patch(
        "comments.services.futureeval_comment_reminders.send_notification_email_with_template"
    )
    forecast_on(bot, make_posts(futureeval_tournament, 6))

    reminders = send_futureeval_comment_reminders(NOW, dry_run=True)

    assert [recipient for recipient, _ in reminders] == [owner]
    send_email.assert_not_called()
