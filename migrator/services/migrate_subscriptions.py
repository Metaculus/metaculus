from datetime import timedelta

from posts.models import PostSubscription, Post
from questions.models import Question
from ..utils import paginated_query


def migrate_specific_time(old_reminder: dict) -> PostSubscription:
    repeat_mapping = {
        "DATE_DAILY": timedelta(days=1),
        "DATE_WEEKLY": timedelta(days=7),
        "DATE_MONTHLY": timedelta(days=30),
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


def migrate_new_comments(old_reminder: dict) -> PostSubscription:
    return PostSubscription(
        type=PostSubscription.SubscriptionType.NEW_COMMENTS,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        comments_frequency=old_reminder["remind_on_new_comments"],
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


def migrate_milestone(old_reminder: dict) -> PostSubscription:
    return PostSubscription(
        type=PostSubscription.SubscriptionType.MILESTONE,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        created_at=old_reminder["created_time"],
        milestone_step=old_reminder["remind_on_percent_lifetime"] / 100,
        next_trigger_value=old_reminder["next_trigger_value"] / 100,
    )


def migrate_cp_change(old_reminder: dict) -> PostSubscription:
    return PostSubscription(
        type=PostSubscription.SubscriptionType.CP_CHANGE,
        user_id=old_reminder["user_id"],
        post_id=old_reminder["question_id"],
        created_at=old_reminder["created_time"],
        # Initially, we had only one threshold option
        cp_threshold=0.1,
    )


def migrate_subscriptions(site_ids: list[int]):
    subscriptions = []
    post_ids = Post.objects.values_list("id", flat=True)
    non_existing_posts = 0
    subscriptions_with_dups = 0

    for idx, old_reminder in enumerate(
        paginated_query(
            "SELECT * FROM metac_question_reminder WHERE status = 'REMINDER_STATUS_ACTIVE' AND site_id in %s",
            [tuple(site_ids)],
        )
    ):
        reminder_type = old_reminder["reminder"]

        # Exclude non-existing posts
        if old_reminder["question_id"] not in post_ids:
            # This indicates user created reminder for a single question of Group or Conditional Post
            # Which we no longer support in favor of entire post subscriptions
            # Then, we need to find a related post and reattach subscription to it
            question = Question.objects.get(pk=old_reminder["question_id"])
            post = question.get_post()

            old_reminder["question_id"] = post.pk
            non_existing_posts += 1

        if reminder_type in ["REMINDER_ON_DATE", "REMINDER_AFTER_TIME"]:
            subscriptions.append(migrate_specific_time(old_reminder))

        if reminder_type == "REMINDER_ON_COMMENTS":
            subscriptions.append(migrate_new_comments(old_reminder))

        if reminder_type in ["REMINDER_ON_RESOLUTION", "REMINDER_ON_OPEN"]:
            subscriptions.append(migrate_status_change(old_reminder))

        if reminder_type == "REMINDER_ON_LIFETIME":
            subscriptions.append(migrate_milestone(old_reminder))

        if reminder_type == "REMINDER_ON_CP":
            subscriptions.append(migrate_cp_change(old_reminder))

        subscriptions_with_dups += 1

        if len(subscriptions) == 500:
            print(f"Processed {idx} subscriptions", end="\r")

            PostSubscription.objects.bulk_create(subscriptions, ignore_conflicts=True)
            subscriptions = []

    PostSubscription.objects.bulk_create(subscriptions, ignore_conflicts=True)

    print(f"Migrated {non_existing_posts} Question->Post reminders")
    print(
        f"Found {subscriptions_with_dups - PostSubscription.objects.count()} duplicated subscriptions "
        f"for the same User<>Post<>Type"
    )
    print(f"Created {PostSubscription.objects.count()} post subscriptions")
