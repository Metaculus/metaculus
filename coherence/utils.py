import statistics

from django.db.models import Q
from django.db.models.sql import OR
from scipy.stats import sem

from coherence.models import (
    CoherenceLink,
    AggregateCoherenceLink,
    AggregateCoherenceLinkVote,
)


def convert_vector_to_direction_strength(
    vector_value: float,
) -> tuple[int | None, float | None]:
    vector_value_int = round(vector_value)
    if vector_value_int == 0:
        return None, None
    strength = abs(vector_value)
    direction = 1 if vector_value_int > 0 else -1
    return direction, strength


def get_aggregation_results(
    links: list[CoherenceLink],
    votes: list[AggregateCoherenceLinkVote],
) -> tuple[int | None, float | None, float | None]:
    if len(links) == 0:
        return None, None, None

    vectors = [link.direction * link.strength for link in links]
    mean = statistics.mean(vectors)
    mean_direction, mean_strength = convert_vector_to_direction_strength(mean)

    # Now enriching mean strength with votes weight
    vote_agrees = sum(v.score == 1 for v in votes)

    if mean_strength is not None:
        mean_strength = (mean_strength * (len(links) + vote_agrees)) / (
            len(links) + len(votes)
        )

    relative_standard_error_mean = (
        abs(float(sem(vectors) / mean)) if mean != 0 and len(vectors) > 1 else None
    )
    return mean_direction, mean_strength, relative_standard_error_mean


def link_to_question_id_pair(link: CoherenceLink | AggregateCoherenceLink) -> str:
    return f"{link.question1_id}, {link.question2_id}"


def get_aggregations_links(aggregations: list[AggregateCoherenceLink]):
    question_pairs = {(link.question1_id, link.question2_id) for link in aggregations}

    return CoherenceLink.objects.filter(
        Q(
            *[
                Q(question1_id=q1_id, question2_id=q2_id)
                for q1_id, q2_id in question_pairs
            ],
            _connector=OR,
        )
    )
