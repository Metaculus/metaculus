from tests.fixtures import *  # noqa
from tests.test_comments.factories import factory_comment
from tests.test_posts.factories import factory_post


def test_threaded_pagination(user2, user1_client):
    post = factory_post(author=user2)

    # Page 1
    c1 = factory_comment(author=user2, on_post=post)
    c2 = factory_comment(author=user2, on_post=post)
    c3 = factory_comment(author=user2, on_post=post)

    # Child comments
    # 2.1
    c2_1 = factory_comment(author=user2, on_post=post, parent=c2)
    # 2.2
    c2_2 = factory_comment(author=user2, on_post=post, parent=c2)
    # 2.2.1
    c2_2_1 = factory_comment(author=user2, on_post=post, parent=c2_2)

    # Page 2
    c4 = factory_comment(author=user2, on_post=post)
    c5 = factory_comment(author=user2, on_post=post)
    c4_1 = factory_comment(author=user2, on_post=post, parent=c4)
    c4_1_1 = factory_comment(author=user2, on_post=post, parent=c4_1)

    response = user1_client.get(
        f"/api/comments?limit=3&sort=created_at&use_root_comments_pagination=true"
    )

    # Check pagination
    assert response.data["total_count"] == 10
    # Has total of 5 root comments
    assert response.data["count"] == 5

    assert {x["id"] for x in response.data["results"]} == {
        c1.pk,
        c2.pk,
        c3.pk,
        c2_1.pk,
        c2_2_1.pk,
        c2_2.pk,
    }

    response = user1_client.get(response.data["next"])
    assert response.data["total_count"] == 10
    assert response.data["count"] == 5
    assert not response.data["next"]

    assert {x["id"] for x in response.data["results"]} == {
        c4.pk,
        c5.pk,
        c4_1.pk,
        c4_1_1.pk,
    }
