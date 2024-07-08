from comments.services import create_comment
from posts.models import Post, PostUserSnapshot
from projects.permissions import ObjectPermission
from tests.fixtures import *  # noqa
from tests.test_posts.factories import factory_post
from tests.test_projects.factories import factory_project


def test_create_comment__happy_path(user1):
    post = factory_post(
        author=user1,
        default_project=factory_project(
            # Private Projects
            default_permission=ObjectPermission.FORECASTER,
        ),
        curation_status=Post.CurationStatus.APPROVED,
    )

    comment = create_comment(user=user1, on_post=post, text="Sample Comment")
    assert comment.text == "Sample Comment"

    # Check counter
    snapshot = PostUserSnapshot.objects.get(user_id=user1.id, post_id=post.id)
    assert snapshot.comments_count == 1
