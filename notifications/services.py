from dataclasses import dataclass, asdict

from django.utils.translation import gettext_lazy as _

from comments.models import Comment
from notifications.models import Notification
from notifications.utils import generate_email_comment_preview_text
from posts.models import Post, PostSubscription
from posts.services.search import get_similar_posts_for_multiple_posts
from questions.models import Question
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


@dataclass
class CPChangeData:
    question: Question
    cp_median: float | None = None
    # binary / MC only
    absolute_difference: float | None = None
    odds_ratio: float | None = None
    user_forecast: float | None = None
    # MC only
    label: str | None = None
    # Continuous Only
    cp_q1: float | None = None
    cp_q3: float | None = None
    earth_movers_diff: float | None = None
    assymetry: float | None = None
    user_q1: float | None = None
    user_median: float | None = None
    user_q3: float | None = None


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
            "params": [
                dataclass_from_dict(cls.ParamsType, n.params) for n in notifications
            ],
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


class NotificationTypeSimilarPostsMixin:
    """
    Generates similar posts for notification
    """

    @classmethod
    def get_similar_posts(cls, post_ids: list[int]):
        similar_posts = []
        posts = Post.objects.filter(pk__in=post_ids).only("id", "title")

        if posts:
            similar_posts = [
                {
                    "id": p.pk,
                    "title": p.title,
                }
                for p in get_similar_posts_for_multiple_posts(posts)[:4]
            ]

        return similar_posts

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        params = super().get_email_context_group(notifications)

        post_ids = [n.params.get("post", {}).get("post_id") for n in notifications]
        similar_posts = cls.get_similar_posts([p for p in post_ids if p])

        return {**params, "similar_posts": similar_posts}


class NotificationNewComments(NotificationTypeSimilarPostsMixin, NotificationTypeBase):
    type = "post_new_comments"
    email_template = "emails/post_new_comments.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        new_comments_count: int
        new_comment_ids: list[int]

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Questions have new comments")

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
                    "has_mention": has_mention,
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
        comments_to_display = 8
        recipient = notifications[0].recipient
        post_notifications_map = {}

        for notification in notifications:
            post_id = notification.params["post"]["post_id"]
            preview_comments, has_mention = cls.get_comments(
                recipient.username, notification.params["new_comment_ids"]
            )

            if not post_notifications_map.get(post_id):
                post_notifications_map[post_id] = {
                    **notification.params,
                    "comments": [],
                    "has_mention": False,
                }

            post_notifications_map[post_id]["comments"] += preview_comments
            if has_mention:
                post_notifications_map[post_id]["has_mention"] = True

        notifications = list(post_notifications_map.values())

        for notification in notifications:
            # Comments with user mentions go first
            comments_count = len(notification["comments"])
            read_more_count = comments_count - comments_to_display

            notification["comments_count"] = comments_count
            notification["read_more_count"] = (
                read_more_count if read_more_count > 0 else 0
            )
            notification["comments"] = sorted(
                notification["comments"],
                key=lambda x: x["has_mention"],
                reverse=True,
            )[:comments_to_display]

        # Comments with mention go first
        notifications_data = sorted(
            notifications, key=lambda x: x["has_mention"], reverse=True
        )

        return {
            "recipient": recipient,
            "notifications": notifications_data,
            "similar_posts": cls.get_similar_posts(list(post_notifications_map.keys())),
        }


class NotificationPostMilestone(
    NotificationTypeSimilarPostsMixin, NotificationTypeBase
):
    type = "post_milestone"
    email_template = "emails/post_milestone.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        lifespan_pct: float

        def format_lifespan_pct(self):
            return round(self.lifespan_pct * 100, 2)

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Lifetime update for questions")


class NotificationPostStatusChange(
    NotificationTypeSimilarPostsMixin, NotificationTypeBase
):
    type = "post_status_change"
    email_template = "emails/post_status_change.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        event: PostSubscription.PostStatusChange

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Questions have changed status")


class NotificationPostSpecificTime(
    NotificationTypeSimilarPostsMixin, NotificationTypeBase
):
    type = "post_specific_time"
    email_template = "emails/post_specific_time.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Questions reminder")


class NotificationPostCPChange(NotificationTypeBase):
    type = "post_cp_change"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        question_data: list[CPChangeData]


@dataclass
class NotificationQuestionParams:
    id: int
    title: str

    @classmethod
    def from_question(cls, question: Question):
        return cls(id=question.id, title=question.title)


class NotificationPredictedQuestionResolved(NotificationTypeBase):
    type = "predicted_question_resolved"
    email_template = "emails/predicted_question_resolved.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        question: NotificationQuestionParams

        resolution: str
        forecasts_count: int
        coverage: float
        peer_score: float = 0
        baseline_score: float = 0

        def format_coverage(self):
            return round(self.coverage * 100, 1)

        def format_peer_score(self):
            return round(self.peer_score, 1)

        def format_baseline_score(self):
            return round(self.baseline_score, 1)

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Predicted questions have been resolved")


NOTIFICATION_TYPE_REGISTRY = [
    NotificationNewComments,
    NotificationPostMilestone,
    NotificationPostStatusChange,
    NotificationPredictedQuestionResolved,
    NotificationPostSpecificTime,
    NotificationPostCPChange,
]


def get_notification_handler_by_type(
    notification_type: str,
) -> type[NotificationTypeBase]:
    return next(
        cls for cls in NOTIFICATION_TYPE_REGISTRY if cls.type == notification_type
    )
