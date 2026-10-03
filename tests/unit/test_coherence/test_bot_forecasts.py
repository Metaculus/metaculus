import json

from rest_framework.reverse import reverse

from projects.models import Project
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question
from users.models import User

URL = reverse("post-coherence-bot-forecasts-comments")


def test_hidden_question_looks_missing(create_client_for_user):
    staff_client = create_client_for_user(
        User.objects.create(
            email="staff@metaculus.com", username="staff", is_staff=True
        )
    )
    hidden = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(
        question=hidden,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT, default_permission=None
        ),
    )

    bodies = []
    for question_id in (hidden.id, hidden.id + 1000):
        response = staff_client.post(
            URL,
            data=json.dumps(
                {
                    "forecasts": [{"question": question_id, "probability_yes": 0.5}],
                    "comments": [],
                }
            ),
            content_type="application/json",
        )
        assert response.status_code == 400
        bodies.append(response.content.decode().replace(str(question_id), "<id>"))

    assert bodies[0] == bodies[1]
