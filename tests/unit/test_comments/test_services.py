import pytest  # noqa

from comments.services.common import create_comment
from comments.services.key_factors import key_factor_vote
from notifications.models import Notification
from posts.models import Post, PostUserSnapshot
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import factory_forecast
from tests.unit.test_questions.fixtures import *  # noqa
from tests.unit.test_users.factories import factory_user


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


@pytest.mark.parametrize(
    "mention,username",
    [
        ["@predictors", "user_predictor"],
        ["@admins", "user_admin"],
        ["@moderators", "user_curator"],
        ["@curators", "user_curator"],
    ],
)
def test_create_comment__mentioned_groups(
    await_queue, transactional_db, question_binary, mention, username
):
    user_admin = factory_user(username="user_admin")
    user_curator = factory_user(username="user_curator")
    user_predictor = factory_user(username="user_predictor")

    post = factory_post(
        default_project=factory_project(
            # Private Projects
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                user_admin.pk: ObjectPermission.ADMIN,
                user_curator.pk: ObjectPermission.CURATOR,
            },
        ),
        curation_status=Post.CurationStatus.APPROVED,
        question=question_binary,
    )

    # Forecasters
    factory_forecast(author=user_predictor, question=question_binary)
    create_comment(
        user=factory_user(), on_post=post, text=f"Comment to mention {mention}"
    )

    await_queue()

    assert Notification.objects.count() == 1
    assert Notification.objects.filter(
        recipient__username=username, type="post_new_comments"
    ).exists()


def test_key_factor_vote(user1, user2):
    comment = factory_comment(author=user1, on_post=factory_post(author=user1))
    kf = factory_key_factor(
        comment=comment,
        text="Key Factor Text",
        votes={user2: -1},
    )

    assert key_factor_vote(kf, user1, score=-1) == {-1: 2}
    assert key_factor_vote(kf, user1) == {-1: 1}
    assert key_factor_vote(kf, user1, score=1) == {1: 1, -1: 1}
