import pytest
from freezegun import freeze_time

from coherence.services import (
    calculate_freshness_aggregate_coherence_link as calculate_freshness,
)
from tests.unit.test_questions.conftest import *  # noqa
from .factories import factory_aggregate_coherence_link, factory_agg_link_vote
from ..utils import datetime_aware


@freeze_time("2025-05-01")
def test_calculate_freshness_aggregate_coherence_link(
    question_binary, question_numeric, user1, user2
):
    aggregation = factory_aggregate_coherence_link(
        question1=question_binary, question2=question_numeric
    )

    assert calculate_freshness(question_binary, aggregation, []) == 0

    v1 = factory_agg_link_vote(aggregation=aggregation, user=user1, score=1)
    v2 = factory_agg_link_vote(aggregation=aggregation, user=user2, score=-1)

    assert calculate_freshness(question_binary, aggregation, [v1]) == pytest.approx(
        2.33, rel=0.1
    )

    assert calculate_freshness(question_binary, aggregation, [v1, v2]) == pytest.approx(
        0.66, rel=0.1
    )

    # Resolved
    question_numeric.actual_resolve_time = datetime_aware(2025, 4, 17)
    assert calculate_freshness(question_binary, aggregation, [v1]) == pytest.approx(
        2.33, rel=0.1
    )

    # Resolved
    question_numeric.actual_resolve_time = datetime_aware(2025, 4, 15)
    assert calculate_freshness(question_binary, aggregation, [v1]) == 0
