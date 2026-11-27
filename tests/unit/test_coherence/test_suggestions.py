"""
Computing, storing and showing AI link suggestions. No real API calls: the two
model stages (llm.scan, llm.rerank) are faked, except in the llm tests at the
bottom, which fake the OpenAI client instead.
"""

import asyncio
import logging
from datetime import timedelta
from unittest import mock

import httpx
import openai
import pytest
from django.core.cache import cache
from django.utils import timezone

from coherence.models import CoherenceLinkSuggestion
from coherence.services.suggestions import llm, service
from coherence.services.suggestions.prompts import CandidateGrade, RerankResponse
from tests.unit.test_coherence.factories import make_question, store_suggestions


@pytest.fixture(autouse=True)
def enabled(settings):
    settings.QUESTION_LINK_SUGGESTIONS_ENABLED = True
    settings.OPENROUTER_API_KEY = "test-key"
    for kind in ("scan", "rerank-model", "unavailable"):
        cache.delete(f"question-link-suggestions:alert:{kind}")


def grade(question, value, cause="candidate", sign="positive", strength="mid"):
    return CandidateGrade(
        id=question.id, grade=value, cause=cause, sign=sign, strength=strength
    )


def fake_models(scores=None, grades=(), models=None, scan_errors=(), rerank_errors=()):
    """Patch both model stages; returns the mocks to inspect their calls."""

    async def scan(client, target, candidates):
        return dict(scores or {}), list(scan_errors)

    async def rerank(client, target, shortlist):
        return (
            {g.id: g for g in grades},
            {llm.RERANK_MODEL} if models is None else models,
            list(rerank_errors),
        )

    scan_mock = mock.AsyncMock(side_effect=scan)
    rerank_mock = mock.AsyncMock(side_effect=rerank)
    return (
        mock.patch.object(llm, "scan", scan_mock),
        mock.patch.object(llm, "rerank", rerank_mock),
        scan_mock,
        rerank_mock,
    )


def run(target, **fakes):
    scan_patch, rerank_patch, scan_mock, rerank_mock = fake_models(**fakes)
    with scan_patch, rerank_patch:
        shown = service.get_suggestions_for_question(target)
    return shown, scan_mock, rerank_mock


def set_embedding(question, vector):
    question.post.embedding_vector = vector
    question.post.save(update_fields=["embedding_vector"])


def test_first_request_computes_ranks_and_stores():
    target = make_question()
    strong, clear, weak, junk = (make_question() for _ in range(4))

    shown, _, _ = run(
        target,
        grades=[
            grade(clear, 3),
            grade(junk, 1),
            grade(strong, 4, cause="target", sign="negative", strength="a_lot"),
            grade(weak, 2),
        ],
    )

    row = CoherenceLinkSuggestion.objects.get(target_question=target)
    assert not row.degraded
    # Best grade first; grades below 2 aren't stored at all.
    assert [s["question_id"] for s in row.suggestions] == [strong.id, clear.id, weak.id]
    assert row.suggestions[0] == {
        "question_id": strong.id,
        "grade": 4,
        "target_is_cause": True,
        "direction": -1,
        "strength": 5,
    }
    assert [s.question for s in shown] == [strong, clear, weak]


def test_shortlist_is_best_blend_plus_best_scores(monkeypatch):
    monkeypatch.setattr(service, "SHORTLIST_NEAR", 1)
    monkeypatch.setattr(service, "SHORTLIST_FAR", 1)
    target = make_question()
    similar, high_score, neither = make_question(), make_question(), make_question()
    set_embedding(target, [1.0, 0.0, 0.0])
    set_embedding(similar, [1.0, 0.0, 0.0])  # similarity 1
    set_embedding(high_score, [0.0, 1.0, 0.0])  # similarity 0
    set_embedding(neither, [0.0, 0.0, 1.0])  # similarity 0

    _, _, rerank_mock = run(
        target,
        scores={similar.id: 0.1, high_score.id: 0.9, neither.id: 0.2},
        grades=[grade(similar, 3)],
    )

    shortlist = rerank_mock.call_args.args[2]
    # 0.1 + 2 * 1 beats 0.9 + 2 * 0 on the blend; 0.9 is the best score left.
    assert shortlist == [similar, high_score]


