"""
Tests for AI-suggested coherence links.

Covered (no real API calls):
  - staleness threshold formula
  - read returns empty when SUGGESTIONS_AI_ENABLED is False
  - read aggregates methods into a score (= count of active methods)
  - retired method names in the JSON are ignored at read time
  - non-symmetric read: a vote on target A→B never surfaces when reading B
  - replace_votes preserves the other method group and drops self-votes
  - a target deleted while its run is in flight is discarded quietly

Read-aggregation tests monkeypatch `_filter_visible` so they don't depend on
the test fixtures producing posts that pass `filter_active()`.
"""

from unittest import mock

import pytest

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import pipeline
from coherence.services.suggestions import read as read_mod
from coherence.services.suggestions.llm import LlmResult
from coherence.services.suggestions.read import get_suggestions_for_question
from coherence.services.suggestions.scheduler import staleness_days_threshold
from questions.models import Question
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question


pytestmark = pytest.mark.django_db

Method = CoherenceLinkSuggestion.Method


# ---------- staleness ----------


def test_staleness_threshold_extremes():
    # most popular: ~7 days. Just inside top 10%: ~17 days. Bottom: ~107 days.
    assert staleness_days_threshold(100.0) == pytest.approx(7.0)
    assert staleness_days_threshold(90.0) == pytest.approx(17.0)
    assert staleness_days_threshold(0.0) == pytest.approx(107.0)


def test_staleness_threshold_clamps():
    assert staleness_days_threshold(150.0) == pytest.approx(7.0)
    assert staleness_days_threshold(-10.0) == pytest.approx(107.0)


# ---------- replace_votes ----------


def test_replace_votes_preserves_other_group(question_binary, question_numeric):
    row = CoherenceLinkSuggestion.objects.create(
        target_question=question_binary,
        methods_by_candidate={
            str(question_numeric.id): [Method.LLM_BROAD, Method.SIMILAR],
        },
    )

    # Replacing FREE votes with nothing keeps the paid vote.
    row.replace_votes(Method.FREE, {})
    assert row.methods_by_candidate == {str(question_numeric.id): [Method.LLM_BROAD]}

    # Replacing PAID votes with a new set keeps nothing else.
    row.replace_votes(Method.PAID, {question_numeric.id: [Method.LLM_STRICT]})
    assert row.methods_by_candidate == {str(question_numeric.id): [Method.LLM_STRICT]}


def test_replace_votes_ignores_foreign_methods_and_self_votes(
    question_binary, question_numeric
):
    row = CoherenceLinkSuggestion.objects.create(target_question=question_binary)

    row.replace_votes(
        Method.FREE,
        {
            question_numeric.id: [Method.SIMILAR, Method.LLM_BROAD],  # paid ignored
            question_binary.id: [Method.SIMILAR],  # self-vote ignored
        },
    )
    assert row.methods_by_candidate == {str(question_numeric.id): [Method.SIMILAR]}


# ---------- failed runs keep previous votes ----------


def _run_with_methods(target, candidates, method_results):
    """Run the paid pipeline with each method mocked to a fixed LlmResult."""
    with mock.patch.dict(
        pipeline.methods.PAID_METHODS,
        {name: (lambda t, c, r=result: r) for name, result in method_results.items()},
    ):
        return pipeline.run_paid_methods_for_target(
            target.id, [target.id] + candidates, "hash"
        )


def test_fully_failed_run_keeps_previous_votes(question_binary, question_numeric):
    CoherenceLinkSuggestion.objects.create(
        target_question=question_binary,
        methods_by_candidate={str(question_numeric.id): [Method.LLM_BROAD]},
    )
    row = _run_with_methods(
        question_binary,
        [question_numeric.id],
        {name: LlmResult(error="api_error") for name in pipeline.PAID_METHOD_ORDER},
    )
    assert row.paid_run_status == CoherenceLinkSuggestion.PaidRunStatus.ERROR
    assert row.methods_by_candidate == {str(question_numeric.id): [Method.LLM_BROAD]}


def test_partially_failed_run_keeps_failed_methods_votes(
    question_binary, question_numeric
):
    other = create_question(question_type=Question.QuestionType.BINARY)
    CoherenceLinkSuggestion.objects.create(
        target_question=question_binary,
        methods_by_candidate={
            str(question_numeric.id): [Method.LLM_BROAD, Method.LLM_STRICT]
        },
    )
    row = _run_with_methods(
        question_binary,
        [question_numeric.id, other.id],
        {
            Method.LLM_BROAD: LlmResult(error="api_error"),
            Method.LLM_STRICT: LlmResult(candidate_ids=[other.id]),
            Method.LLM_SIMILAR_ONLY: LlmResult(error="api_error"),
        },
    )
    # broad's old vote survives its failure; strict's votes are replaced.
    assert row.methods_by_candidate == {
        str(question_numeric.id): [Method.LLM_BROAD],
        str(other.id): [Method.LLM_STRICT],
    }
    assert row.paid_run_status == CoherenceLinkSuggestion.PaidRunStatus.DONE


