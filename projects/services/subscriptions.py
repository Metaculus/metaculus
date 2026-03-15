from django.db import transaction
from django.db.models import Q, Case, When, Value, BooleanField

from notifications.constants import MailingTags
from notifications.services import (
    NotificationPostStatusChange,
    NotificationPostParams,
    NotificationProjectParams,
    NotificationQuestionParams,
    send_news_category_notebook_publish_notification,
)
from posts.models import Post, PostSubscription, Notebook
from projects.models import Project, ProjectSubscription
from projects.permissions import ObjectPermission
from questions.constants import QuestionStatus
from questions.models import Question
from users.models import User


def _create_default_question_subscriptions(user: User, post: Post):
    """
    Create default PostSubscription records for a question post.
    Matches the defaults used in the frontend's getInitialQuestionSubscriptions.
    """

    from posts.services.subscriptions import (
        create_subscription_cp_change,
        create_subscription_milestone,
        create_subscription_new_comments,
        create_subscription_status_change,
    )

    return [
        create_subscription_new_comments(user=user, post=post, comments_frequency=1),
        create_subscription_status_change(user=user, post=post),
        create_subscription_milestone(user=user, post=post, milestone_step=0.2),
        create_subscription_cp_change(user=user, post=post, cp_change_threshold=0.25),
    ]


def follow_all_project_questions(project: Project, user: User):
    """
    Follow all questions in a project with default subscription settings.
    Skips posts the user already has non-global subscriptions on.
    """

    posts = (
        Post.objects.filter_projects(project)
        .filter_permission(user=user)
        .filter_questions()
    )

    # Find posts user already follows (has non-global subscriptions)
    already_followed_post_ids = set(
        PostSubscription.objects.filter(
            user=user,
            post__in=posts,
            is_global=False,
        )
        .values_list("post_id", flat=True)
        .distinct()
    )

    for post in posts:
        if post.pk in already_followed_post_ids:
            continue
        _create_default_question_subscriptions(user, post)


def unfollow_all_project_questions(project: Project, user: User):
    """
    Remove all non-global post subscriptions for questions in a project.
    """

    posts = (
        Post.objects.filter_projects(project)
        .filter_permission(user=user)
        .filter_questions()
    )
    PostSubscription.objects.filter(
        user=user,
        post__in=posts,
        is_global=False,
    ).delete()


def follow_new_project_post(post: Post, project: Project):
    """
    Auto-follow a newly added post for all project subscribers
    who have follow_questions enabled.
    """

    subscriptions = ProjectSubscription.objects.filter(
        project=project,
        follow_questions=True,
    ).select_related("user")

    for subscription in subscriptions:
        user = subscription.user
        # Check user has permission to view the post
        if not Post.objects.filter_permission(user=user).filter(pk=post.pk).exists():
            continue
        # Skip if user already has subscriptions on this post
        if PostSubscription.objects.filter(
            user=user, post=post, is_global=False
        ).exists():
            continue
        _create_default_question_subscriptions(user, post)


@transaction.atomic
def subscribe_project(project: Project, user: User, follow_questions: bool = False):
    project_subscription = ProjectSubscription.objects.filter(
        project=project, user=user
    ).first()
    if project_subscription:
        # Update follow_questions if subscription already exists
        project_subscription.follow_questions = follow_questions
        project_subscription.save()
    else:
        ProjectSubscription.objects.create(
            project=project,
            user=user,
            follow_questions=follow_questions,
        )

    project.update_followers_count()
    project.save()

    if follow_questions:
        follow_all_project_questions(project, user)


@transaction.atomic
def unsubscribe_project(project: Project, user: User, unfollow_questions: bool = False):
    if unfollow_questions:
        unfollow_all_project_questions(project, user)

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

    # Auto-follow new questions for subscribers with follow_questions enabled
    if post.question_id or post.conditional_id or post.group_of_questions_id:
        follow_new_project_post(post, project)
