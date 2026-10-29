import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.db.models import Exists, OuterRef, Q, QuerySet
from django.utils.translation import gettext_lazy as _

from comments.models import Comment
from projects.models import Project
from questions.models import Forecast
from users.models import User
from utils.email import send_notification_email_with_template
from utils.frontend import build_frontend_url

logger = logging.getLogger(__name__)

LOOKBACK = timedelta(days=7)
# Skips the newest forecasts so a comment the bot is still about to post isn't
# counted as missing.
GRACE_PERIOD = timedelta(days=1)
MIN_FORECASTED_POSTS = 5
MIN_COMMENTED_SHARE = 0.5
RESOURCES_PAGE_PATH = "/notebooks/38928/ai-benchmark-resources/"


@dataclass
class ProjectCommentCoverage:
    project: Project
    forecasted_posts: int
    commented_posts: int


@dataclass
class BotMissingComments:
    bot: User
    projects: list[ProjectCommentCoverage]


def get_futureeval_projects() -> QuerySet[Project]:
    """
    FutureEval seasonal tournaments are the only bots-only tournaments, and
    MiniBenches are question series whose slug starts with "minibench".
    """

    return Project.objects.filter(
        Q(
            type=Project.ProjectTypes.TOURNAMENT,
            bot_leaderboard_status=Project.BotLeaderboardStatus.BOTS_ONLY,
        )
        | Q(slug__startswith="minibench")
    )


def find_bots_missing_comments(now: datetime) -> list[BotMissingComments]:
    """
    Coverage is counted per post, so one comment covers every subquestion of a
    group. Any comment counts, because private bot comments are made public
    once the community prediction is revealed.
    """

    window_end = now - GRACE_PERIOD
    window_start = window_end - LOOKBACK
    logger.info(
        f"Checking FutureEval bot comments on forecasts from {window_start} to {window_end}"
    )

    forecasted_posts = (
        Forecast.objects.filter(
            start_time__gte=window_start,
            start_time__lt=window_end,
            author__is_bot=True,
            author__is_primary_bot=True,
            post__default_project__in=get_futureeval_projects(),
        )
        .exclude(author__metadata__bot_details__metac_bot=True)
        .values("author_id", "post__default_project_id", "post_id")
        .distinct()
        .annotate(
            has_comment=Exists(
                Comment.objects.filter(
                    author_id=OuterRef("author_id"),
                    on_post_id=OuterRef("post_id"),
                    is_soft_deleted=False,
                )
            )
        )
    )

    forecasted_counts: dict[tuple[int, int], int] = defaultdict(int)
    commented_counts: dict[tuple[int, int], int] = defaultdict(int)
    for row in forecasted_posts:
        key = (row["author_id"], row["post__default_project_id"])
        forecasted_counts[key] += 1
        commented_counts[key] += row["has_comment"]

    low_coverage_keys = [
        key
        for key, forecasted in forecasted_counts.items()
        if forecasted >= MIN_FORECASTED_POSTS
        and commented_counts[key] / forecasted < MIN_COMMENTED_SHARE
    ]
    logger.info(
        f"Found {len(forecasted_counts)} bot-project pairs with forecasts, "
        f"{len(low_coverage_keys)} of them below the comment threshold"
    )

    bots = User.objects.select_related("bot_owner").in_bulk(
        {bot_id for bot_id, _ in low_coverage_keys}
    )
    projects = Project.objects.in_bulk(
        {project_id for _, project_id in low_coverage_keys}
    )

    coverage_by_bot: dict[int, list[ProjectCommentCoverage]] = defaultdict(list)
    for bot_id, project_id in low_coverage_keys:
        coverage_by_bot[bot_id].append(
            ProjectCommentCoverage(
                project=projects[project_id],
                forecasted_posts=forecasted_counts[(bot_id, project_id)],
                commented_posts=commented_counts[(bot_id, project_id)],
            )
        )

    return [
        BotMissingComments(
            bot=bots[bot_id],
            projects=sorted(coverage, key=lambda item: item.project.name),
        )
        for bot_id, coverage in sorted(
            coverage_by_bot.items(), key=lambda item: bots[item[0]].username
        )
    ]


def get_reminder_recipient(bot: User) -> User | None:
    recipient = bot.bot_owner or bot

    if not recipient.is_active or recipient.is_spam or not recipient.email:
        logger.warning(
            f"Not reminding bot {bot.username} (id {bot.id}) about missing comments: "
            f"recipient user {recipient.id} is inactive, spam or has no email"
        )
        return None

    return recipient


def send_futureeval_comment_reminder(
    recipient: User, bot_missing_comments: BotMissingComments
):
    send_notification_email_with_template(
        to=recipient.email,
        subject=_("Reminder: FutureEval bots must comment on every question"),
        template_name="emails/futureeval_comment_reminder.html",
        context={
            "recipient": recipient,
            "email_subject_display": _("FutureEval comment reminder"),
            "bot_username": bot_missing_comments.bot.username,
            "projects_coverage": bot_missing_comments.projects,
            "lookback_days": LOOKBACK.days,
            "resources_url": build_frontend_url(RESOURCES_PAGE_PATH),
        },
        use_async=False,
    )


def send_futureeval_comment_reminders(
    now: datetime, dry_run: bool = False
) -> list[tuple[User, BotMissingComments]]:
    """
    Sends one email per bot. Each owner has at most one primary bot, so no
    owner gets more than one email per run.
    """

    reminders = []
    for bot_missing_comments in find_bots_missing_comments(now):
        recipient = get_reminder_recipient(bot_missing_comments.bot)

        if recipient:
            reminders.append((recipient, bot_missing_comments))

    if dry_run:
        logger.info(f"Dry run: would send {len(reminders)} missing-comment reminder(s)")
        return reminders

    for recipient, bot_missing_comments in reminders:
        send_futureeval_comment_reminder(recipient, bot_missing_comments)

    logger.info(
        f"Attempted {len(reminders)} missing-comment reminder(s); "
        "failed sends are logged individually"
    )

    return reminders