# ---------- deletion mid-run ----------


def test_target_deleted_while_llm_calls_in_flight(question_binary, question_numeric):
    """Deleting the target mid-run discards the results without raising."""

    def delete_target_then_vote(target, candidates):
        Question.objects.filter(id=question_binary.id).delete()
        return LlmResult(candidate_ids=[question_numeric.id])

    with mock.patch.dict(
        pipeline.methods.PAID_METHODS,
        {name: delete_target_then_vote for name in pipeline.PAID_METHOD_ORDER},
    ):
        result = pipeline.run_paid_methods_for_target(
            question_binary.id, [question_binary.id, question_numeric.id], "hash"
        )

    assert result is None
    assert not CoherenceLinkSuggestion.objects.filter(
        target_question_id=question_binary.id
    ).exists()


def test_free_refresh_of_deleted_target_is_quiet(question_binary):
    from django.db import connection

    stale_instance = Question.objects.get(id=question_binary.id)
    Question.objects.filter(id=question_binary.id).delete()
    # FK checks are INITIALLY DEFERRED on Postgres; make them fire inside
    # this test (as they would at commit in production) rather than at
    # pytest's teardown.
    with connection.cursor() as cursor:
        cursor.execute("SET CONSTRAINTS ALL IMMEDIATE")
    # Must not raise even though the instance references a vanished row.
    pipeline.refresh_free_votes_for_target(stale_instance, set())


# ---------- read aggregation ----------


def _store(target, methods_by_candidate):
    return CoherenceLinkSuggestion.objects.create(
        target_question=target,
        methods_by_candidate={
            str(cid): names for cid, names in methods_by_candidate.items()
        },
    )


@pytest.fixture
def bypass_visibility(monkeypatch):
    """Skip filter_active so tests don't depend on fixture-induced post state."""

    def _stub(candidate_ids, _user):
        return list(Question.objects.filter(id__in=candidate_ids))

    monkeypatch.setattr(read_mod, "_filter_visible", _stub)


def test_read_returns_empty_when_flag_off(question_binary, question_numeric, settings):
    settings.SUGGESTIONS_AI_ENABLED = False
    _store(question_binary, {question_numeric.id: [Method.LLM_BROAD]})
    assert get_suggestions_for_question(question_binary, user=None) == []


def test_read_aggregates_methods_into_score(
    question_binary, question_numeric, settings, bypass_visibility
):
    settings.SUGGESTIONS_AI_ENABLED = True
    _store(
        question_binary,
        {question_numeric.id: [Method.LLM_BROAD, Method.LLM_STRICT, Method.SIMILAR]},
    )
    suggestions = get_suggestions_for_question(question_binary, user=None)
    assert len(suggestions) == 1
    s = suggestions[0]
    assert s.question.id == question_numeric.id
    assert s.score == 3
    assert s.methods == sorted([Method.LLM_BROAD, Method.LLM_STRICT, Method.SIMILAR])


def test_read_ignores_retired_methods(
    question_binary, question_numeric, settings, bypass_visibility
):
    settings.SUGGESTIONS_AI_ENABLED = True
    _store(
        question_binary,
        {question_numeric.id: [Method.SIMILAR, "wildcard_sonnet_v0"]},
    )
    suggestions = get_suggestions_for_question(question_binary, user=None)
    assert len(suggestions) == 1
    # Score reflects only the active method.
    assert suggestions[0].score == 1
    assert suggestions[0].methods == [Method.SIMILAR]


def test_read_orders_by_score_descending(question_binary, settings, bypass_visibility):
    settings.SUGGESTIONS_AI_ENABLED = True
    cand_high = create_question(question_type=Question.QuestionType.BINARY)
    cand_low = create_question(question_type=Question.QuestionType.BINARY)
    _store(
        question_binary,
        {
            cand_high.id: [Method.LLM_BROAD, Method.LLM_STRICT],
            cand_low.id: [Method.SIMILAR],
        },
    )
    suggestions = get_suggestions_for_question(question_binary, user=None)
    assert len(suggestions) == 2
    assert suggestions[0].question.id == cand_high.id
    assert suggestions[0].score == 2
    assert suggestions[1].question.id == cand_low.id
    assert suggestions[1].score == 1


def test_read_no_symmetric_lookup(
    question_binary, question_numeric, settings, bypass_visibility
):
    """target A→B vote does NOT surface for target B (no mirroring)."""
    settings.SUGGESTIONS_AI_ENABLED = True
    _store(question_binary, {question_numeric.id: [Method.LLM_BROAD]})
    assert get_suggestions_for_question(question_numeric, user=None) == []
