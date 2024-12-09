from django.utils import timezone

from posts.services.common import get_posts_staff_users, update_post
from projects.permissions import ObjectPermission
from questions.models import Question
from tests.unit.fixtures import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


def test_get_posts_staff_users(user1, user2):
    # Post #1
    post_1 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=ObjectPermission.FORECASTER,
            override_permissions={
                user1.id: ObjectPermission.CURATOR,
                user2.id: ObjectPermission.ADMIN,
            },
        ),
    )
    post_2 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=None,
            override_permissions={user2.id: ObjectPermission.CURATOR},
        ),
    )
    post_3 = factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=ObjectPermission.VIEWER,
        ),
    )

    data = get_posts_staff_users([post_1, post_2, post_3])
    assert len(data) == 3

    assert len(data[post_1]) == 2
    assert data[post_1][user1.id] == ObjectPermission.CURATOR
    assert data[post_1][user2.id] == ObjectPermission.ADMIN

    assert len(data[post_2]) == 1
    assert data[post_2][user2.id] == ObjectPermission.CURATOR

    assert data[post_3] == {}


def test_update_post__run_post_indexing(user1, user2, mocker):
    mock_run_post_indexing = mocker.patch("posts.tasks.run_post_indexing.send")

    post_1 = factory_post(
        author=user1,
        title="Post",
        question=create_question(
            title="Binary Question", question_type=Question.QuestionType.BINARY
        ),
    )

    # No text updated
    update_post(post_1, scheduled_close_time=timezone.now())
    mock_run_post_indexing.assert_not_called()

    # Updated text - reindexing
    update_post(post_1, title="Updated Post")
    mock_run_post_indexing.assert_called_once()

    # No text updated
    mock_run_post_indexing.reset_mock()
    update_post(post_1, scheduled_close_time=timezone.now())
    mock_run_post_indexing.assert_not_called()

    # Updated question text - reindexing
    update_post(post_1, question={"title": "Updated Binary Question"})
    mock_run_post_indexing.assert_called_once()
