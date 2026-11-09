from notifications.jobs import job_send_notification_groups
from notifications.models import Notification
from notifications.services import NotificationPostParams, NotificationPostSpecificTime
from tests.unit.test_notifications.factories import factory_notification
from tests.unit.test_posts.factories import factory_post


def _schedule_reminders(recipient, post, count):
    for _ in range(count):
        factory_notification(
            recipient=recipient,
            notification_type=NotificationPostSpecificTime.type,
            params=NotificationPostSpecificTime.ParamsType(
                post=NotificationPostParams.from_post(post)
            ),
        )


def test_send_notification_groups_one_update_per_group(
    user1, user2, mocker, django_assert_num_queries
):
    send = mocker.patch.object(NotificationPostSpecificTime, "send_email_group")
    post = factory_post(author=user1)
    _schedule_reminders(user1, post, 3)
    _schedule_reminders(user2, post, 3)

    with django_assert_num_queries(3):
        job_send_notification_groups()

    assert send.call_count == 2
    assert not Notification.objects.filter_pending_email().exists()


def test_send_notification_groups_keeps_failed_group_pending(user1, user2, mocker):
    def send(notifications):
        if notifications[0].recipient == user2:
            raise RuntimeError("Mailgun down")

    mocker.patch.object(
        NotificationPostSpecificTime, "send_email_group", side_effect=send
    )
    post = factory_post(author=user1)
    _schedule_reminders(user1, post, 2)
    _schedule_reminders(user2, post, 2)

    job_send_notification_groups()

    pending = Notification.objects.filter_pending_email()
    assert set(pending.values_list("recipient_id", flat=True)) == {user2.id}
