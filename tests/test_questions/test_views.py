from rest_framework import status

from questions.models import Question
from tests.fixtures import *  # noqa
from tests.test_projects.fixtures import *  # noqa


def test_question_list(anon_client):
    url = "/questions/list/"
    response = anon_client.post(url)

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)


def test_question_detail(anon_client):
    url = f"/questions/{Question.objects.first().pk}/"
    response = anon_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, dict)


def test_update_question(user1_client):
    url = f"/questions/{Question.objects.first().pk}/update/"
    data = {
        "title": "Updated Question",
        "description": "This is an updated question",
        "type": "binary",
    }
    response = user1_client.put(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, dict)


def test_delete_question(user1_client):
    url = f"/questions/{Question.objects.first().pk}/delete/"
    response = user1_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT


class TestCreateQuestionView:
    url = "/questions/create/"

    def test_happy_path(self, user1_client, tag1):
        data = {
            "title": "New Question",
            "description": "This is a new question",
            "type": "binary",
            "projects": {"tag": ["test tag"]},
        }
        response = user1_client.post(self.url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert isinstance(response.data, dict)

        # Ensure project relations
        question = Question.objects.get(pk=response.data["id"])

        # assert question.projects.all()
