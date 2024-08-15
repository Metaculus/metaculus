from comments.models import Comment
from comments.services.feed import get_comments_feed
from tests.fixtures import *  # noqa
from tests.test_comments.factories import factory_comment
from tests.test_posts.factories import factory_post
from tests.test_projects.factories import factory_project


class TestPagination:
    @pytest.fixture()
    def comments(self, user2):
        post = factory_post(author=user2)

        c1 = factory_comment(author=user2, on_post=post, text="Comment 1")
        c2 = factory_comment(author=user2, on_post=post, text="Comment 2")
        c3 = factory_comment(author=user2, on_post=post, text="Comment 3")

        # Child comments
        # 2.1
        c2_1 = factory_comment(
            author=user2, on_post=post, parent=c2, text="Comment 2.1"
        )
        # 2.2
        c2_2 = factory_comment(
            author=user2, on_post=post, parent=c2, text="Comment 2.2"
        )
        # 2.2.1
        c2_2_1 = factory_comment(
            author=user2, on_post=post, parent=c2_2, text="Comment 2.2.1"
        )

        # Page 2
        c4 = factory_comment(author=user2, on_post=post, text="Comment 4")
        c5 = factory_comment(author=user2, on_post=post, text="Comment 5")
        c4_1 = factory_comment(
            author=user2, on_post=post, parent=c4, text="Comment 4.1"
        )
        c4_1_1 = factory_comment(
            author=user2, on_post=post, parent=c4_1, text="Comment 4.1.1"
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
            f"/api/comments/?limit=3&sort=created_at&use_root_comments_pagination=true"
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


def test_get_comments_feed_permissions(user1, user2):
    private_post = factory_post(
        author=user2,
        default_project=factory_project(default_permission=None),
    )
    post = factory_post(author=user2)

    c1 = factory_comment(author=user2, on_post=private_post, text="Comment 1")
    c2 = factory_comment(author=user2, on_post=post, is_private=True, text="Comment 2")
    c3 = factory_comment(author=user2, on_post=post, text="Comment 3")

    c_deleted = factory_comment(author=user2, on_post=post, is_soft_deleted=True)

    assert {c.pk for c in get_comments_feed(Comment.objects.all())} == {
        c_deleted.pk,
        c3.pk,
    }
    assert {c.pk for c in get_comments_feed(Comment.objects.all(), user=user1)} == {
        c_deleted.pk,
        c3.pk,
    }
    assert {c.pk for c in get_comments_feed(Comment.objects.all(), user=user2)} == {
        c1.pk,
        c2.pk,
        c3.pk,
        c_deleted.pk,
    }
