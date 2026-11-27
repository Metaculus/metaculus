from datetime import timedelta

from django.utils import timezone
from django_dynamic_fixture import G

from coherence.models import (
    AggregateCoherenceLink,
    AggregateCoherenceLinkVote,
    CoherenceLink,
    CoherenceLinkSuggestion,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_aggregate_coherence_link(
    *, question1=Question, question2=Question, **kwargs
) -> AggregateCoherenceLink:
    return G(
        AggregateCoherenceLink,
        **setdefaults_not_null(
            kwargs,
            question1=question1,
            question2=question2,
        ),
    )


def factory_agg_link_vote(
    *,
    aggregation: AggregateCoherenceLink = None,
    score: int = None,
    user: User = None,
    **kwargs,
) -> AggregateCoherenceLinkVote:
    return G(
        AggregateCoherenceLinkVote,
        **setdefaults_not_null(kwargs, aggregation=aggregation, score=score, user=user),
    )


def factory_coherence_link(
    *, question1=None, question2=None, user=None, **kwargs
) -> CoherenceLink:
    return G(
        CoherenceLink,
        **setdefaults_not_null(
            kwargs,
            question1=question1,
            question2=question2,
            user=user,
        ),
    )


def active_post_kwargs():
    now = timezone.now()
    return {
        "open_time": now - timedelta(days=1),
        "scheduled_close_time": now + timedelta(days=30),
        "published_at": now - timedelta(days=1),
    }


def make_question(question_type=Question.QuestionType.BINARY, project=None, **q_kwargs):
    question = create_question(question_type=question_type, **q_kwargs)
    factory_post(question=question, default_project=project, **active_post_kwargs())
    return question


def store_suggestions(target, *candidates, grade=3) -> CoherenceLinkSuggestion:
    return CoherenceLinkSuggestion.objects.create(
        target_question=target,
        computed_at=timezone.now(),
        suggestions=[
            {
                "question_id": c.id,
                "grade": grade,
                "target_is_cause": False,
                "direction": 1,
                "strength": 2,
            }
            for c in candidates
        ],
    )
