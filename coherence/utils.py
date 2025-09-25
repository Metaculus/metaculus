import statistics

from scipy.stats import sem

from coherence.models import CoherenceLink, Direction, Strength, AggregateCoherenceLink


def convert_to_vector(direction: Direction, strength: Strength) -> int:
    direction_map = {
        Direction.POSITIVE: 1,
        Direction.NEGATIVE: -1,
    }

    strength_map = {Strength.LOW: 1, Strength.MEDIUM: 2, Strength.HIGH: 3}
    return direction_map[direction] * strength_map[strength]


def custom_round(x: float) -> int:
    fractional_part = abs(x - int(x))
    if abs(fractional_part - 0.5) < 1e-10:
        return int(x)
    else:
        return round(x)


def convert_to_direction_strength(
    vector_value: float,
) -> tuple[Direction | None, Strength | None]:
    strength_map = {1: Strength.LOW, 2: Strength.MEDIUM, 3: Strength.HIGH}
    vector_value = custom_round(vector_value)
    if vector_value == 0:
        return None, None
    direction = Direction.POSITIVE if vector_value > 0 else Direction.NEGATIVE
    strength = strength_map[abs(vector_value)]
    return direction, strength


def get_aggregation_results(
    links: list[CoherenceLink],
) -> tuple[Direction | None, Strength | None, float | None]:
    if len(links) == 0:
        return None, None, None
    elif len(links) == 1:
        link = links[0]
        return Direction(link.direction), Strength(link.strength), None
    else:
        vectors = [
            convert_to_vector(Direction(link.direction), Strength(link.strength))
            for link in links
        ]
        mean = statistics.mean(vectors)
        mean_direction, mean_strength = convert_to_direction_strength(mean)
        relative_standard_error_mean = (
            abs(float(sem(vectors) / mean)) if mean != 0 else None
        )
        return mean_direction, mean_strength, relative_standard_error_mean


def link_to_question_id_pair(link: AggregateCoherenceLink) -> str:
    return f"{link.question1_id}, {link.question2_id}"
