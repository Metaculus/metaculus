from dataclasses import dataclass, asdict
from typing import TypeVar, Generic

from notifications.models import Notification
from posts.models import Post, PostSubscription
from users.models import User

T = TypeVar("T", bound=dataclass)


@dataclass
class NotificationPostParams:
    post_id: int
    post_title: str

    @classmethod
    def from_post(cls, post: Post):
        return NotificationPostParams(post_id=post.id, post_title=post.title)


class NotificationTypeBase(Generic[T]):
    type: str

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
    def send_group(cls, notifications: list[Notification]) -> str:
        """
        Send group of notifications of the same type
        """

        raise NotImplementedError()


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
