import pytest  # noqa
from django.urls import reverse

from comments.models import Comment
from comments.services.feed import get_comments_feed
from questions.services import create_forecast
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import factory_group_of_questions


class TestPagination:
    @pytest.fixture()
    def comments(self, user2):
        post = factory_post(author=user2)

        c1 = factory_comment(author=user2, on_post=post, text_original="Comment 1")
        c2 = factory_comment(author=user2, on_post=post, text_original="Comment 2")
        c3 = factory_comment(author=user2, on_post=post, text_original="Comment 3")

        # Child comments
        # 2.1
        c2_1 = factory_comment(
            author=user2, on_post=post, parent=c2, text_original="Comment 2.1"
        )
        # 2.2
        c2_2 = factory_comment(
            author=user2, on_post=post, parent=c2, text_original="Comment 2.2"
        )
        # 2.2.1
        c2_2_1 = factory_comment(
            author=user2, on_post=post, parent=c2_2, text_original="Comment 2.2.1"
        )

        # Page 2
        c4 = factory_comment(author=user2, on_post=post, text_original="Comment 4")
        c5 = factory_comment(author=user2, on_post=post, text_original="Comment 5")
        c4_1 = factory_comment(
            author=user2, on_post=post, parent=c4, text_original="Comment 4.1"
        )
        c4_1_1 = factory_comment(
            author=user2, on_post=post, parent=c4_1, text_original="Comment 4.1.1"
        )

        return {
            "c1": c1,
            "c2": c2,
            "c3": c3,
            "c2_1": c2_1,
            "c2_2": c2_2,
            "c2_2_1": c2_2_1,
            "c4": c4,
            "c5": c5,
            "c4_1": c4_1,
            "c4_1_1": c4_1_1,
        }

    def test_root_pagination(self, user2, user1_client, comments):
        response = user1_client.get(
            "/api/comments/?limit=3&sort=created_at&use_root_comments_pagination=true"
        )

        # Check pagination
        assert response.data["total_count"] == 10
        # Has total of 5 root comments
        assert response.data["count"] == 5

        assert {x["id"] for x in response.data["results"]} == {
            comments["c1"].pk,
            comments["c2"].pk,
            comments["c3"].pk,
            comments["c2_1"].pk,
            comments["c2_2_1"].pk,
            comments["c2_2"].pk,
        }

        response = user1_client.get(response.data["next"])
        assert response.data["total_count"] == 10
        assert response.data["count"] == 5
        assert not response.data["next"]

        assert {x["id"] for x in response.data["results"]} == {
            comments["c4"].pk,
            comments["c5"].pk,
            comments["c4_1"].pk,
            comments["c4_1_1"].pk,
        }

    def test_focus_on_comment__child(self, user2, user1_client, comments):
        response = user1_client.get(
            f"/api/comments/?limit=2&sort=created_at&use_root_comments_pagination=true"
            f"&focus_comment_id={comments['c4_1'].pk}"
        )

        # Pagination stays the same
        assert response.data["total_count"] == 10
        assert response.data["count"] == 5

        assert [x["id"] for x in response.data["results"]] == [
            # Focused comment go first
            comments["c4"].pk,
            comments["c4_1"].pk,
            comments["c4_1_1"].pk,
            # All other comments in the requested order
            comments["c1"].pk,
        ]

        # Check further pages won't include use_root_comments_pagination
        response = user1_client.get(response.data["next"])
        assert {x["id"] for x in response.data["results"]} == {
            comments["c2"].pk,
            comments["c2_1"].pk,
            comments["c2_2"].pk,
            comments["c2_2_1"].pk,
            comments["c3"].pk,
        }

        # Last Page
        response = user1_client.get(response.data["next"])
        assert {x["id"] for x in response.data["results"]} == {comments["c5"].pk}
        assert not response.data["next"]

    def test_focus_on_comment__root(self, user2, user1_client, comments):
        response = user1_client.get(
            f"/api/comments/?limit=2&sort=created_at&use_root_comments_pagination=true"
            f"&focus_comment_id={comments['c3'].pk}"
        )

        assert [x["id"] for x in response.data["results"]] == [
            # Focused comment go first
            comments["c3"].pk,
            comments["c1"].pk,
        ]

    def test_focus_on_comment__root__with_pinned_comment(
        self, user2, user1_client, comments
    ):
        c2 = comments["c2"]
        c2.is_pinned = True
        c2.save()

        # Should not show pinned comments if post filter is not defined
        response = user1_client.get(
            f"/api/comments/?limit=3&sort=-created_at&use_root_comments_pagination=true"
            f"&focus_comment_id={comments['c3'].pk}"
        )

        assert [x["id"] for x in response.data["results"]] == [
            comments["c3"].pk,
            comments["c4_1_1"].pk,
            comments["c4_1"].pk,
            comments["c5"].pk,
            comments["c4"].pk,
        ]

        # Now should show pinned comments
        response = user1_client.get(
            f"/api/comments/?limit=3&sort=-created_at&use_root_comments_pagination=true"
            f"&focus_comment_id={comments['c3'].pk}"
            f"&post={c2.on_post_id}"
        )

        assert [x["id"] for x in response.data["results"]] == [
            # Pinned comment go first
            comments["c2_2_1"].pk,
            comments["c2_2"].pk,
            comments["c2_1"].pk,
            comments["c2"].pk,
            # Focused one
            comments["c3"].pk,
            # All other ordered by -created_at
            comments["c5"].pk,
        ]


