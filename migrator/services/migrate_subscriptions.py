from collections import defaultdict
from datetime import timedelta

from notifications.constants import MailingTags
from posts.models import PostSubscription, Post
from projects.models import ProjectSubscription, Project
from questions.models import Question
from users.models import User

from ..utils import paginated_query, filter_for_existing_users


def migrate_specific_time(old_reminder: dict) -> PostSubscription:
    repeat_mapping = {
        "DAILY": timedelta(days=1),
        "DATE_DAILY": timedelta(days=1),
        "WEEKLY": timedelta(days=7),
        "DATE_WEEKLY": timedelta(days=7),
        "MONTHLY": timedelta(days=30),
        "DATE_MONTHLY": timedelta(days=30),
        "ANNUALLY": timedelta(days=365),
        "DATE_ANNUALLY": timedelta(days=365),
    }
    recurrence_interval = repeat_mapping.get(old_reminder["repeat_pattern"])
    next_trigger_datetime = old_reminder["next_trigger_date"]
    last_sent_at = (
        next_trigger_datetime - recurrence_interval if recurrence_interval else None
    )

    return PostSubscription(
        type=PostSubscription.SubscriptionType.SPECIFIC_TIME,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        next_trigger_datetime=old_reminder["next_trigger_date"],
        recurrence_interval=recurrence_interval,
        last_sent_at=last_sent_at,
        created_at=old_reminder["created_time"],
    )


def migrate_new_comments(old_reminders: list[dict]) -> PostSubscription:
    """
    if user has any comment notification (repeating or not),
    give them the closest comment notification
    (e.g. "every 2" → "every 3", "every 8" → "every 10", etc.)
    """

    # Finding the highest notifications frequency
    old_reminder = sorted(old_reminders, key=lambda r: r["remind_on_new_comments"])[0]

    # Finding the closest option from the new ones
    frequency = min(
        [1, 3, 10], key=lambda x: abs(x - old_reminder["remind_on_new_comments"])
    )

    return PostSubscription(
        type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        comments_frequency=frequency,
        last_sent_at=old_reminder["last_repeat_date"],
        created_at=old_reminder["created_time"],
    )


def migrate_status_change(old_reminder: dict) -> PostSubscription:
    return PostSubscription(
        type=PostSubscription.SubscriptionType.STATUS_CHANGE,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        created_at=old_reminder["created_time"],
    )


def get_posts_lifetime_mapping():
    posts = Post.objects.filter(
        published_at__isnull=False, scheduled_resolve_time__isnull=False
    ).only("pk", "scheduled_resolve_time", "published_at")

    return {p.pk: p for p in posts}


def get_post_percent_datetime(post, pct: float):
    total_duration = post.scheduled_resolve_time - post.published_at
    return post.published_at + total_duration * pct


def migrate_milestone(
    posts_map: dict[int, Post], old_reminders: list[dict]
) -> list[PostSubscription]:
    """
    if user has any repeating milestone notification,
    give them the closest repeating milestone notification

    if user has any non-repeating milestone notification,
    cast that to a date notification
    """

    new_subscriptions = []

    # Processing repeating notifications
    repeating = [r for r in old_reminders if r["repeat_pattern"] == "VALUE_REPEAT"]
    repeating = (
        sorted(repeating, key=lambda r: r["next_trigger_value"])[0]
        if repeating
        else None
    )

    if repeating:
        new_subscriptions.append(
            PostSubscription(
                type=PostSubscription.SubscriptionType.MILESTONE,
                user_id=repeating["user_id"],
                post_id=repeating["question_id"],
                created_at=repeating["created_time"],
                milestone_step=repeating["remind_on_percent_lifetime"] / 100,
                next_trigger_value=repeating["next_trigger_value"] / 100,
            )
        )

    # Processing non-repeating notifications
    non_repeating = [r for r in old_reminders if r["repeat_pattern"] != "VALUE_REPEAT"]

    for old_reminder in non_repeating:
        post = posts_map.get(old_reminder["question_id"])

        if not post:
            print("Missing post with lifespan mapping")
            continue

        new_subscriptions.append(
            PostSubscription(
                type=PostSubscription.SubscriptionType.SPECIFIC_TIME,
                user_id=old_reminder["user_id"],
                post_id=old_reminder["question_id"],
                next_trigger_datetime=get_post_percent_datetime(
                    post, old_reminder["next_trigger_value"] / 100
                ),
                # No repeating
                recurrence_interval=None,
                last_sent_at=None,
                created_at=old_reminder["created_time"],
            )
        )

    return new_subscriptions


