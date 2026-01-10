import datetime

from django.utils import timezone
from django.utils.timezone import make_aware
from freezegun import freeze_time

from posts.services.common import get_posts_staff_users, update_post
from projects.permissions import ObjectPermission
from questions.models import Question, GroupOfQuestions
from questions.services.forecasts import (
    create_forecast_bulk,
    get_aggregated_forecasts_for_questions,
)
from questions.tasks import run_build_question_forecasts
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


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


@freeze_time("2024-01-01")
def test_update_post__actual_close_time(user1, user2, mocker):
    mocker.patch("posts.tasks.run_post_indexing.send")

    post = factory_post(
        author=user1,
        title="Post",
        question=create_question(
            title="Binary Question",
            question_type=Question.QuestionType.BINARY,
            scheduled_close_time=make_aware(datetime.datetime(2024, 1, 1)),
            actual_close_time=make_aware(datetime.datetime(2024, 1, 1)),
        ),
    )
    post.update_pseudo_materialized_fields()

    assert post.scheduled_close_time == make_aware(datetime.datetime(2024, 1, 1))
    assert post.actual_close_time == make_aware(datetime.datetime(2024, 1, 1))

    # No close date updated
    update_post(post, title="Updated")
    post.refresh_from_db()

    assert post.actual_close_time == post.scheduled_close_time

    # Change in the past
    update_post(
        post,
        question={
            "title": "question",
            "scheduled_close_time": make_aware(datetime.datetime(2023, 12, 1)),
        },
    )
    post.refresh_from_db()

    # No change
    assert post.question.scheduled_close_time == make_aware(
        datetime.datetime(2023, 12, 1)
    )
    assert post.question.actual_close_time == make_aware(datetime.datetime(2024, 1, 1))
    assert post.scheduled_close_time == make_aware(datetime.datetime(2023, 12, 1))
    assert post.actual_close_time == make_aware(datetime.datetime(2024, 1, 1))

    # Change in the future
    update_post(
        post,
        question={
            "title": "question",
            "scheduled_close_time": make_aware(datetime.datetime(2024, 5, 12)),
        },
    )
    post.refresh_from_db()

    # No close time
    assert not post.actual_close_time
    assert not post.question.actual_close_time
    assert post.question.scheduled_close_time == make_aware(
        datetime.datetime(2024, 5, 12)
    )


def test_get_aggregated_forecasts_for_questions(user1):
    post = factory_post(author=user1, group_of_questions=factory_group_of_questions())
    question_1 = create_question(
        title="First Question",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
    )
    question_2 = create_question(
        title="Last Question",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
    )
    question_3 = create_question(
        title="Empty Question",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
    )

    create_forecast_bulk(
        user=user1,
        forecasts=[
            {"question": question_1, "probability_yes": 0.4},
            {"question": question_1, "probability_yes": 0.5},
            {"question": question_1, "probability_yes": 0.7},
            {"question": question_2, "probability_yes": 0.1},
            {"question": question_2, "probability_yes": 0.2},
        ],
    )
    run_build_question_forecasts(question_1.id)
    run_build_question_forecasts(question_2.id)

    aggregated_forecasts = get_aggregated_forecasts_for_questions(
        questions=[question_1, question_2, question_3],
        group_cutoff=1,
        include_cp_history=True,
    )

    assert len(aggregated_forecasts[question_1]) == 3
    # This question was beyond group_cutoff=1
    # So it has only recently weighed aggregations
    assert len(aggregated_forecasts[question_2]) == 1
    assert len(aggregated_forecasts[question_3]) == 0


def test_get_aggregated_forecasts_for_questions__manual_ordering(user1):
    post = factory_post(
        author=user1,
        group_of_questions=factory_group_of_questions(
            subquestions_order=GroupOfQuestions.GroupOfQuestionsSubquestionsOrder.MANUAL
        ),
    )
    question_1 = create_question(
        title_original="Question 1",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
        group_rank=2,
    )
    question_2 = create_question(
        title_original="Question 2",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
        # Group rank is None
    )
    question_3 = create_question(
        title_original="Question 3",
        question_type=Question.QuestionType.BINARY,
        group=post.group_of_questions,
        group_rank=1,
    )

    for question in [question_1, question_2, question_3]:
        create_forecast_bulk(
            user=user1,
            forecasts=[
                {"question": question, "probability_yes": 0.1},
                {"question": question, "probability_yes": 0.2},
            ],
        )
        run_build_question_forecasts(question.id)

    aggregated_forecasts = get_aggregated_forecasts_for_questions(
        questions=[question_1, question_2, question_3],
        group_cutoff=2,
        include_cp_history=True,
    )

    # Ensure cutoff took only first 2 questions ordered by group_rank
    assert len(aggregated_forecasts[question_2]) == 2
    assert len(aggregated_forecasts[question_3]) == 2
    # And left the 3rd one with recency_weighted only
    assert len(aggregated_forecasts[question_1]) == 1
