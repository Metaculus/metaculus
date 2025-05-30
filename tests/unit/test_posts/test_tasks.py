from posts.tasks import run_on_post_forecast
from projects.models import Project
from questions.models import Question
from questions.services import create_forecast_bulk
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


def test_run_on_post_forecast__project_counters(user1, question_binary):
    category = factory_project(type=Project.ProjectTypes.CATEGORY)
    tournament = factory_project(type=Project.ProjectTypes.TOURNAMENT)
    tournament_secondary = factory_project(type=Project.ProjectTypes.TOURNAMENT)

    post = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
        default_project=tournament,
        projects=[tournament_secondary, category],
    )
    post_2 = factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
        default_project=tournament,
    )

    create_forecast_bulk(
        user=user1, forecasts=[{"question": post.question, "probability_yes": 0.4}]
    )
    create_forecast_bulk(
        user=user1, forecasts=[{"question": post.question, "probability_yes": 0.4}]
    )
    create_forecast_bulk(
        user=user1, forecasts=[{"question": post_2.question, "probability_yes": 0.4}]
    )

    run_on_post_forecast(post.id)
    run_on_post_forecast(post_2.id)

    category.refresh_from_db()
    tournament.refresh_from_db()
    tournament_secondary.refresh_from_db()

    assert not category.forecasters_count
    assert not category.forecasts_count

    assert tournament.forecasts_count == 3
    assert tournament.forecasters_count == 1

    assert tournament_secondary.forecasts_count == 2
    assert tournament_secondary.forecasters_count == 1