def migrate_cp_change(old_reminders: list[dict]) -> PostSubscription:
    """
    if user has any CP change notification (repeating or not),
    give them medium (0.25) repeating CP change notification
    """

    old_reminder = old_reminders[0]

    return PostSubscription(
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        created_at=old_reminder["created_time"],
        last_sent_at=old_reminder["comparison_time"],
        cp_change_threshold=0.25,
    )


def migrate_post_subscriptions(site_ids: list[int]):
    subscriptions = []
    post_ids = Post.objects.values_list("id", flat=True)
    posts_map = get_posts_lifetime_mapping()
    non_existing_posts = 0
    subscriptions_with_dups = 0

    # Group by user<>question

    query = paginated_query(
        "SELECT * FROM metac_question_reminder WHERE status = 'REMINDER_STATUS_ACTIVE' AND site_id in %s",
        [tuple(site_ids)],
    )

    # <user_id>:<question_id>:<reminder> => Reminder mapping
    reminders_map = defaultdict(list)
    for old_reminder in query:
        # Exclude non-existing posts
        if old_reminder["question_id"] not in post_ids:
            # This indicates user created reminder for a single question of Group or Conditional Post
            # Which we no longer support in favor of entire post subscriptions
            # Then, we need to find a related post and reattach subscription to it
            question = Question.objects.get(pk=old_reminder["question_id"])
            post = question.get_post()

            old_reminder["question_id"] = post.pk
            non_existing_posts += 1

        reminder_type = old_reminder["reminder"]

        # Merge similar types
        if reminder_type in ["REMINDER_ON_DATE", "REMINDER_AFTER_TIME"]:
            reminder_type = "REMINDER_ON_DATE"
        if reminder_type in ["REMINDER_ON_RESOLUTION", "REMINDER_ON_OPEN"]:
            reminder_type = "REMINDER_ON_RESOLUTION"

        key = f"{old_reminder['user_id']}:{old_reminder['question_id']}:{reminder_type}"
        reminders_map[key].append(old_reminder)

    idx = -1

    for old_reminders in reminders_map.values():
        idx += 1

        reminder_type = old_reminders[0]["reminder"]

        if reminder_type in ["REMINDER_ON_DATE", "REMINDER_AFTER_TIME"]:
            subscriptions += [migrate_specific_time(r) for r in old_reminders]

        if reminder_type == "REMINDER_ON_COMMENTS":
            subscriptions.append(migrate_new_comments(old_reminders))

        if reminder_type in ["REMINDER_ON_RESOLUTION", "REMINDER_ON_OPEN"]:
            subscriptions.append(migrate_status_change(old_reminders[0]))

        if reminder_type == "REMINDER_ON_LIFETIME":
            subscriptions += migrate_milestone(posts_map, old_reminders)

        if reminder_type == "REMINDER_ON_CP":
            subscriptions.append(migrate_cp_change(old_reminders))

        subscriptions_with_dups += 1

        if len(subscriptions) == 500:
            print(f"Processed {idx} post subscriptions", end="\r")

            PostSubscription.objects.bulk_create(subscriptions)
            subscriptions = []

    PostSubscription.objects.bulk_create(subscriptions)

    print(f"Migrated {non_existing_posts} Question->Post reminders")
    print(
        f"Found {subscriptions_with_dups - PostSubscription.objects.count()} duplicated subscriptions "
        f"for the same User<>Post<>Type"
    )
    print(f"Created {PostSubscription.objects.count()} post subscriptions")


