import pytest  # noqa
from django.urls import reverse
from django_dynamic_fixture import G

from comments.models import Comment, KeyFactorBaseRate, KeyFactorDriver, KeyFactorNews
from comments.services.feed import get_comments_feed
from misc.models import ITNArticle
from questions.services import create_forecast
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_misc.factories import factory_itn_article
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

    def test_create_with_base_rate_frequency(self, user1_client, post):
        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with Frequency BaseRate",
                "key_factors": [
                    {
                        "base_rate": {
                            "type": "frequency",
                            "reference_class": "Tech startups in Silicon Valley",
                            "rate_numerator": 45,
                            "rate_denominator": 100,
                            "unit": "%",
                            "source": "SV Chamber of Commerce",
                        }
                    }
                ],
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["on_post"] == post.pk
        assert response.data["text"] == "Comment with Frequency BaseRate"

        kf = response.data["key_factors"][0]
        assert kf["base_rate"]["type"] == "frequency"
        assert kf["base_rate"]["reference_class"] == "Tech startups in Silicon Valley"
        assert kf["base_rate"]["rate_numerator"] == 45
        assert kf["base_rate"]["rate_denominator"] == 100
        assert kf["base_rate"]["unit"] == "%"
        assert kf["base_rate"]["source"] == "SV Chamber of Commerce"
        assert kf["driver"] is None

    def test_create_with_base_rate_trend(self, user1_client, post):
        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with Trend BaseRate",
                "key_factors": [
                    {
                        "base_rate": {
                            "type": "trend",
                            "reference_class": "Global AI chip demand",
                            "projected_value": 250.5,
                            "projected_by_year": 2025,
                            "unit": "billion USD",
                            "extrapolation": "other",
                            "based_on": "Moore's Law extrapolation",
                            "source": "Semiconductor Industry Association",
                        }
                    }
                ],
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["on_post"] == post.pk
        assert response.data["text"] == "Comment with Trend BaseRate"

        kf = response.data["key_factors"][0]
        assert kf["base_rate"]["type"] == "trend"
        assert kf["base_rate"]["reference_class"] == "Global AI chip demand"
        assert kf["base_rate"]["projected_value"] == 250.5
        assert kf["base_rate"]["projected_by_year"] == 2025
        assert kf["base_rate"]["unit"] == "billion USD"
        assert kf["base_rate"]["extrapolation"] == "other"
        assert kf["base_rate"]["based_on"] == "Moore's Law extrapolation"
        assert kf["base_rate"]["source"] == "Semiconductor Industry Association"
        assert kf["driver"] is None

    def test_create_with_mixed_key_factors(self, user1_client, post, question_binary):
        """Test creating a comment with both Driver and BaseRate key factors"""
        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with mixed Key Factors",
                "key_factors": [
                    {
                        "question_id": question_binary.pk,
                        "driver": {
                            "text": "Key Factor Driver",
                            "impact_direction": 1,
                        },
                    },
                    {
                        "base_rate": {
                            "type": "frequency",
                            "reference_class": "Historical baseline",
                            "rate_numerator": 30,
                            "rate_denominator": 100,
                            "unit": "%",
                            "source": "Historical data",
                        }
                    },
                ],
            },
            format="json",
        )

        assert response.status_code == 201
        assert len(response.data["key_factors"]) == 2

        # Check driver key factor
        driver_kf = next(kf for kf in response.data["key_factors"] if kf["driver"])
        assert driver_kf["driver"]["text"] == "Key Factor Driver"
        assert driver_kf["driver"]["impact_direction"] == 1
        assert driver_kf["base_rate"] is None

        # Check base rate key factor
        br_kf = next(kf for kf in response.data["key_factors"] if kf["base_rate"])
        assert br_kf["base_rate"]["type"] == "frequency"
        assert br_kf["base_rate"]["reference_class"] == "Historical baseline"
        assert br_kf["driver"] is None

    def test_create_with_news_manual_fields(self, user1_client, post):
        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with News",
                "key_factors": [
                    {
                        "news": {
                            "url": "https://example.com/article",
                            "title": "Breaking News",
                            "img_url": "https://example.com/img.jpg",
                            "source": "News Agency",
                            "impact_direction": 1,
                        }
                    }
                ],
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["on_post"] == post.pk
        assert response.data["text"] == "Comment with News"

        kf = response.data["key_factors"][0]
        assert kf["news"]["url"] == "https://example.com/article"
        assert kf["news"]["title"] == "Breaking News"
        assert kf["news"]["img_url"] == "https://example.com/img.jpg"
        assert kf["news"]["source"] == "News Agency"
        assert kf["driver"] is None
        assert kf["base_rate"] is None

    def test_create_with_news_from_itn_article(self, user1_client, post):
        itn_article = factory_itn_article(
            title="ITN News",
            url="https://itn.example.com/article",
            media_label="Reuters",
        )

        response = user1_client.post(
            self.url,
            {
                "on_post": post.pk,
                "text": "Comment with ITN Article",
                "key_factors": [
                    {
                        "news": {
                            "itn_article_id": itn_article.id,
                            "impact_direction": 1,
                        }
                    }
                ],
            },
            format="json",
        )

        assert response.status_code == 201
        kf = response.data["key_factors"][0]
        assert kf["news"]["url"] == itn_article.url
        assert kf["news"]["title"] == itn_article.title


class TestKeyFactorVoting:
    @pytest.fixture()
    def post(self, user1):
        return factory_post(author=user1)

    def test_vote_base_rate(self, user1, post, user2_client, user1_client):
        """Test voting on a BaseRate KeyFactor"""

        comment = factory_comment(author=user1, on_post=post)
        base_rate = KeyFactorBaseRate.objects.create(
            type=KeyFactorBaseRate.BaseRateType.FREQUENCY,
            reference_class="Test",
            rate_numerator=10,
            rate_denominator=20,
            unit="%",
            source="Test Source",
        )
        kf = factory_key_factor(comment=comment, base_rate=base_rate)

        url = reverse("key-factor-vote", kwargs={"pk": kf.pk})

        # User2 votes with 5
        response = user2_client.post(url, data={"vote": 5}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 1

        # User1 votes with 5
        response = user1_client.post(url, data={"vote": 5}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_vote_driver(self, user1, post, user2_client, user1_client):
        comment = factory_comment(author=user1, on_post=post)
        driver = KeyFactorDriver.objects.create(text="Test Driver")
        kf = factory_key_factor(comment=comment, driver=driver)

        url = reverse("key-factor-vote", kwargs={"pk": kf.pk})

        # User2 votes with 1
        response = user2_client.post(url, data={"vote": 1}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 1

        # User1 votes with 5
        response = user1_client.post(url, data={"vote": 5}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_vote_news(self, user1, post, user2_client, user1_client):
        comment = factory_comment(author=user1, on_post=post)
        kf = factory_key_factor(comment=comment, news=G(KeyFactorNews))

        url = reverse("key-factor-vote", kwargs={"pk": kf.pk})

        # User2 votes with 1
        response = user2_client.post(url, data={"vote": 1}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 1

        # User1 votes with 5
        response = user1_client.post(url, data={"vote": 5}, format="json")
        assert response.status_code == 200
        assert response.data["count"] == 2
