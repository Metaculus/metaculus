from comments.services.common import create_comment
from notifications.models import Notification
from posts.models import Post, PostUserSnapshot
from projects.permissions import ObjectPermission
from tests.fixtures import *  # noqa
from tests.test_posts.factories import factory_post
from tests.test_projects.factories import factory_project


@pytest.fixture()
def post(user1):
    return factory_post(
        author=user1,
        default_project=factory_project(
            # Private Projects
            default_permission=ObjectPermission.FORECASTER,
        ),
        curation_status=Post.CurationStatus.APPROVED,
    )


def test_create_comment__happy_path(post, user1):
    comment = create_comment(user=user1, on_post=post, text="Sample Comment")
    assert comment.text == "Sample Comment"

    # Check counter
    snapshot = PostUserSnapshot.objects.get(user_id=user1.id, post_id=post.id)
    assert snapshot.comments_count == 1


def test_create_comment__mentioned_users(
    post, user1, user2, await_queue, transactional_db
):
    assert not Notification.objects.filter(
        recipient=user1, type="post_new_comments"
    ).exists()

    comment = create_comment(user=user2, on_post=post, text="Comment to mention @user1")

    await_queue()

    # Check notifications
    notification = Notification.objects.get(recipient=user1, type="post_new_comments")

    assert notification.params["post"]["post_id"] == post.id
    assert notification.params["new_comment_ids"] == [comment.id]
