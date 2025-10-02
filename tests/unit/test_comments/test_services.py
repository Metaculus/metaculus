import pytest  # noqa
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactorVote, KeyFactorDriver
from comments.services.common import create_comment, soft_delete_comment
from comments.services.key_factors import key_factor_vote, create_key_factors
from comments.services.notifications import notify_mentioned_users
from posts.models import Post, PostUserSnapshot
from projects.permissions import ObjectPermission
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import factory_forecast
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


@pytest.mark.parametrize(
    "target_username,comment_author_perms,mention,mention_label",
    [
        ["user2", "admin", "user2", "you"],
        ["user_admin", "admin", "admins", "admins"],
        ["user_curator", "admin", "curators", "curators"],
        ["user_curator", "admin", "moderators", "moderators"],
        ["user_forecaster", "admin", "predictors", "predictors"],
        ["user2", "forecaster", "user2", "you"],
        ["user_admin", "forecaster", "admins", "admins"],
        ["user_curator", "forecaster", "curators", "curators"],
        ["user_curator", "forecaster", "moderators", "moderators"],
        ["user_forecaster", "forecaster", "predictors", ""],
    ],
)
def test_notify_mentioned_users(
    mocker,
    user1,
    user2,  # just make sure user2 exists
    question_binary,
    target_username,
    comment_author_perms,
    mention,
    mention_label,
):
    user_admin = factory_user(username="user_admin")
    user_curator = factory_user(username="user_curator")
    user_forecaster = factory_user(username="user_forecaster")

    post = factory_post(
        author=user1,
        title_en="Commented Post",
        default_project=factory_project(
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                user_admin.id: ObjectPermission.ADMIN,
                user_curator.id: ObjectPermission.CURATOR,
                user1.id: comment_author_perms,
            },
        ),
        question=question_binary,
    )
    factory_forecast(author=user_forecaster, question=question_binary)

    mock_send_email_with_template = mocker.patch(
        "notifications.services.send_email_with_template"
    )

    notify_mentioned_users(
        create_comment(user=user1, on_post=post, text=f"@{mention} How **are** you?")
    )
    if not mention_label:
        # If there's no mention label, there should be no email!
        # This can happen if a user attempts to mention something they can't actually
        # mention. Like a Forecaster trying to notify all predictors.
        mock_send_email_with_template.assert_not_called()
        return

    mock_send_email_with_template.assert_called()

    assert (
        mock_send_email_with_template.call_args.args[1]
        == f"user1 mentioned {mention_label} on “Commented Post”"
    )

    context = mock_send_email_with_template.call_args.kwargs["context"]
    assert context["recipient"].username == target_username
    assert context["params"]["mention_label"] == mention_label
    assert context["params"]["preview_text"] == f"<b>@{mention}</b> How are you?"
    assert context["params"]["author_id"] == user1.id


def test_key_factor_vote(user1, user2):
    comment = factory_comment(author=user1, on_post=factory_post(author=user1))
    kf = factory_key_factor(
        comment=comment,
        driver=KeyFactorDriver.objects.create(text="Key Factor Text"),
        votes={user2: -1},
        vote_type=KeyFactorVote.VoteType.A_UPVOTE_DOWNVOTE,
    )

    assert (
        key_factor_vote(
            kf, user1, vote=-1, vote_type=KeyFactorVote.VoteType.A_UPVOTE_DOWNVOTE
        )
        == -2
    )
    assert (
        key_factor_vote(kf, user1, vote_type=KeyFactorVote.VoteType.A_UPVOTE_DOWNVOTE)
        == -1
    )
    assert (
        key_factor_vote(
            kf, user1, vote=1, vote_type=KeyFactorVote.VoteType.A_UPVOTE_DOWNVOTE
        )
        == 0
    )


def test_soft_delete_comment(user1, user2, post):
    factory_comment(author=user2, on_post=post)
    to_be_deleted = factory_comment(author=user2, on_post=post)

    post.update_comment_count()
    assert post.comment_count == 2

    # Read comments
    PostUserSnapshot.update_viewed_at(post, user1)
    snapshot = PostUserSnapshot.objects.get(user=user1, post=post)
    assert snapshot.comments_count == 2

    # Delete already viewed comment
    soft_delete_comment(to_be_deleted)

    snapshot.refresh_from_db()
    assert snapshot.comments_count == 1
    post.refresh_from_db()
    assert post.comment_count == 1

    # Adding new comment
    factory_comment(author=user2, on_post=post)

    # Still not viewed
    snapshot.refresh_from_db()
    assert snapshot.comments_count == 1

    # View action
    PostUserSnapshot.update_viewed_at(post, user1)
    snapshot.refresh_from_db()
    assert snapshot.comments_count == 2
    post.refresh_from_db()
    assert post.comment_count == 2

    # Create a new unread comment and delete it
    to_be_deleted = factory_comment(author=user2, on_post=post)
    post.refresh_from_db()
    assert post.comment_count == 3

    soft_delete_comment(to_be_deleted)
    snapshot.refresh_from_db()
    assert snapshot.comments_count == 2
    assert post.comment_count == 2


def test_create_key_factors__limit_validation(user1, user2, post):
    c1 = factory_comment(author=user1, on_post=post)
    c2 = factory_comment(author=user1, on_post=post)
    create_key_factors(c1, ["1", "2", "3"])

    assert c1.key_factors.count() == 3

    # Create too many key-factors for one comment
    with pytest.raises(ValidationError):
        create_key_factors(c1, ["4", "5"])

    create_key_factors(c2, ["2.1", "2.2", "2.3"])
    assert c2.key_factors.count() == 3

    # Create too many key-factors for one post
    with pytest.raises(ValidationError):
        create_key_factors(c2, ["2.4"])

    # Check limit does not affect other users
    c3 = factory_comment(author=user2, on_post=post)
    create_key_factors(c3, ["3.1"])
