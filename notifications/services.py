from dataclasses import dataclass, asdict

from notifications.models import Notification
from posts.models import Post, PostSubscription
from users.models import User
from utils.dtypes import dataclass_from_dict
from utils.email import send_email_with_template


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
    def generate_subject_group(cls, recipient: User, params: list[ParamsType]):
        """
        Generates subject for group emails
        """

        raise NotImplementedError()

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
        params = [dataclass_from_dict(cls.ParamsType, n) for n in notifications]

        return send_email_with_template(
            recipient.email,
            cls.generate_subject_group(recipient, params),
            cls.email_template,
            context={"recipient": recipient, "params": params},
        )


class NotificationNewComments(NotificationTypeBase):
    type = "post_new_comments"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        new_comments: int


class NotificationPostMilestone(NotificationTypeBase):
    type = "post_milestone"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        lifespan_pct: float


class NotificationPostStatusChange(NotificationTypeBase):
    type = "post_status_change"

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
