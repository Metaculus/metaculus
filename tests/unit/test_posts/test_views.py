from datetime import datetime

from django.utils import timezone
from django.utils.timezone import make_aware
from freezegun import freeze_time
from rest_framework import status
from rest_framework.reverse import reverse

from posts.models import Post, PostUserSnapshot, PostSubscription
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_site_main_project
from questions.models import Question
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question
from tests.unit.test_questions.conftest import *  # noqa


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
                    "scaling": {
                        "range_min": 1,
                        "range_max": 100,
                        "zero_point": None,
                    },
                    "open_upper_bound": True,
                    "open_time": "2024-04-01T00:00:00Z",
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
        assert response.data["scheduled_close_time"] == "2024-05-01T00:00:00Z"
        assert (
            response.data["question"]["scheduled_close_time"] == "2024-05-01T00:00:00Z"
        )

    def test_create__group(self, user1, user1_client):
        response = user1_client.post(
            self.url,
            {
                "title": "Post Of Group",
                "projects": {},
                "default_project": get_site_main_project().pk,
                "group_of_questions": {
                    "subquestions_order": "MANUAL",
                    "questions": [
                        {
                            "title": "Question #1",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                            "open_time": "2024-04-01T00:00:00Z",
                            "scheduled_close_time": "2024-05-01T00:00:00Z",
                            "scheduled_resolve_time": "2024-05-11T00:00:00Z",
                            "group_rank": 0,
                        },
                        {
                            "title": "Question #2",
                            "description": "Question description #1",
                            "type": "binary",
                            "possibilities": {"type": "binary"},
                            "resolution": "1.0",
                            "open_time": "2024-04-01T00:00:00Z",
                            "scheduled_close_time": "2024-05-05T00:00:00Z",
                            "scheduled_resolve_time": "2024-05-10T00:00:00Z",
                            "group_rank": 1,
                        },
                    ],
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
        question = create_question(
            title_original="Condition Question",
            question_type=Question.QuestionType.BINARY,
            open_time=timezone.make_aware(datetime(2024, 3, 1)),
            scheduled_close_time=timezone.make_aware(datetime(2024, 5, 1)),
            scheduled_resolve_time=timezone.make_aware(datetime(2024, 5, 2)),
        )
        factory_post(
            author=user1, question=question, short_title_original="Condition URL Title"
        )

        question_numeric = create_question(
            title_original="Child Question",
            question_type=Question.QuestionType.NUMERIC,
            open_time=timezone.make_aware(datetime(2024, 3, 1)),
            scheduled_close_time=timezone.make_aware(datetime(2024, 4, 1)),
            scheduled_resolve_time=timezone.make_aware(datetime(2024, 4, 2)),
        )
        factory_post(
            author=user1,
            question=question_numeric,
            short_title_original="Child URL Title",
        )

        response = user1_client.post(
            self.url,
            {
                "default_project": get_site_main_project().pk,
                "projects": {},
                "conditional": {
                    "condition_id": question.id,
                    "condition_child_id": question_numeric.id,
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        assert response.data["title"] == "Condition Question → Child Question"
        assert response.data["short_title"] == "Conditional Child URL Title"
        assert response.data["author_id"] == user1.id
        assert (
            response.data["conditional"]["question_yes"]["title"]
            == "Condition Question (Yes) → Child Question"
        )
        assert response.data["conditional"]["question_yes"]["type"] == "numeric"
        assert (
            response.data["conditional"]["question_no"]["title"]
            == "Condition Question (No) → Child Question"
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
                    "scaling": {
                        "range_min": 1,
                        "range_max": 100,
                        "zero_point": None,
                    },
                    "open_upper_bound": True,
                    "open_time": "2024-04-01T00:00:00Z",
                    "scheduled_close_time": "2024-05-01T00:00:00Z",
                    "scheduled_resolve_time": "2024-05-02T00:00:00Z",
                },
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        post_id = response.data["id"]
        Post.objects.filter(pk=post_id).update(
            curation_status=Post.CurationStatus.APPROVED,
            published_at=timezone.now(),
        )

        # Check is available for all users
        assert Post.objects.filter(id=post_id).filter_permission().exists()
        assert Post.objects.filter(id=post_id).filter_permission(user=user2).exists()
        assert Post.objects.filter(id=post_id).filter_permission(user=user1).exists()


class TestPostUpdate:
    def test_dont_clear_tags(self, user1, user1_client):
        tag = factory_project(type=Project.ProjectTypes.TAG)
        category = factory_project(type=Project.ProjectTypes.CATEGORY)
        tournament = factory_project(type=Project.ProjectTypes.TOURNAMENT)

        post = factory_post(
            author=user1,
            projects=[tag, category, tournament],
            default_project=get_site_main_project(),
            curation_status=Post.CurationStatus.DRAFT,
        )

        category_updated = factory_project(type=Project.ProjectTypes.CATEGORY)

        data = {
            "categories": [category_updated.pk],
            "title": "Will SpaceX land people on Mars before 2030?",
            "short_title": "SpaceX Lands People on Mars by 2030",
        }
        response = user1_client.put(
            reverse("post-update", kwargs={"pk": post.pk}), data, format="json"
        )

        assert response.status_code == 200

        post.refresh_from_db()

        # Assert other projects were not updated
        assert set(post.projects.all()) == {tag, category_updated, tournament}
        # Ensure default project
        assert post.default_project == get_site_main_project()


def test_posts_list(anon_client):
    response = anon_client.get("/api/posts/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data


def test_posts_list__filters(user1, user1_client):
    url = reverse("post-list")

    factory_post(
        author=user1,
        published_at=make_aware(
            datetime(2024, 10, 1),
        ),
        scheduled_resolve_time=make_aware(datetime(2024, 10, 14)),
    )

    assert len(user1_client.get(url).data["results"]) == 1
    assert (
        len(user1_client.get(f"{url}?published_at__lt=2024-10-01").data["results"]) == 0
    )
    assert (
        len(user1_client.get(f"{url}?published_at__lt=2024-10-02").data["results"]) == 1
    )
    assert (
        len(
            user1_client.get(f"{url}?scheduled_resolve_time__gte=2024-10-05").data[
                "results"
            ]
        )
        == 1
    )
    assert (
        len(
            user1_client.get(
                f"{url}?scheduled_resolve_time__gte=2024-10-05&scheduled_resolve_time__lt=2024-10-15"
            ).data["results"]
        )
        == 1
    )
    assert (
        len(
            user1_client.get(
                f"{url}?scheduled_resolve_time__gte=2024-10-05&scheduled_resolve_time__lt=2024-10-14"
            ).data["results"]
        )
        == 0
    )


def test_post_detail(anon_client, user1, user1_client):
    post = factory_post(
        author=user1,
        projects=[
            factory_project(
                name_original="Project: Forecaster",
                type=Project.ProjectTypes.TOURNAMENT,
                default_permission=ObjectPermission.FORECASTER,
            ),
            factory_project(
                name_original="Project: Viewer",
                type=Project.ProjectTypes.TOURNAMENT,
                default_permission=ObjectPermission.VIEWER,
            ),
            factory_project(
                name_original="Project: Private",
                type=Project.ProjectTypes.TOURNAMENT,
                default_permission=None,
                override_permissions={
                    user1.id: ObjectPermission.FORECASTER,
                },
            ),
        ],
    )

    url = f"/api/posts/{post.pk}/"
    response = anon_client.get(url)

    assert response.status_code == status.HTTP_200_OK

    # Check projects visibility
    assert {x["name"] for x in response.data["projects"]["tournament"]} == {
        "Project: Viewer",
        "Project: Forecaster",
    }

    # Test for authorized user
    response = user1_client.get(url)
    assert response.status_code == status.HTTP_200_OK

    # Check projects visibility
    assert {x["name"] for x in response.data["projects"]["tournament"]} == {
        "Project: Viewer",
        "Project: Forecaster",
        "Project: Private",
    }


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
    assert snapshot.viewed_at == make_aware(datetime(2024, 6, 1))

    factory_comment(on_post=post)

    # New view
    with freeze_time("2024-06-02"):
        user1_client.post(reverse("post-mark-read", kwargs={"pk": post.pk}))

    snapshot = PostUserSnapshot.objects.filter(post_id=post.pk).get()
    assert snapshot.user_id == user1.id
    assert snapshot.comments_count == 2
    assert snapshot.viewed_at == make_aware(datetime(2024, 6, 2))


@freeze_time("2024-09-17T12:44Z")
def test_post_subscriptions_update(user1, user1_client):
    post = factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime(2024, 6, 1)),
        scheduled_resolve_time=make_aware(datetime(2024, 6, 1)),
    )

    # Create subscriptions
    data = [
        {"type": "new_comments", "comments_frequency": 10},
        {"type": "status_change"},
        {"type": "milestone", "milestone_step": 0.2},
        {"type": "cp_change", "cp_change_threshold": 0.25},
        {
            "type": "specific_time",
            "next_trigger_datetime": "2024-10-13T16:59:14Z",
            "recurrence_interval": "",
        },
    ]

    url = reverse("post-subscriptions", kwargs={"pk": post.pk})
    response = user1_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED

    qs = PostSubscription.objects.filter(post_id=post.pk, user=user1)
    assert qs.count() == 5

    created_new_comments = qs.get(type="new_comments")
    created_status_change = qs.get(type="status_change")
    qs.get(type="milestone")
    created_cp_change = qs.get(type="cp_change")
    created_specific_time = qs.get(type="specific_time")

    # Update subscriptions
    data = [
        # No change
        {
            "id": created_new_comments.pk,
            "type": "new_comments",
            "comments_frequency": 10,
        },
        # No change
        {"id": created_status_change.pk, "type": "status_change"},
        # CP change was changed
        {"id": created_cp_change.pk, "type": "cp_change", "cp_change_threshold": 0.4},
        # No change extra
        {
            "id": created_specific_time.pk,
            "type": "specific_time",
            "next_trigger_datetime": "2024-10-13T16:59:14Z",
            "recurrence_interval": "",
        },
        # Adding extra reminder
        {
            "next_trigger_datetime": "2024-10-15T16:59:14Z",
            "recurrence_interval": "7 00:00:00",
            "type": "specific_time",
        },
        # Milestone will be deleted
    ]

    with freeze_time("2024-09-17T13:44Z"):
        response = user1_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert qs.count() == 5

    # Not changed
    updated_new_comments = qs.get(type="new_comments")
    assert updated_new_comments.edited_at == created_new_comments.edited_at
    assert (
        updated_new_comments.comments_frequency
        == created_new_comments.comments_frequency
        == 10
    )

    # TODO: remove create_at for specific time notification
    updated_status_change = qs.get(type="status_change")
    assert updated_status_change.edited_at == created_status_change.edited_at

    # CP changes
    updated_cp_change = qs.get(type="cp_change")
    assert updated_cp_change.pk != created_cp_change.pk
    assert updated_cp_change.edited_at != created_cp_change.edited_at
    assert updated_cp_change.cp_change_threshold == 0.4

    # Date changes
    updated_specific_time = qs.get(type="specific_time", pk=created_specific_time.pk)
    assert updated_specific_time.edited_at == created_specific_time.edited_at

    # And extra change:
    new_specific_time = qs.exclude(pk=created_specific_time.pk).get(
        type="specific_time"
    )
    assert str(new_specific_time.recurrence_interval) == "7 days, 0:00:00"

    assert not qs.filter(type="milestone").exists()

    # And then delete specific time notification
    # Update subscriptions
    data = [
        {
            "id": created_new_comments.pk,
            "type": "new_comments",
            "comments_frequency": 10,
        },
        {"id": created_status_change.pk, "type": "status_change"},
        {"id": created_cp_change.pk, "type": "cp_change", "cp_change_threshold": 0.4},
        # Keep extra reminder
        {
            "id": new_specific_time.pk,
            "next_trigger_datetime": "2024-10-15T16:59:14Z",
            "recurrence_interval": "7 00:00:00",
            "type": "specific_time",
        },
    ]
    response = user1_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert qs.count() == 4

    assert qs.get(type="specific_time").pk == new_specific_time.pk


@freeze_time("2024-11-17T12:00Z")
def test_approve_post(user1, user1_client, question_binary):
    tournament = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        override_permissions={user1.pk: ObjectPermission.ADMIN},
    )
    post = factory_post(
        author=user1,
        curation_status=Post.CurationStatus.PENDING,
        default_project=tournament,
        question=question_binary,
    )

    url = reverse("post-approve", kwargs={"pk": post.pk})
    response = user1_client.post(
        url,
        {
            "published_at": "2024-11-17T11:00Z",
            "open_time": "2024-11-17T11:00Z",
            "cp_reveal_time": "2024-11-18T11:00Z",
            "scheduled_close_time": "2024-11-19T11:00Z",
            "scheduled_resolve_time": "2024-11-19T11:00Z",
        },
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    post.refresh_from_db()

    assert post.question.open_time == make_aware(datetime(2024, 11, 17, 11))
    assert post.question.cp_reveal_time == make_aware(datetime(2024, 11, 18, 11))
    assert post.open_time == make_aware(datetime(2024, 11, 17, 11))

    # Approve again
    response = user1_client.post(
        url,
        {
            "published_at": "2024-11-17T11:00Z",
            "open_time": "2024-11-17T11:00Z",
            "cp_reveal_time": "2024-11-18T11:00Z",
            "scheduled_close_time": "2024-11-19T11:00Z",
            "scheduled_resolve_time": "2024-11-19T11:00Z",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_repost(user1, user1_client, user2, user2_client, question_binary):
    default_project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        override_permissions={user1.pk: ObjectPermission.ADMIN},
    )

    post = factory_post(
        author=user1,
        curation_status=Post.CurationStatus.PENDING,
        default_project=default_project,
        question=question_binary,
    )

    target_tournament = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        override_permissions={user1.pk: ObjectPermission.CURATOR},
    )

    url = reverse("post-repost", kwargs={"pk": post.pk})

    # Case 1: user2 does not have permissions to repost
    response = user2_client.post(url, {"project_id": target_tournament.pk})
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Case 2: post already has this project
    response = user1_client.post(url, {"project_id": default_project.pk})
    assert response.status_code == status.HTTP_204_NO_CONTENT
    post.refresh_from_db()
    assert default_project not in post.projects.all()
    assert post.default_project == default_project

    # Case 3: user successfully reposts
    response = user1_client.post(url, {"project_id": target_tournament.pk})
    assert response.status_code == status.HTTP_204_NO_CONTENT
    post.refresh_from_db()
    assert target_tournament in post.projects.all()


def test_post_vote(user1, user1_client, user2_client, post_binary_public):
    url = reverse("post-vote", kwargs={"pk": post_binary_public.pk})

    def make_vote(client, direction):
        response = client.post(url, {"direction": direction}, format="json")
        assert response.status_code == status.HTTP_200_OK

        return response.json()["score"]

    assert make_vote(user1_client, 1) == 1
    assert make_vote(user1_client, 1) == 1
    assert make_vote(user1_client, None) == 0
    assert make_vote(user1_client, -1) == -1
    assert make_vote(user2_client, -1) == -2
    assert make_vote(user2_client, 1) == 0


def test_post_vote__private(user1, user1_client, user2_client):
    """
    Ensure users can't vote on post they don't have access to
    """

    private_post = factory_post(
        author=user1,
        default_project=factory_project(
            type=Project.ProjectTypes.TOURNAMENT,
            default_permission=None,
        ),
    )
    url = reverse("post-vote", kwargs={"pk": private_post.pk})

    # Allowed
    response = user1_client.post(url, {"direction": 1}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["score"] == 1

    # Denied
    response = user2_client.post(url, {"direction": 1}, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN
