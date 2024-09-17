import datetime

from django.utils import timezone
from django.utils.timezone import make_aware
from freezegun import freeze_time
from rest_framework import status
from rest_framework.reverse import reverse

from posts.models import Post, PostUserSnapshot
from projects.services import get_site_main_project
from questions.models import Question
from tests.unit.fixtures import *  # noqa
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question


class TestPostCreate:
    url = reverse("post-create")

    def test_create__question(self, user1, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Question Post",
                "default_project": get_site_main_project().pk,
                "projects": {},
                "question": {
                    "title": "Question Post",
                    "description": "Question description",
                    "type": "numeric",
                    "possibilities": {"type": "binary"},
                    "resolution": "1.0",
                    "range_min": 1,
                    "range_max": 100,
                    "open_upper_bound": True,
                    "scheduled_close_time": "2024-05-01T00:00:00Z",
                    "scheduled_resolve_time": "2024-05-02T00:00:00Z",
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Question Post"
        assert response.data["author_id"] == user1.id
        assert response.data["question"]["title"] == "Question Post"
        assert response.data["question"]["type"] == "numeric"
        assert response.data["question"]["scaling"]["range_min"] == 1
        assert response.data["question"]["scaling"]["range_max"] == 100
        assert (
            response.data["scheduled_resolve_time"]
            == response.data["question"]["scheduled_resolve_time"]
        )
        assert (
            response.data["scheduled_close_time"]
            == response.data["question"]["scheduled_close_time"]
        )

    def test_create__group(self, user1, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Post Of Group",
                "projects": {},
                "default_project": get_site_main_project().pk,
                "group_of_questions": {
                    "questions": [
                        {
                            "title": "Question #1",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                            "scheduled_close_time": "2024-05-01T00:00:00Z",
                            "scheduled_resolve_time": "2024-05-11T00:00:00Z",
                        },
                        {
                            "title": "Question #2",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                            "scheduled_close_time": "2024-05-05T00:00:00Z",
                            "scheduled_resolve_time": "2024-05-10T00:00:00Z",
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

        # Ensure take max dates of these data
        assert response.data["scheduled_close_time"] == "2024-05-05T00:00:00Z"
        assert response.data["scheduled_resolve_time"] == "2024-05-11T00:00:00Z"

        assert {q["title"] for q in questions} == {"Question #1", "Question #2"}

    def test_create__conditional(self, user1, user1_client):
        question_binary = create_question(
            title="Starship Reaches Orbit in 2024?",
            question_type=Question.QuestionType.BINARY,
            scheduled_close_time=timezone.make_aware(datetime.datetime(2024, 5, 1)),
            scheduled_resolve_time=timezone.make_aware(datetime.datetime(2024, 5, 2)),
        )
        factory_post(author=user1, question=question_binary)

        question_numeric = create_question(
            title="Starship Booster Tower Catch Attempt in 2024?",
            question_type=Question.QuestionType.NUMERIC,
            scheduled_close_time=timezone.make_aware(datetime.datetime(2024, 4, 1)),
            scheduled_resolve_time=timezone.make_aware(datetime.datetime(2024, 4, 2)),
        )
        factory_post(author=user1, question=question_numeric)

        response = user1_client.post(
            self.url,
            {
                "title": "Post Of Conditional",
                "default_project": get_site_main_project().pk,
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
        assert response.data["scheduled_close_time"] == "2024-04-01T00:00:00Z"
        assert response.data["scheduled_resolve_time"] == "2024-05-02T00:00:00Z"

    def test_create__is_public__true(self, user1, user2, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Question Post",
                "projects": {},
                "default_project": get_site_main_project().pk,
                "question": {
                    "title": "Question Post",
                    "description": "Question description",
                    "type": "numeric",
                    "possibilities": {"type": "binary"},
                    "resolution": "1.0",
                    "range_min": 1,
                    "range_max": 100,
                    "open_upper_bound": True,
                    "scheduled_close_time": "2024-05-01T00:00:00Z",
                    "scheduled_resolve_time": "2024-05-02T00:00:00Z",
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        post_id = response.data["id"]
        Post.objects.filter(pk=post_id).update(
            curation_status=Post.CurationStatus.APPROVED
        )

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


def test_post_view_event_api_view(user1, user1_client):
    post = factory_post(author=user1)
    factory_comment(on_post=post)

    assert not PostUserSnapshot.objects.filter(pk=post.pk).exists()

    with freeze_time("2024-06-01"):
        user1_client.post(reverse("post-mark-read", kwargs={"pk": post.pk}))

    snapshot = PostUserSnapshot.objects.filter(post_id=post.pk).get()
    assert snapshot.user_id == user1.id
    assert snapshot.comments_count == 1
    assert snapshot.viewed_at == make_aware(datetime.datetime(2024, 6, 1))

    factory_comment(on_post=post)

    # New view
    with freeze_time("2024-06-02"):
        user1_client.post(reverse("post-mark-read", kwargs={"pk": post.pk}))

    snapshot = PostUserSnapshot.objects.filter(post_id=post.pk).get()
    assert snapshot.user_id == user1.id
    assert snapshot.comments_count == 2
    assert snapshot.viewed_at == make_aware(datetime.datetime(2024, 6, 2))
