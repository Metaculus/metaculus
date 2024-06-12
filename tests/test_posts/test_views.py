from rest_framework import status
from rest_framework.reverse import reverse

from questions.models import Question
from tests.fixtures import *  # noqa
from tests.test_questions.factories import create_question


class TestPostCreate:
    url = reverse("post-create")

    def test_create__question(self, user1, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Question Post",
                "projects": {},
                "question": {
                    "title": "Question Post",
                    "description": "Question description",
                    "type": "binary",
                    "possibilities": {"type": "binary"},
                    "resolution": "1.0",
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Question Post"
        assert response.data["author_id"] == user1.id
        assert response.data["question"]["title"] == "Question Post"
        assert response.data["question"]["type"] == "binary"

    def test_create__group(self, user1, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Post Of Group",
                "projects": {},
                "group_of_questions": {
                    "questions": [
                        {
                            "title": "Question #1",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                        },
                        {
                            "title": "Question #2",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                        },
                    ]
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Post Of Group"
        assert response.data["author_id"] == user1.id
        questions = response.data["group_of_questions"]["questions"]

        assert {q["title"] for q in questions} == {"Question #1", "Question #2"}

    def test_create__conditional(self, user1, user1_client):
        question_binary = create_question(
            title="Starship Reaches Orbit in 2024?",
            question_type=Question.QuestionType.BINARY,
        )
        question_numeric = create_question(
            title="Starship Booster Tower Catch Attempt in 2024?",
            question_type=Question.QuestionType.NUMERIC,
        )

        response = user1_client.post(
            self.url,
            {
                "title": "Post Of Conditional",
                "projects": {},
                "conditional": {
                    "condition_id": question_binary.id,
                    "condition_child_id": question_numeric.id,
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Post Of Conditional"
        assert response.data["author_id"] == user1.id
        assert (
            response.data["conditional"]["question_yes"]["title"]
            == "Starship Reaches Orbit in 2024? (Yes) → Starship Booster Tower Catch Attempt in 2024?"
        )
        assert response.data["conditional"]["question_yes"]["type"] == "numeric"
        assert (
            response.data["conditional"]["question_no"]["title"]
            == "Starship Reaches Orbit in 2024? (No) → Starship Booster Tower Catch Attempt in 2024?"
        )
        assert response.data["conditional"]["question_no"]["type"] == "numeric"
