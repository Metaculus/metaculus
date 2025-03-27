from notifications.models import Notification
from posts.models import Post
from projects.permissions import ObjectPermission
from projects.services.common import notify_project_subscriptions_post_open
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user


def test_notify_project_subscriptions_post_open_notification(user1, user2):
    user3 = factory_user()
    project_default = factory_project(
        default_permission=ObjectPermission.FORECASTER, subscribers=[user1, user2]
    )
    project_1 = factory_project(subscribers=[user1, user3])
    project_2 = factory_project(subscribers=[user1])

    post = factory_post(
        author=factory_user(),
        default_project=project_default,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_1, project_2],
    )

    # Post is located in 2 projects
    notify_project_subscriptions_post_open(post)

    assert (
        Notification.objects.filter(recipient=user1, type="post_status_change").count()
        == 1
    )
    assert (
        Notification.objects.filter(recipient=user2, type="post_status_change").count()
        == 1
    )
    assert (
        Notification.objects.filter(recipient=user3, type="post_status_change").count()
        == 1
    )

    notification = Notification.objects.filter(
        recipient=user1, type="post_status_change"
    ).first()

    assert notification.params["event"] == "open"
    assert notification.params["project"]
    assert notification.params["post"]


def test_notify_project_subscriptions_post_open__private_question(user1, user2):
    project_default_private = factory_project(
        default_permission=None,
        override_permissions={user1.pk: ObjectPermission.FORECASTER},
    )
    project_public = factory_project(
        subscribers=[user1, user2], default_permission=ObjectPermission.FORECASTER
    )

    post = factory_post(
        author=factory_user(),
        default_project=project_default_private,
        curation_status=Post.CurationStatus.APPROVED,
        projects=[project_public],
    )

    # Post is located in 2 projects
    notify_project_subscriptions_post_open(post)

    assert set(
        Notification.objects.filter(type="post_status_change").values_list(
            "recipient_id", flat=True
        )
    ) == {user1.pk}
