import statistics

from scipy.stats import sem

from coherence.models import CoherenceLink, AggregateCoherenceLink


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
) -> tuple[int | None, float | None, float | None]:
    if len(links) == 0:
        return None, None, None
    elif len(links) == 1:
        link = links[0]
        return link.direction, link.strength, None
    else:
        vectors = [link.direction * link.strength for link in links]
        mean = statistics.mean(vectors)
        mean_direction, mean_strength = convert_vector_to_direction_strength(mean)
        relative_standard_error_mean = (
            abs(float(sem(vectors) / mean)) if mean != 0 else None
        )
        return mean_direction, mean_strength, relative_standard_error_mean


def link_to_question_id_pair(link: CoherenceLink | AggregateCoherenceLink) -> str:
    return f"{link.question1_id}, {link.question2_id}"
