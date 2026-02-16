from django.db import IntegrityError, transaction
from django.db.models import Q, Case, When, Value, BooleanField

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPostStatusChange,
    NotificationPostParams,
    NotificationProjectParams,
    NotificationQuestionParams,
    send_news_category_notebook_publish_notification,
)
from posts.models import Post, Notebook
from projects.models import Project, ProjectSubscription
from projects.permissions import ObjectPermission
from questions.constants import QuestionStatus
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
def unsubscribe_project(project: Project, user: User):
    ProjectSubscription.objects.filter(project=project, user=user).delete()

    project.update_followers_count()
    project.save()


def notify_project_subscriptions_post_open(
    post: Post,
    question: Question = None,
    notebook: Notebook = None,
    project: Project = None,
):
    if project:
        subscriptions = ProjectSubscription.objects.filter(project=project)
    else:
        subscriptions = ProjectSubscription.objects.filter(
            Q(project__posts=post) | Q(project__default_posts=post)
        )

    subscriptions = (
        subscriptions.filter(
            # Ensure notify users that have access to the question
            user__in=post.default_project.get_users_for_permission(
                ObjectPermission.VIEWER
            )
        )
        .annotate(
            # We want to prioritize news categories over regular projects
            is_news_category=Case(
                When(
                    project__type=Project.ProjectTypes.NEWS_CATEGORY, then=Value(True)
                ),
                default=Value(False),
                output_field=BooleanField(),
            )
        )
        .order_by("user", "-is_news_category")
        .distinct("user")
        .select_related("project", "user")
    )

    # Ensure post is available for users
    for subscription in subscriptions:
        if notebook and subscription.project.type == Project.ProjectTypes.NEWS_CATEGORY:
            # We want to send a separate email right away
            # if this is a notebook post in News project
            send_news_category_notebook_publish_notification(subscription.user, post)
        else:
            # Otherwise, schedule a regular notification
            NotificationPostStatusChange.schedule(
                subscription.user,
                NotificationPostStatusChange.ParamsType(
                    post=NotificationPostParams.from_post(post),
                    event=Post.PostStatusChange.OPEN,
                    project=NotificationProjectParams.from_project(
                        subscription.project
                    ),
                    question=(
                        NotificationQuestionParams.from_question(question)
                        if question
                        else None
                    ),
                    notebook_id=notebook.id if notebook else None,
                ),
                mailing_tag=MailingTags.TOURNAMENT_NEW_QUESTIONS,
            )


def notify_post_added_to_project(post: Post, project: Project):
    if post.curation_status != Post.CurationStatus.APPROVED:
        return

    for question in post.questions.all():
        # Don’t send a notification if `open_time_triggered` is False
        # it will be handled automatically by `handle_question_open`
        if question.open_time_triggered and question.status == QuestionStatus.OPEN:
            notify_project_subscriptions_post_open(
                post, question=question, project=project
            )

    if post.notebook_id and post.notebook.open_time_triggered:
        notify_project_subscriptions_post_open(
            post, notebook=post.notebook, project=project
        )
