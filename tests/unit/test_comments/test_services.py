import pytest  # noqa

from comments.services.common import create_comment
from comments.services.key_factors import key_factor_vote
from comments.services.notifications import notify_mentioned_users
from posts.models import Post, PostUserSnapshot
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
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
    "target_username,mention,mention_label",
    [
        ["user2", "user2", "you"],
        ["user_admin", "admins", "admins"],
        ["user_curator", "curators", "curators"],
        ["user_curator", "moderators", "moderators"],
        ["user_forecaster", "predictors", "predictors"],
    ],
)
def test_notify_mentioned_users(
    mocker,
    user1,
    user2,
    question_binary,
    target_username,
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
        text="Key Factor Text",
        votes={user2: -1},
    )

    assert key_factor_vote(kf, user1, vote=-1) == -2
    assert key_factor_vote(kf, user1) == -1
    assert key_factor_vote(kf, user1, vote=1) == 0
