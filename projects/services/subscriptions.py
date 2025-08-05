from django.db import IntegrityError, transaction
from django.db.models import Q

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPostStatusChange,
    NotificationPostParams,
    NotificationProjectParams,
    NotificationQuestionParams,
)
from posts.models import Post
from projects.models import Project, ProjectSubscription
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User


@transaction.atomic
def subscribe_project(project: Project, user: User):
    obj = ProjectSubscription(
        project=project,
        user=user,
    )

    try:
        obj.save()
    except IntegrityError:
        # Skip if use has been already subscribed
        return

    project.update_followers_count()
    project.save()


@transaction.atomic
def unsubscribe_project(project: Project, user: User) -> ProjectSubscription:
    ProjectSubscription.objects.filter(project=project, user=user).delete()

    project.update_followers_count()
    project.save()


def notify_project_subscriptions_question_open(question: Question):
    post = question.get_post()

    subscriptions = (
        ProjectSubscription.objects.filter(
            Q(project__posts=post) | Q(project__default_posts=post)
        )
        .filter(
            # Ensure notify users that have access to the question
            user__in=post.default_project.get_users_for_permission(
                ObjectPermission.VIEWER
            )
        )
        .prefetch_related("project", "user")
        .distinct("user")
    )

    # Ensure post is available for users
    for subscription in subscriptions:
        NotificationPostStatusChange.schedule(
            subscription.user,
            NotificationPostStatusChange.ParamsType(
                post=NotificationPostParams.from_post(post),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams.from_project(subscription.project),
                question=NotificationQuestionParams.from_question(question),
            ),
            mailing_tag=MailingTags.TOURNAMENT_NEW_QUESTIONS,
        )
