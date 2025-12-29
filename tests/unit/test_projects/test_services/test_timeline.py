from datetime import timedelta

from django.utils import timezone

from posts.models import Post
from projects.services.common import (
    get_project_timeline_data,
    get_timeline_data_for_projects,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


def test_get_project_timeline_data(user1):
    project = factory_project()
    now = timezone.now()

    # Create posts with questions
    factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            actual_resolve_time=now - timedelta(days=5),
            actual_close_time=now - timedelta(days=5),
        ),
    )
    post2 = factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.APPROVED,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            actual_resolve_time=now - timedelta(days=2),
            actual_close_time=now - timedelta(days=2),
        ),
    )

    # Create a post that shouldn't be included (not approved)
    factory_post(
        author=user1,
        default_project=project,
        curation_status=Post.CurationStatus.DRAFT,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )

    data = get_project_timeline_data(project=project)

    assert data["latest_actual_resolve_time"] == post2.question.actual_resolve_time
    assert data["all_questions_resolved"]
    assert data["all_questions_closed"]


def test_get_timeline_data_for_projects(user1, django_assert_num_queries):
    project1 = factory_project()
    project2 = factory_project()
    now = timezone.now()

    # Project 1: One resolved question
    post1 = factory_post(
        author=user1,
        default_project=project1,
        curation_status=Post.CurationStatus.APPROVED,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            actual_resolve_time=now - timedelta(days=10),
            actual_close_time=now - timedelta(days=10),
        ),
    )

    # Project 2: One open question
    post2 = factory_post(
        author=user1,
        default_project=project2,
        curation_status=Post.CurationStatus.APPROVED,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            actual_resolve_time=None,
            scheduled_resolve_time=now + timedelta(days=10),
            scheduled_close_time=now + timedelta(days=5),
        ),
    )

    # Shared Post: In Project 1 (default) and Project 2 (m2m)
    # Resolved recently
    post3 = factory_post(
        author=user1,
        default_project=project1,
        projects=[project2],
        curation_status=Post.CurationStatus.APPROVED,
        question=create_question(
            question_type=Question.QuestionType.BINARY,
            actual_resolve_time=now - timedelta(days=1),
            actual_close_time=now - timedelta(days=1),
        ),
    )

    # Call function and ensure queries count
    with django_assert_num_queries(4):
        data = get_timeline_data_for_projects([project1.pk, project2.pk])

    # Check Project 1 Data
    # Should include post1 and post3
    p1_data = data[project1.pk]
    assert p1_data["latest_actual_resolve_time"] == post3.question.actual_resolve_time
    assert p1_data["all_questions_resolved"]

    # Check Project 2 Data
    # Should include post2 and post3
    p2_data = data[project2.pk]
    # post3 is resolved, but post2 is not
    assert not p2_data["all_questions_resolved"]
    assert p2_data["latest_actual_resolve_time"] == post3.question.actual_resolve_time