def test_get_comments_feed_permissions(user1, user2):
    private_post = factory_post(
        author=user2,
        default_project=factory_project(default_permission=None),
    )
    post = factory_post(author=user2)

    c1 = factory_comment(author=user2, on_post=private_post, text="Comment 1")
    c2 = factory_comment(author=user2, on_post=post, is_private=True, text="Comment 2")
    c3 = factory_comment(author=user2, on_post=post, text="Comment 3")

    factory_comment(author=user2, on_post=post, is_soft_deleted=True)

    assert {c.pk for c in get_comments_feed(Comment.objects.all())} == {
        c3.pk,
    }
    assert {c.pk for c in get_comments_feed(Comment.objects.all(), user=user1)} == {
        c3.pk,
    }
    assert {c.pk for c in get_comments_feed(Comment.objects.all(), user=user2)} == {
        c1.pk,
        c3.pk,
    }
    assert {
        c.pk
        for c in get_comments_feed(Comment.objects.all(), user=user2, is_private=True)
    } == {
        c2.pk,
    }


def test_upvote_own_comment(user1, user2, user2_client, user1_client):
    post = factory_post(author=user1)
    user1_comment = factory_comment(author=user1, on_post=post)
    url = reverse("comment-vote", kwargs={"pk": user1_comment.pk})

    response = user1_client.post(url, data={"vote": 1})
    assert response.status_code == 400

    response = user2_client.post(url, data={"vote": 1})
    assert response.status_code == 200


class TestCommentCreation:
    url = reverse("comment-create")

    @pytest.fixture()
    def post(self, user1, question_binary):
        return factory_post(author=user1, question=question_binary)

    def test_private(self, post, user1_client, user1, user2):
        response = user1_client.post(
            self.url,
            {"on_post": post.pk, "text": "Test comment for @user2", "is_private": True},
        )

        assert response.status_code == 201

        assert response.data["on_post"] == post.pk
        assert response.data["is_private"]
        assert response.data["text"] == "Test comment for @user2"
        assert response.data["author"]["id"] == user1.pk

    def test_with_mention(self, post, user1_client, user1, user2):
        response = user1_client.post(
            self.url, {"on_post": post.pk, "text": "Test comment for @user2"}
        )

        assert response.status_code == 201

        assert not response.data["is_private"]
        assert response.data["on_post"] == post.pk
        assert response.data["text"] == "Test comment for @user2"
        assert response.data["author"]["id"] == user1.pk
        assert response.data["mentioned_users"][0]["id"] == user2.pk

    def test_without_mention(self, post, user1_client, user1, user2):
        # Create w/o mention
        response = user1_client.post(
            self.url, {"on_post": post.pk, "text": "Test comment"}
        )

        assert response.data["text"] == "Test comment"
        assert not response.data["mentioned_users"]

    def test_with_forecast(self, user1, user1_client, post):
        create_forecast(question=post.question, user=user1, probability_yes=0.5)
        response = user1_client.post(
            self.url,
            {"on_post": post.pk, "text": "Test comment", "included_forecast": True},
        )
        assert response.data["included_forecast"]["probability_yes"] == 0.5

        # A new one
        create_forecast(question=post.question, user=user1, probability_yes=0.6)
        response = user1_client.post(
            self.url,
            {"on_post": post.pk, "text": "Test comment", "included_forecast": True},
        )
        assert response.data["included_forecast"]["probability_yes"] == 0.6

    def test_with_forecast__group_questions(
        self, user1, user2, user1_client, question_binary
    ):
        post = factory_post(
            author=user1, group_of_questions=factory_group_of_questions()
        )
        question_binary.group = post.group_of_questions
        question_binary.save()

        # Still works
        response = user1_client.post(
            self.url,
            {"on_post": post.pk, "text": "Test comment", "included_forecast": True},
        )
        assert response.status_code == 201

    def test_create_with_key_factor(self, user1_client, post, question_binary):
        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with Key Factors",
                "key_factors": [
                    {
                        "question_id": question_binary.pk,
                        "driver": {
                            "text": "Key Factor Driver",
                            "impact_direction": -1,
                        },
                    }
                ],
            },
            format="json",
        )

        assert response.status_code == 201

        assert response.data["on_post"] == post.pk
        assert response.data["text"] == "Comment with Key Factors"
        kf1 = response.data["key_factors"][0]
        assert kf1["question_id"] == question_binary.pk
        assert kf1["driver"]["text"] == "Key Factor Driver"
        assert kf1["driver"]["impact_direction"] == -1
