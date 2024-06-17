from rest_framework import status
from rest_framework.reverse import reverse

from posts.models import Post
from questions.models import Question
from tests.fixtures import *  # noqa
from tests.test_posts.factories import factory_post
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
                    "type": "numeric",
                    "possibilities": {"type": "binary"},
                    "resolution": "1.0",
                    "min": 1,
                    "max": 100,
                    "open_upper_bound": True,
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Question Post"
        assert response.data["author_id"] == user1.id
        assert response.data["question"]["title"] == "Question Post"
        assert response.data["question"]["type"] == "numeric"
        assert response.data["question"]["min"] == 1
        assert response.data["question"]["max"] == 100
        assert response.data["question"]["open_upper_bound"]

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

    def test_create__is_public__true(self, user1, user2, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Question Post",
                "projects": {},
                "question": {
                    "title": "Question Post",
                    "description": "Question description",
                    "type": "numeric",
                    "possibilities": {"type": "binary"},
                    "resolution": "1.0",
                    "min": 1,
                    "max": 100,
                    "open_upper_bound": True,
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        post_id = response.data["id"]

        # Check is available for all users
        assert Post.objects.filter(id=post_id).filter_permission().exists()
        assert Post.objects.filter(id=post_id).filter_permission(user=user2).exists()
        assert Post.objects.filter(id=post_id).filter_permission(user=user1).exists()


def test_posts_list(anon_client):
    response = anon_client.get("/api/posts")

    assert response.status_code == status.HTTP_200_OK
    assert response.data


def test_question_detail(anon_client, user1):
    post = factory_post(author=user1)

    url = f"/api/posts/{post.pk}/"
    response = anon_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data


def test_delete_post(user1_client, user1, user2_client):
    post = factory_post(author=user1)
    url = f"/api/posts/{post.pk}/delete/"

    # Try to delete by user who does not have access
    response = user2_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    response = user1_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Post.objects.filter(pk=post.pk).exists()
