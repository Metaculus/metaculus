from notifications.models import Notification
from notifications.services import NotificationNewComments, NotificationPostParams
from tests.fixtures import *  # noqa
from tests.test_comments.factories import factory_comment
from tests.test_notifications.factories import factory_notification
from tests.test_posts.factories import factory_post


class TestNotificationNewComments:
    def test_get_email_context_group(self, user1, user2, mocker):
        mocker.patch("utils.email.send_email_async")
        mocker.patch("notifications.services.get_similar_posts_for_multiple_posts")
        post_1 = factory_post(author=user1)
        post_2 = factory_post(author=user1)

        # Post #1 Notifications
        post_1_duplicated_comment = factory_comment(
            author=user2, on_post=post_1, text=f"Comment 2"
        )

        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(author=user2, on_post=post_1, text=f"Comment 1").pk,
                    post_1_duplicated_comment.pk,
                ],
            ),
        )
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(
                        author=user2,
                        on_post=post_1,
                        text=(
                            "It is a long established fact that a reader will be distracted by the readable content of "
                            "a page when looking at its layout. @user1 The point of using Lorem Ipsum is that "
                            f"it has a more-or-less normal distribution of letters, as opposed to using"
                        ),
                    ).pk
                ],
            ),
        )
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(author=user2, on_post=post_1, text=f"Comment 3").pk,
                    factory_comment(author=user2, on_post=post_1, text=f"Comment 4").pk,
                    post_1_duplicated_comment.pk,
                ],
            ),
        )

        # Post #2 notifications
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_2),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(author=user2, on_post=post_1, text=f"Comment 2.1").pk,
                    factory_comment(author=user2, on_post=post_1, text=f"Comment 2.2").pk,
                ],
            ),
        )

        context = NotificationNewComments.get_email_context_group(
            Notification.objects.filter(recipient=user1, type="post_new_comments")
        )
        context_notifs = context["notifications"]

        assert len(context_notifs) == 2
        assert context_notifs[0]["post"]["post_id"] == post_1.pk
        assert len(context_notifs[0]["comments"]) == 5
        assert context_notifs[0]
        # Check mentions go first
        assert "@user1" in context_notifs[0]["comments"][0]["preview_text"]

        assert context_notifs[1]["post"]["post_id"] == post_2.pk
        assert len(context_notifs[1]["comments"]) == 2
