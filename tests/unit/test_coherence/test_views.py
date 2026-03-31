import pytest
from django.urls import reverse

from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from .factories import factory_aggregate_coherence_link, factory_coherence_link


def test_aggregate_question_link_vote(
    user1, user2_client, user1_client, question_binary, question_numeric
):
    factory_post(question=question_binary)
    factory_post(question=question_numeric)
    aggregation = factory_aggregate_coherence_link(
        question1=question_binary, question2=question_numeric
    )
    factory_coherence_link(
        question1=question_binary, question2=question_numeric, direction=1, strength=5
    )

    url = reverse("aggregate-links-votes", kwargs={"pk": aggregation.pk})

    # User2 votes with 1
    response = user2_client.post(url, data={"vote": 1}, format="json")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["strength"] == 5.0

    # User1 votes with -1
    response = user1_client.post(url, data={"vote": -1}, format="json")
    assert response.status_code == 200
    assert response.data["count"] == 2
    assert response.data["strength"] == pytest.approx(3.33, rel=0.1)

    # Check votes response
    url = reverse(
        "get-aggregate-links-for-question", kwargs={"pk": question_numeric.pk}
    )
    response = user2_client.get(url)

    assert response.data["data"][0]["freshness"] == pytest.approx(0.66, rel=0.1)
    votes_response = response.data["data"][0]["votes"]
    assert {x["score"] for x in votes_response["aggregated_data"]} == {1, -1}