def test_empty_pool_stores_an_empty_row_without_alerting(caplog):
    target = make_question()
    with caplog.at_level(logging.WARNING):
        shown, scan_mock, _ = run(target)
    assert shown == []
    scan_mock.assert_not_called()
    assert CoherenceLinkSuggestion.objects.get(target_question=target).suggestions == []
    assert not caplog.records


def test_shows_grades_3_and_4_up_to_the_cap(monkeypatch):
    monkeypatch.setattr(service, "MAX_SHOWN", 2)
    monkeypatch.setattr(service, "MIN_SHOWN", 1)
    target = make_question()
    candidates = [make_question() for _ in range(3)]
    store_suggestions(target, *candidates, grade=3)

    shown = service.get_suggestions_for_question(target)

    assert [s.question for s in shown] == candidates[:2]


def test_tops_up_with_grade_2_when_too_few_are_good():
    target = make_question()
    good, weak1, weak2 = make_question(), make_question(), make_question()
    row = store_suggestions(target, good, weak1, weak2, grade=2)
    row.suggestions[0]["grade"] = 3
    row.save()

    shown = service.get_suggestions_for_question(target)

    assert [s.question for s in shown] == [good, weak1, weak2]


def test_candidates_that_resolved_since_are_dropped():
    target = make_question()
    still_open, resolved = make_question(), make_question()
    store_suggestions(target, resolved, still_open)
    resolved.actual_resolve_time = timezone.now()
    resolved.save()

    shown = service.get_suggestions_for_question(target)

    assert [s.question for s in shown] == [still_open]


def test_fresh_row_is_reused():
    target = make_question()
    store_suggestions(target, make_question())
    _, scan_mock, _ = run(target)
    scan_mock.assert_not_called()


def test_stale_row_is_recomputed():
    target, candidate = make_question(), make_question()
    row = store_suggestions(target, candidate)
    row.computed_at = timezone.now() - service.STALE_AFTER - timedelta(hours=1)
    row.save()

    _, scan_mock, _ = run(target, grades=[grade(candidate, 4)])

    scan_mock.assert_called_once()
    row.refresh_from_db()
    assert row.suggestions[0]["grade"] == 4


def test_degraded_row_is_recomputed_after_a_day():
    target = make_question()
    row = store_suggestions(target, make_question())
    row.degraded = True
    row.computed_at = timezone.now() - service.DEGRADED_STALE_AFTER - timedelta(hours=1)
    row.save()
    _, scan_mock, _ = run(target)
    scan_mock.assert_called_once()


def test_failed_scan_falls_back_to_similarity_and_marks_degraded(caplog):
    target, candidate = make_question(), make_question()
    with caplog.at_level(logging.ERROR):
        shown, _, rerank_mock = run(
            target, scan_errors=[RuntimeError("down")], grades=[grade(candidate, 3)]
        )
    assert rerank_mock.call_args.args[2] == [candidate]
    assert [s.question for s in shown] == [candidate]
    assert CoherenceLinkSuggestion.objects.get(target_question=target).degraded
    assert "decision requests failed" in caplog.text


def test_fallback_rerank_model_marks_degraded():
    target, candidate = make_question(), make_question()
    run(target, grades=[grade(candidate, 3)], models={llm.RERANK_FALLBACK_MODEL})
    assert CoherenceLinkSuggestion.objects.get(target_question=target).degraded


def test_when_every_rerank_call_fails_nothing_is_stored(caplog):
    target = make_question()
    make_question()
    with caplog.at_level(logging.ERROR):
        shown, _, _ = run(target, rerank_errors=[RuntimeError("down")])
    assert shown == []
    assert not CoherenceLinkSuggestion.objects.filter(target_question=target).exists()
    assert "unavailable" in caplog.text


