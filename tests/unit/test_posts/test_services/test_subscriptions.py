from notifications.models import Notification
from posts.services.subscriptions import (
    create_subscription_new_comments,
    notify_new_comments,
)
from tests.unit.fixtures import *  # noqa
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post


def test_notify_new_comments(user1, user2):
    post = factory_post(author=user1)
    subscription = create_subscription_new_comments(
        user=user1, post=post, comments_frequency=1
    )

    # Nothing should happen
    notify_new_comments(post)

    assert Notification.objects.filter(recipient=user1).count() == 0

    # Self-posted comment
    factory_comment(author=user1, on_post=post, text="Comment 1")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 0

    # Comment by other user
    c_2 = factory_comment(author=user2, on_post=post, text="Comment 2")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    notification = Notification.objects.filter(recipient=user1).first()

    assert notification.params["post"]["post_id"] == post.id
    assert notification.params["new_comment_ids"] == [c_2.id]
    assert notification.params["new_comments_count"] == 1

    # Update frequency to 3
    subscription.comments_frequency = 3
    subscription.save(update_fields=["comments_frequency"])

    c_3 = factory_comment(author=user2, on_post=post, text="Comment 3")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    c_4 = factory_comment(author=user2, on_post=post, text="Comment 4")
    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 1
    c_5 = factory_comment(author=user2, on_post=post, text="Comment 5")

    notify_new_comments(post)
    assert Notification.objects.filter(recipient=user1).count() == 2
    notification = Notification.objects.filter(recipient=user1).last()

    assert notification.params["post"]["post_id"] == post.id
    assert notification.params["new_comment_ids"] == [c_3.id, c_4.id, c_5.id]
    assert notification.params["new_comments_count"] == 3
