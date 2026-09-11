"""
Eligibility tests for the AI-suggestion candidate pool and target list.

The rules under test (see coherence/services/suggestions/pool.py):
  - candidates: linkable type, unresolved, active post, non-conditional, PUBLIC
  - targets: same, except private posts are eligible too
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions.pool import build_pool
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question

pytestmark = pytest.mark.django_db


def _active_post_kwargs():
    now = timezone.now()
    return {
        "open_time": now - timedelta(days=1),
        "scheduled_close_time": now + timedelta(days=30),
        "published_at": now - timedelta(days=1),
    }


def _make_question(
    question_type=Question.QuestionType.BINARY, project=None, **q_kwargs
):
    question = create_question(question_type=question_type, **q_kwargs)
    factory_post(
        question=question,
        default_project=project,
        **_active_post_kwargs(),
    )
    return question


def test_active_public_binary_question_is_candidate_and_target():
    question = _make_question()
    pool = build_pool()
    assert question.id in pool.candidate_ids
    assert question.id in {t.question_id for t in pool.eligible_targets}


def test_multiple_choice_question_is_excluded():
    question = _make_question(
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["a", "b"],
        options_history=[("0001-01-01T00:00:00", ["a", "b"])],
    )
    pool = build_pool()
    assert question.id not in pool.candidate_ids
    assert question.id not in {t.question_id for t in pool.eligible_targets}


def test_resolved_question_is_excluded():
    question = _make_question(actual_resolve_time=timezone.now() - timedelta(days=1))
    pool = build_pool()
    assert question.id not in pool.candidate_ids
    assert question.id not in {t.question_id for t in pool.eligible_targets}


def test_unpublished_question_is_excluded():
    question = create_question(question_type=Question.QuestionType.BINARY)
    factory_post(
        question=question,
        curation_status="pending",
        **_active_post_kwargs(),
    )
    pool = build_pool()
    assert question.id not in pool.candidate_ids


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
    pool = build_pool()
    assert question.id not in pool.candidate_ids


def test_private_question_is_target_but_not_candidate():
    private_project = factory_project(default_permission=None)
    question = _make_question(project=private_project)
    pool = build_pool()
    assert question.id not in pool.candidate_ids
    assert question.id in {t.question_id for t in pool.eligible_targets}


def test_candidates_are_ordered_most_popular_first():
    quiet = _make_question()
    popular = _make_question()
    popular.post.forecasters_count = 500
    popular.post.save(update_fields=["forecasters_count"])
    pool = build_pool()
    assert pool.candidate_ids.index(popular.id) < pool.candidate_ids.index(quiet.id)


# ---------- endpoint permissions ----------
#
# Private questions are eligible suggestion targets, so the endpoint must
# never reveal their suggestions (or their existence) to users who can't
# see the question itself.


def _get_suggestions(client, question_id):
    return client.get(f"/api/coherence/question/{question_id}/suggested-links/")


def test_endpoint_serves_public_question_to_anonymous(client, settings):
    settings.SUGGESTIONS_AI_ENABLED = True
    question = _make_question()
    response = _get_suggestions(client, question.id)
    assert response.status_code == 200
    assert response.json() == {"data": []}


def test_endpoint_denies_private_question_to_anonymous(client, settings):
    settings.SUGGESTIONS_AI_ENABLED = True
    private_project = factory_project(default_permission=None)
    question = _make_question(project=private_project)
    CoherenceLinkSuggestion.objects.create(
        target_question=question,
        methods_by_candidate={"123": ["llm_broad"]},
    )
    response = _get_suggestions(client, question.id)
    assert response.status_code in (401, 403, 404)
    assert b"llm_broad" not in response.content
    assert b"123" not in response.content
