import logging
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime, timezone as dt_timezone, timedelta

from dateutil.parser import parse as date_parse
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from comments.constants import CommentReportType
from comments.models import Comment
from notifications.constants import MailingTags
from notifications.models import Notification
from notifications.utils import generate_email_comment_preview_text
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.utils import get_question_group_title
from users.models import User
from utils.dtypes import dataclass_from_dict
from utils.email import send_email_with_template
from utils.formatters import abbreviated_number, format_value_unit
from utils.frontend import build_post_comment_url

logger = logging.getLogger(__name__)


@dataclass
class NotificationUserParams:
    id: int
    username: str

    @classmethod
    def from_user(cls, user: User):
        return cls(
            id=user.id,
            username=user.username,
        )


@dataclass
class NotificationPostParams:
    post_id: int
    post_title: str
    post_type: str

    @classmethod
    def _extract_post_type(cls, post: Post):
        if post.question_id:
            return "question"
        if post.conditional_id:
            return "conditional"
        if post.group_of_questions_id:
            return "group_of_questions"
        if post.notebook_id:
            return "notebook"

    @classmethod
    def from_post(cls, post: Post):
        return NotificationPostParams(
            post_id=post.id,
            post_title=post.title,
            post_type=cls._extract_post_type(post),
        )


@dataclass
class NotificationQuestionParams:
    id: int
    title: str
    type: str
    label: str = ""
    unit: str = None

    @classmethod
    def from_question(cls, question: Question):
        return cls(
            id=question.id,
            title=question.title,
            type=question.type,
            label=question.label,
            unit=question.unit,
        )


@dataclass
class NotificationProjectParams:
    id: int
    name: str
    slug: str

    @classmethod
    def from_project(cls, project: Project):
        return cls(id=project.id, slug=project.slug, name=project.name)


