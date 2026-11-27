"""
Prompt text and response schemas for AI question-link suggestions.

The wording was evaluated against real Metaculus questions (PR #5150);
re-measure before changing it.
"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel

from questions.models import Question

SCAN_QUESTION = (
    "How strongly does the outcome of `candidate_question` bear on the outcome of "
    "`target_question`?"
)
SCAN_LEVELS = [
    "Unrelated.",
    "Same broad topic only; its outcome is nearly irrelevant to the target forecast.",
    "Weak but real link: a plausible mechanism or shared driver; a small update.",
    "Clear link: knowing its outcome would noticeably update the target forecast.",
    "Strong link: one outcome largely determines, or directly drives, the other.",
]


def scan_state(target: Question) -> dict:
    state = {"title": target.title, "type": type_label(target)}
    rc = (target.resolution_criteria or "").strip()
    if rc:
        state["resolution_criteria"] = rc[:700]
    return {"target_question": state}


def scan_question(candidate: Question) -> dict:
    return {
        "type": "score",
        "instructions": {
            "candidate_question": {
                "title": candidate.title,
                "type": type_label(candidate),
            },
            "question": SCAN_QUESTION,
        },
        "criteria": SCAN_LEVELS,
    }


RERANK_SYSTEM_PROMPT = """\
You help forecasters on Metaculus set up "question links". A question link records that the outcome of one
forecasting question causally affects the outcome of another, so a forecaster can keep the two forecasts
coherent. You will see a TARGET question and candidate questions found by a search. For every candidate:

1. grade (0-4): how valuable a link to the TARGET would be.
   4 = one outcome largely determines or directly drives the other (incl. the same event with another
       threshold or deadline, a direct prerequisite, nested or mutually exclusive outcomes)
   3 = learning the candidate's outcome would make a well-informed forecaster noticeably update the TARGET
   2 = weak but real: a plausible mechanism or shared driver worth a small update
   1 = same topic only; the outcome is nearly irrelevant to the TARGET
   0 = unrelated
   Judge the outcomes, not wording overlap. Most candidates deserve 0-1; reserve 3-4 for links a
   forecaster would genuinely want.
2. How the link would be configured on Metaculus (fill these in even for low grades):
   - cause: which question's outcome drives the other's: "target" or "candidate". If neither clearly
     drives the other, pick the one that is more upstream (the more general driver, or the one resolving first).
   - sign: "positive" if the cause resolving Yes (for numeric questions: higher; for date questions: sooner)
     makes the other question more likely to resolve Yes (higher / sooner); otherwise "negative".
   - strength of the effect of the cause on the other question: "a_bit", "mid" or "a_lot".
"""


class CandidateGrade(BaseModel):
    id: int
    grade: Literal[0, 1, 2, 3, 4]
    cause: Literal["target", "candidate"]
    sign: Literal["positive", "negative"]
    strength: Literal["a_bit", "mid", "a_lot"]


class RerankResponse(BaseModel):
    candidates: list[CandidateGrade]


def rerank_user_message(target: Question, candidates: list[Question]) -> str:
    rc = (target.resolution_criteria or "").strip()[:1200]
    description = (target.description or "").strip()[:500]
    head = (
        f"TARGET (id {target.id}, {type_label(target)}): {target.title}\n"
        f"resolution criteria: {rc}\n"
    )
    if description:
        head += f"background: {description}\n"
    lines = []
    for c in candidates:
        line = f"- id {c.id} ({type_label(c)}): {c.title}"
        excerpt = " ".join(_resolution_criteria(c).split())[:300]
        if excerpt:
            line += f"\n    resolves: {excerpt}"
        lines.append(line)
    return (
        head
        + "\nCANDIDATES:\n"
        + "\n".join(lines)
        + "\n\nGrade and configure every candidate."
    )


def type_label(question: Question) -> str:
    """Question type plus its range, e.g. "numeric 0..100 %" or "date 2025-01-01..2040-01-01"."""
    q_type = question.type
    if q_type == Question.QuestionType.BINARY:
        return "binary (YES/NO)"
    lo, hi = question.range_min, question.range_max
    if lo is None or hi is None:
        return q_type
    if q_type == Question.QuestionType.DATE:
        return f"date {_date(lo)}..{_date(hi)}"
    label = f"{q_type} {lo:g}..{hi:g}"
    return f"{label} {question.unit}" if question.unit else label


def _resolution_criteria(question: Question) -> str:
    """Group subquestions often leave theirs empty and inherit the group's."""
    if question.resolution_criteria:
        return question.resolution_criteria
    return (question.group.resolution_criteria or "") if question.group_id else ""


def _date(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=UTC).date().isoformat()