def migrate_tournament_subscriptions():
    subscriptions = []
    project_ids = Project.objects.values_list("id", flat=True)

    for idx, old_subscription in enumerate(
        filter_for_existing_users(
            paginated_query("SELECT * FROM metac_project_userprojectfollow")
        )
    ):
        project_id = old_subscription["project_id"]

        # Old Project ids stay the same
        if project_id not in project_ids:
            continue

        subscriptions.append(
            ProjectSubscription(
                user_id=old_subscription["user_id"],
                project_id=project_id,
                created_at=old_subscription["timestamp"],
            )
        )

        if len(subscriptions) == 500:
            print(f"Processed {idx} project subscriptions", end="\r")

            ProjectSubscription.objects.bulk_create(
                subscriptions, ignore_conflicts=True
            )
            subscriptions = []

    ProjectSubscription.objects.bulk_create(subscriptions, ignore_conflicts=True)
    print(f"Created {ProjectSubscription.objects.count()} post subscriptions")


def migrate_global_cp_change_subscriptions(site_ids: list[int]):
    subscriptions = []
    post_ids = Post.objects.values_list("id", flat=True)
    non_existing_posts = 0

    for idx, old_reminder in enumerate(
        paginated_query(
            "SELECT * FROM metac_question_batchquestioncpreminder WHERE site_id in %s",
            [tuple(site_ids)],
        )
    ):
        # Exclude non-existing posts
        if old_reminder["question_id"] not in post_ids:
            # This indicates user created reminder for a single question of Group or Conditional Post
            # Which we no longer support in favor of entire post subscriptions
            # Then, we need to find a related post and reattach subscription to it
            question = Question.objects.filter(pk=old_reminder["question_id"]).first()

            if not question:
                print(f"Wrong Question/Post id: {old_reminder['question_id']}")
                continue

            post = question.get_post()

            old_reminder["question_id"] = post.pk
            non_existing_posts += 1

        subscriptions.append(
            PostSubscription(
                type=PostSubscription.SubscriptionType.CP_CHANGE,
                user_id=old_reminder["user_id"],
                post_id=old_reminder["question_id"],
                last_sent_at=old_reminder["comparison_time"],
                created_at=old_reminder["created_time"],
                cp_change_threshold=0.1,
                # Indicates this is global reminder
                is_global=True,
            )
        )

        if len(subscriptions) == 500:
            print(f"Processed {idx} post subscriptions", end="\r")

            PostSubscription.objects.bulk_create(subscriptions, ignore_conflicts=True)
            subscriptions = []

    PostSubscription.objects.bulk_create(subscriptions, ignore_conflicts=True)
    created_count = PostSubscription.objects.filter(
        type=PostSubscription.SubscriptionType.CP_CHANGE, is_global=True
    ).count()
    print(f"Created {created_count} post subscriptions")

    # Migrate notifications settings
    enabled_for_user_ids = list(
        paginated_query(
            "SELECT * FROM metac_account_userpreference",
            only_columns=["user_id"],
            flat=True,
        )
    )

    update_users = []

    for idx, user in enumerate(
        User.objects.only("unsubscribed_mailing_tags").iterator(chunk_size=5000)
    ):
        if user.id not in enabled_for_user_ids:
            user.unsubscribed_mailing_tags = list(
                set(user.unsubscribed_mailing_tags or [])
                | {MailingTags.FORECASTED_CP_CHANGE}
            )

            update_users.append(user)

            if len(update_users) == 5000:
                print(f"Updated {idx} user global cp reminder settings ", end="\r")

                User.objects.bulk_update(
                    update_users, fields=["unsubscribed_mailing_tags"]
                )
                update_users = []

    User.objects.bulk_update(update_users, fields=["unsubscribed_mailing_tags"])


def migrate_subscriptions(site_ids: list[int]):
    migrate_post_subscriptions(site_ids)
    migrate_tournament_subscriptions()
    migrate_global_cp_change_subscriptions(site_ids)
