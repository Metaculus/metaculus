"""
Who gets AI link suggestions, and which questions may be suggested.

  - linkable (can be a target): linkable type, unresolved, on an active
    non-conditional post; private questions too, for users who can see them
  - suggested: linkable AND public
"""

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone

from coherence.services.suggestions import service
from coherence.services.suggestions.service import (
    linkable_questions,
    public_linkable_questions,
)
from projects.permissions import ObjectPermission
from questions.models import Question
from tests.unit.test_coherence.factories import (
    active_post_kwargs,
    make_question,
    store_suggestions,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question


def test_active_public_question_can_be_suggested():
    question = make_question()
    assert question in linkable_questions()
    assert question in public_linkable_questions()


def test_private_question_is_linkable_but_never_suggested():
    question = make_question(project=factory_project(default_permission=None))
    assert question in linkable_questions()
    assert question not in public_linkable_questions()


def test_multiple_choice_question_is_excluded():
    question = make_question(
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["a", "b"],
        options_history=[("0001-01-01T00:00:00", ["a", "b"])],
    )
    assert question not in linkable_questions()


def test_resolved_question_is_excluded():
    question = make_question(actual_resolve_time=timezone.now() - timedelta(days=1))
    assert question not in linkable_questions()


def test_unpublished_question_is_excluded():
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(question=question, curation_status="pending", **active_post_kwargs())
    assert question not in linkable_questions()


def test_closed_question_is_excluded():
    now = timezone.now()
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(
        question=question,
        open_time=now - timedelta(days=30),
        scheduled_close_time=now - timedelta(days=1),
        actual_close_time=now - timedelta(days=1),
        published_at=now - timedelta(days=30),
    )
    assert question not in linkable_questions()


@pytest.fixture
def enabled(settings):
    settings.QUESTION_LINK_SUGGESTIONS_ENABLED = True
    settings.OPENROUTER_API_KEY = "test-key"


def get(client, question):
    return client.get(f"/api/coherence/question/{question.id}/suggested-links/")


def test_endpoint_requires_login(anon_client, enabled):
    question = make_question()
    assert get(anon_client, question).status_code == 403


def test_endpoint_returns_suggestions_with_link_configuration(user1_client, enabled):
    target, candidate = make_question(), make_question()
    store_suggestions(target, candidate)

    response = get(user1_client, target)

    assert response.status_code == 200
    [entry] = response.json()["data"]
    assert entry["post"]["id"] == candidate.post_id
    assert entry["suggested_question_id"] == candidate.id
    assert entry["target_is_cause"] is False
    assert entry["direction"] == 1
    assert entry["strength"] == 2


def test_endpoint_returns_nothing_when_disabled(user1_client, enabled, settings):
    settings.QUESTION_LINK_SUGGESTIONS_ENABLED = False
    target = make_question()
    store_suggestions(target, make_question())
    assert get(user1_client, target).json() == {"data": []}


def test_endpoint_computes_nothing_for_bots(user1, user1_client, enabled):
    user1.is_bot = True
    user1.save()
    target = make_question()
    with mock.patch.object(service, "_compute") as compute:
        assert get(user1_client, target).json() == {"data": []}
    compute.assert_not_called()


def test_private_target_is_hidden_from_users_without_access(
    user1, user2_client, enabled
):
    project = factory_project(
        default_permission=None,
        override_permissions={user1: ObjectPermission.FORECASTER},
    )
    target = make_question(project=project)
    candidate = make_question()
    store_suggestions(target, candidate)
    with mock.patch.object(service, "_compute") as compute:
        response = get(user2_client, target)
    assert response.status_code == 403
    assert str(candidate.id).encode() not in response.content
    compute.assert_not_called()


def test_private_target_works_for_users_with_access(user1, user1_client, enabled):
    project = factory_project(
        default_permission=None,
        override_permissions={user1: ObjectPermission.FORECASTER},
    )
    target = make_question(project=project)
    candidate = make_question()
    store_suggestions(target, candidate)
    data = get(user1_client, target).json()["data"]
    assert [e["suggested_question_id"] for e in data] == [candidate.id]


def test_private_question_is_never_served_as_a_suggestion(user1, user1_client, enabled):
    # Even to someone who can see it, and even if it was public when the row
    # was computed.
    project = factory_project(
        default_permission=None,
        override_permissions={user1: ObjectPermission.FORECASTER},
    )
    target = make_question()
    public, private = make_question(), make_question(project=project)
    store_suggestions(target, public, private)
    data = get(user1_client, target).json()["data"]
    assert [e["suggested_question_id"] for e in data] == [public.id]


def test_post_that_went_private_after_selection_is_not_serialized(
    user1, user1_client, enabled
):
    project = factory_project(
        default_permission=None,
        override_permissions={user1: ObjectPermission.FORECASTER},
    )
    target, private = make_question(), make_question(project=project)
    # As if it was public when the service picked it, then went private.
    picked = service.Suggestion(
        question=private, target_is_cause=False, direction=1, strength=2
    )
    with mock.patch(
        "coherence.views.get_suggestions_for_question", return_value=[picked]
    ):
        assert get(user1_client, target).json() == {"data": []}


def test_private_questions_are_never_sent_to_the_models(user1, enabled):
    project = factory_project(
        default_permission=None,
        override_permissions={user1: ObjectPermission.FORECASTER},
    )
    target = make_question()
    public, private = make_question(), make_question(project=project)
    seen = []

    async def fake_rank(client, target_, candidates, similarity):
        seen.extend(c.id for c in candidates)
        return [], False

    with mock.patch.object(service, "_rank", fake_rank):
        service.get_suggestions_for_question(target)
    assert public.id in seen
    assert private.id not in seen
    assert target.id not in seen
