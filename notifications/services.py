from dataclasses import dataclass, asdict

from comments.models import Comment
from notifications.models import Notification
from notifications.utils import generate_email_comment_preview_text
from posts.models import Post, PostSubscription
from users.models import User
from utils.dtypes import dataclass_from_dict
from utils.email import send_email_with_template
from utils.frontend import build_post_comment_url


@dataclass
class NotificationPostParams:
    post_id: int
    post_title: str

    @classmethod
    def from_post(cls, post: Post):
        return NotificationPostParams(post_id=post.id, post_title=post.title)


class NotificationTypeBase:
    type: str
    email_template: str = None

    @dataclass
    class ParamsType:
        pass

    @classmethod
    def send(cls, recipient: User, params: ParamsType):
        # Create notification object
        notification = Notification.objects.create(
            type=cls.type, recipient=recipient, params=asdict(params)
        )

        return notification

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        raise NotImplementedError()

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        return {
            "recipient": notifications[0].recipient,
            "params": [dataclass_from_dict(cls.ParamsType, n) for n in notifications],
        }

    @classmethod
    def send_email_group(cls, notifications: list[Notification]):
        """
        Sends group emails
        """

        if not cls.email_template:
            return

        if not notifications:
            raise ValueError("Notification list cannot be empty")

        recipient = notifications[0].recipient
        context = cls.get_email_context_group(notifications)

        return send_email_with_template(
            recipient.email,
            cls.generate_subject_group(recipient),
            cls.email_template,
            context=context,
        )


class NotificationNewComments(NotificationTypeBase):
    type = "post_new_comments"
    email_template = "emails/post_new_comments.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        new_comments_count: int
        new_comment_ids: list[int]

    @classmethod
    def get_comments(cls, recipient_username, new_comment_ids: list[int]):
        """
        Extracts comments list from new_comment_ids
        """

        comments = (
            (
                Comment.objects.filter(is_soft_deleted=False)
                .filter(pk__in=new_comment_ids)
                .order_by("-created_at")
            )
            .select_related("author", "on_post")
            .only("id", "text", "author__username", "on_post__title")
        )

        post_has_mention = False
        data = []

        for comment in comments:
            preview_text, has_mention = generate_email_comment_preview_text(
                comment.text, recipient_username
            )

            if has_mention:
                post_has_mention = True

            data.append(
                {
                    "author_username": comment.author.username,
                    "preview_text": preview_text,
                    "url": build_post_comment_url(
                        comment.on_post_id, comment.on_post.title, comment.id
                    ),
                }
            )

        return data, post_has_mention

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        # TODO: GROUP BY NOTIFICATIONS OF THE SAME POST_ID!!!
        # TODO: add [...read_more...]
        notifications_data = []
        recipient = notifications[0].recipient

        for notification in notifications:
            preview_comments, has_mention = cls.get_comments(
                recipient.username, notification.params["new_comment_ids"]
            )

            notifications_data.append(
                {
                    **notification.params,
                    "comments": preview_comments,
                    "has_mention": has_mention,
                }
            )

        # Comments with mention go first
        notifications_data = sorted(notifications_data, key=lambda x: x["has_mention"], reverse=True)

        return {"recipient": recipient, "notifications": notifications_data}


class NotificationPostMilestone(NotificationTypeBase):
    type = "post_milestone"
    email_template = "emails/post_milestone.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        lifespan_pct: float

        def format_lifespan_pct(self):
            return round(self.lifespan_pct * 100, 2)


class NotificationPostStatusChange(NotificationTypeBase):
    type = "post_status_change"
    email_template = "emails/post_status_change.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        event: PostSubscription.PostStatusChange


class NotificationPostSpecificTime(NotificationTypeBase):
    type = "post_specific_time"
    email_template = "emails/post_specific_time.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams


NOTIFICATION_TYPE_REGISTRY = [
    NotificationNewComments,
    NotificationPostMilestone,
    NotificationPostStatusChange,
    NotificationPostSpecificTime,
]


def get_notification_handler_by_type(
    notification_type: str,
) -> type[NotificationTypeBase]:
    return next(
        cls for cls in NOTIFICATION_TYPE_REGISTRY if cls.type == notification_type
    )