@dataclass
class CPChangeData:
    question: NotificationQuestionParams
    forecast_date: str | None = None
    cp_median: float | None = None
    cp_change_label: str | None = None
    cp_change_value: float | None = None
    # binary / MC only
    odds_ratio: float | None = None
    user_forecast: float | None = None
    # MC only
    label: str | None = None
    # Continuous Only
    cp_q1: float | None = None
    cp_q3: float | None = None
    user_q1: float | None = None
    user_median: float | None = None
    user_q3: float | None = None

    def format_forecast_date(self):
        return date_parse(self.forecast_date) if self.forecast_date else None

    def get_cp_change_label(self):
        if not self.cp_change_value:
            return ""
        return {
            "goneUp": _("gone up"),
            "goneDown": _("gone down"),
            "expanded": _("expanded"),
            "contracted": _("contracted"),
            "changed": _("changed"),
        }.get(self.cp_change_label, self.cp_change_label)

    def get_cp_change_symbol(self):
        if not self.cp_change_value:
            return ""
        return {
            "goneUp": "+",
            "goneDown": "-",
            "expanded": "←→",
            "contracted": "→←",
            "changed": "↕",
        }.get(self.cp_change_label, self.cp_change_label)

    def format_value(self, value, change: bool = False):
        if value is None:
            return "-"

        if self.question.type in ("multiple_choice", "binary"):
            return f"{round(value * 100, 2)}%"

        if self.question.type == Question.QuestionType.DATE:
            if change:
                # value is a timedelta in seconds
                difference = timedelta(seconds=value)
                years = round(difference.days // 365)
                days = round(difference.days % 365)
                if years > 1:
                    if days > 1:
                        return f"{years} years, {days} days"
                    if days == 1:
                        return f"{years} years, 1 day"
                    return f"{years} years"
                if years == 1:
                    if days > 1:
                        return f"1 year, {days} days"
                    if days == 1:
                        return "1 year, 1 day"
                    return "1 year"
                if days > 1:
                    return f"{days} days"
                if days == 1:
                    return "1 day"
                return "<1 day"
            return datetime.fromtimestamp(value, tz=dt_timezone.utc).strftime(
                "%Y-%m-%d"
            )

        if self.question.type in [
            Question.QuestionType.NUMERIC,
            Question.QuestionType.DISCRETE,
        ]:
            return format_value_unit(abbreviated_number(value), self.question.unit)

        return value

    def format_user_forecast(self):
        return self.format_value(
            self.user_forecast if self.user_forecast is not None else self.user_median
        )

    def format_cp_change_value(self):
        return self.format_value(self.cp_change_value, change=True)

    def format_cp_median(self):
        return self.format_value(self.cp_median)

    def format_question_title(self):
        # TODO: deprecate get_question_group_title after the first release of this change
        return self.question.label or get_question_group_title(self.question.title)


class NotificationTypeBase:
    type: str
    email_template: str = None

    @dataclass
    class ParamsType:
        pass

    @classmethod
    def schedule(
        cls,
        recipient: User,
        params: ParamsType,
        mailing_tag: MailingTags = None,
        **kwargs,
    ):
        """
        Schedules a notification to be sent using a cron job.
        """

        # Skip notification sending if it was ignored
        if mailing_tag and mailing_tag in recipient.unsubscribed_mailing_tags:
            return

            # Create notification object
        notification = Notification.objects.create(
            type=cls.type, recipient=recipient, params=asdict(params), **kwargs
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
            use_async=False,
            from_email=settings.EMAIL_NOTIFICATIONS_USER,
        )


class NotificationTypeSimilarPostsMixin:
    """
    Generates similar posts for notification
    """

    @classmethod
    def get_similar_posts(cls, post_ids: list[int]):
        from posts.services.feed import get_similar_posts_for_posts

        similar_posts = []
        posts = Post.objects.filter(pk__in=post_ids).only("id", "title")

        try:
            similar_post_ids = get_similar_posts_for_posts(posts, 4)
        except Exception:
            logger.exception("Failed to generate similar posts")
            similar_post_ids = []

        if posts:
            similar_posts = [
                {
                    "id": p.pk,
                    "title": p.title,
                }
                for p in Post.objects.filter(pk__in=similar_post_ids).only(
                    "id", "title"
                )
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
    comments_to_display = 8

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
    def _generate_previews(cls, recipient_username, new_comment_ids: list[int]):
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

        data = []

        for comment in comments:
            preview_text, _ = generate_email_comment_preview_text(
                comment.text, recipient_username
            )

            data.append(
                {
                    "author_username": comment.author.username,
                    "preview_text": preview_text,
                    "url": build_post_comment_url(
                        comment.on_post_id, comment.on_post.title, comment.id
                    ),
                }
            )

        return data

    @classmethod
    def _merge_notifications_params(
        cls, notifications: list[Notification]
    ) -> dict[int, dict]:
        """
        Merges notifications' params of the same post_id
        """

        post_notifications = {}

        for notification in notifications:
            post_id = notification.params["post"]["post_id"]
            if not post_notifications.get(post_id):
                post_notifications[post_id] = {
                    "post": notification.params["post"],
                    "new_comment_ids": [],
                }

            post_notifications[post_id]["new_comment_ids"] += notification.params[
                "new_comment_ids"
            ]

        return post_notifications

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        recipient = notifications[0].recipient
        serialized_notifications = []

        for post_id, params in cls._merge_notifications_params(notifications).items():
            preview_comments = cls._generate_previews(
                recipient.username, params["new_comment_ids"]
            )

            # Limit total comments
            comments_count = len(preview_comments)
            read_more_count = comments_count - cls.comments_to_display

            serialized_notifications.append(
                {
                    **params,
                    "comments": preview_comments[: cls.comments_to_display],
                    "comments_count": comments_count,
                    "read_more_count": read_more_count if read_more_count > 0 else 0,
                }
            )

        return {
            "recipient": recipient,
            "notifications": serialized_notifications,
            "similar_posts": cls.get_similar_posts(
                [x["post"]["post_id"] for x in serialized_notifications]
            ),
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
        event: Post.PostStatusChange
        project: NotificationProjectParams = None
        question: NotificationQuestionParams = None

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Questions have changed status")

    @classmethod
    def _group_post_subquestions(cls, params: list[ParamsType]):
        """
        There may be situations where multiple subquestions of the same post are opened at the same time.
        We want to group those cases together and show only one row in the UI to make it more user-friendly.
        """

        grouped = defaultdict(list[cls.ParamsType])

        for param in params:
            grouped[f"{param.post.post_id}-{param.event}"].append(param)

        new_params: list[cls.ParamsType] = []

        for params in grouped.values():
            baseline = params[0]

            if len(params) == 1:
                new_params.append(baseline)
            else:
                question_labels = [obj.question.label for obj in params if obj.question]
                new_post_title = (
                    f"{baseline.post.post_title}: {', '.join(question_labels)}"
                )

                # Build a new ParamsType object with the combination of child types
                new_params.append(
                    cls.ParamsType(
                        post=NotificationPostParams(
                            post_id=baseline.post.post_id,
                            post_title=new_post_title,
                            post_type=baseline.post.post_type,
                        ),
                        event=baseline.event,
                        project=baseline.project,
                    )
                )

        return new_params

    @classmethod
    def _generate_notification_params(cls, params: list[ParamsType]):
        # Deduplicate Posts
        # There could be some cases when we have post open notification
        # from both post subscriptions and tournament ones.
        params_map = {}

        for obj in params:
            question_id = obj.question.id if obj.question else None
            key = f"{obj.post.post_id}-{question_id}-{obj.event}"

            if not params_map.get(key) or obj.project:
                params_map[key] = obj

        # Step #2: group by tournaments
        from_projects = {}
        from_posts = []

        for param in params_map.values():
            if param.project:
                project_id = param.project.id
                if not from_projects.get(project_id):
                    from_projects[project_id] = {
                        "project": param.project,
                        "notifications": [],
                    }
                from_projects[project_id]["notifications"].append(param)
            else:
                from_posts.append(param)

        # Group Post<>subquestions of the same event
        from_posts = cls._group_post_subquestions(from_posts)
        for project_id, obj in from_projects.items():
            obj["notifications"] = cls._group_post_subquestions(obj["notifications"])

        return {
            "from_projects": list(from_projects.values()),
            "from_posts": from_posts,
        }

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        all_params = [
            dataclass_from_dict(cls.ParamsType, notification.params)
            for notification in notifications
        ]
        final_params = cls._generate_notification_params(all_params)

        return {
            "recipient": notifications[0].recipient,
            "params": final_params,
            "similar_posts": cls.get_similar_posts(
                list({x.post.post_id for x in all_params})
            ),
        }


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


class NotificationPostCPChange(NotificationTypeSimilarPostsMixin, NotificationTypeBase):
    type = "post_cp_change"
    email_template = "emails/post_cp_change.html"

    @dataclass
    class ParamsType:
        post: NotificationPostParams
        question_data: list[CPChangeData]
        last_sent: str

        def format_last_sent(self):
            return date_parse(self.last_sent) if self.last_sent else None

    @classmethod
    def generate_subject_group(cls, recipient: User):
        """
        Generates subject for group emails
        """

        return _("Significant change")

    @classmethod
    def get_email_context_group(cls, notifications: list[Notification]):
        # Remove multiple entries of the same post
        notifications = sorted(notifications, key=lambda x: x.created_at, reverse=True)
        post_ids = set()

        for notification in notifications[:]:
            post_id = notification.params["post"]["post_id"]

            if post_id in post_ids:
                notifications.remove(notification)

            post_ids.add(post_id)

        return super().get_email_context_group(notifications)


class NotificationPredictedQuestionResolved(
    NotificationTypeSimilarPostsMixin, NotificationTypeBase
):
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

        def format_resolution(self):
            return format_value_unit(self.resolution, self.question.unit)

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


def send_comment_mention_notification(recipient, comment: Comment, mention: str):
    """
    Send instant notification of mention in a comment
    """

    mention_label = "you" if mention == recipient.username.lower() else mention
    preview_text = generate_email_comment_preview_text(
        comment.text, mention, max_chars=1024
    )[0]

    return send_email_with_template(
        recipient.email,
        _(
            f"{comment.author.username} mentioned {mention_label} on “{comment.on_post.title}”"
        ),
        "emails/comment_mention.html",
        context={
            "recipient": recipient,
            "params": {
                "post": NotificationPostParams.from_post(comment.on_post),
                "author_id": comment.author_id,
                "author_username": comment.author.username,
                "mention_label": mention_label,
                "preview_text": preview_text,
                "comment_url": build_post_comment_url(
                    comment.on_post_id, comment.on_post.title, comment.id
                ),
            },
        },
        use_async=False,
        from_email=settings.EMAIL_NOTIFICATIONS_USER,
    )


def send_comment_report_notification_to_staff(
    comment: Comment, reason: CommentReportType, reporter: User
):
    recipients = comment.on_post.default_project.get_users_for_permission(
        ObjectPermission.CURATOR
    )

    return send_email_with_template(
        [x.email for x in recipients],
        _(
            f"Comment report: {comment.author.username} - "
            f"{generate_email_comment_preview_text(comment.text, max_chars=40)[0]}"
        ),
        "emails/comment_report.html",
        context={
            "params": {
                "post_title": comment.on_post.title,
                "comment": comment,
                "preview_text": generate_email_comment_preview_text(
                    comment.text, max_chars=300
                )[0],
                "comment_url": build_post_comment_url(
                    comment.on_post_id, comment.on_post.title, comment.id
                ),
                "reporter": reporter,
                "reason": reason,
            },
        },
        from_email=settings.EMAIL_NOTIFICATIONS_USER,
    )


def send_forecast_autowidrawal_notification(
    user: User,
    posts_data: list[dict],
    account_settings_url: str,
):
    send_email_with_template(
        to=user.email,
        subject=_(f"{len(posts_data)} of your predictions will auto-withdraw soon unless updated"),
        template_name="emails/forecast_auto_withdraw.html",
        context={
            "recipient": user,
            "posts_data": posts_data,
            "account_settings_url": account_settings_url,
            "number_of_posts": len(posts_data),
        },
        use_async=False,
    )

    return True