def test_when_every_rerank_call_fails_the_stale_row_is_served():
    target, candidate = make_question(), make_question()
    row = store_suggestions(target, candidate)
    row.computed_at = timezone.now() - service.STALE_AFTER - timedelta(hours=1)
    row.save()
    shown, _, _ = run(target, rerank_errors=[RuntimeError("down")])
    assert [s.question for s in shown] == [candidate]


def test_deadline_gives_up_and_stores_nothing(monkeypatch):
    monkeypatch.setattr(service, "DEADLINE_SECONDS", 0.05)
    target = make_question()
    make_question()

    async def slow_scan(client, target_, candidates):
        await asyncio.sleep(1)

    with mock.patch.object(llm, "scan", slow_scan):
        assert service.get_suggestions_for_question(target) == []
    assert not CoherenceLinkSuggestion.objects.filter(target_question=target).exists()


def test_alerts_reach_sentry_once_an_hour_per_kind(caplog):
    with caplog.at_level(logging.WARNING, logger=llm.logger.name):
        llm.alert("scan", "first")
        llm.alert("scan", "second")
        llm.alert("rerank-model", "other kind")
    assert [(r.levelno, r.getMessage()) for r in caplog.records] == [
        (logging.ERROR, "first"),
        (logging.WARNING, "second"),
        (logging.ERROR, "other kind"),
    ]


def refusal(question_id):
    request = httpx.Request("POST", llm.DECISIONS_URL)
    return openai.APIStatusError(
        f"The model refused to answer question c{question_id}",
        response=httpx.Response(502, request=request),
        body=None,
    )


def test_scan_drops_a_refused_question_and_normalises_scores():
    target, refused, answered = make_question(), make_question(), make_question()
    client = mock.Mock()
    client.post = mock.AsyncMock(
        side_effect=[
            refusal(refused.id),
            {"answers": {f"c{answered.id}": {"type": "score", "score": 3.0}}},
        ]
    )

    scores, errors = asyncio.run(llm.scan(client, target, [refused, answered]))

    assert scores == {answered.id: 0.75}
    assert errors == []
    retried_questions = client.post.call_args_list[1].kwargs["body"]["questions"]
    assert list(retried_questions) == [f"c{answered.id}"]


def parsed(*grades):
    message = mock.Mock(parsed=RerankResponse(candidates=list(grades)))
    return mock.Mock(choices=[mock.Mock(message=message)])


def test_rerank_falls_back_to_the_second_model(caplog):
    target, candidate = make_question(), make_question()
    client = mock.Mock()
    client.chat.completions.parse = mock.AsyncMock(
        side_effect=[RuntimeError("sol is down"), parsed(grade(candidate, 3))]
    )

    with caplog.at_level(logging.ERROR):
        grades, models, errors = asyncio.run(llm.rerank(client, target, [candidate]))

    assert grades[candidate.id].grade == 3
    assert models == {llm.RERANK_FALLBACK_MODEL}
    assert errors == []
    used = [c.kwargs["model"] for c in client.chat.completions.parse.call_args_list]
    assert used == [llm.RERANK_MODEL, llm.RERANK_FALLBACK_MODEL]
    assert "falling back" in caplog.text


def test_rerank_falls_back_when_the_first_model_grades_nothing():
    target, candidate = make_question(), make_question()
    client = mock.Mock()
    client.chat.completions.parse = mock.AsyncMock(
        side_effect=[parsed(), parsed(grade(candidate, 3))]
    )

    grades, models, errors = asyncio.run(llm.rerank(client, target, [candidate]))

    assert grades[candidate.id].grade == 3
    assert models == {llm.RERANK_FALLBACK_MODEL}
    assert errors == []


def test_rerank_asks_for_the_fast_tier_and_ignores_unknown_ids():
    target, candidate, stranger = make_question(), make_question(), make_question()
    client = mock.Mock()
    client.chat.completions.parse = mock.AsyncMock(
        return_value=parsed(grade(candidate, 3), grade(stranger, 4))
    )

    grades, _, _ = asyncio.run(llm.rerank(client, target, [candidate]))

    assert list(grades) == [candidate.id]
    extra_body = client.chat.completions.parse.call_args.kwargs["extra_body"]
    assert extra_body["service_tier"] == "fast"
