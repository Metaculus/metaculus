import statistics

from scipy.stats import sem

from coherence.models import CoherenceLink, Direction, Strength, AggregateCoherenceLink


def convert_direction_to_number(direction: Direction) -> int:
    direction_map = {
        Direction.POSITIVE: 1,
        Direction.NEGATIVE: -1,
    }
    return direction_map[direction]


def convert_strength_to_number(strength: Strength) -> int:
    strength_map = {Strength.LOW: 1, Strength.MEDIUM: 2, Strength.HIGH: 5}
    return strength_map[strength]


def convert_to_vector(direction: Direction, strength: Strength) -> int:
    return convert_direction_to_number(direction) * convert_strength_to_number(strength)


def convert_direction_number_to_label(direction: int) -> Direction:
    direction_map = {1: Direction.POSITIVE, -1: Direction.NEGATIVE}
    return direction_map[direction]


def convert_strength_number_to_label(strength: int) -> Strength:
    strength_map = {
        1: Strength.LOW,
        2: Strength.MEDIUM,
        3: Strength.MEDIUM,
        4: Strength.HIGH,
        5: Strength.HIGH,
    }
    return strength_map[strength]


def convert_vector_to_direction_strength(
    vector_value: float,
) -> tuple[int | None, int | None]:
    vector_value = round(vector_value)
    if vector_value == 0:
        return None, None
    strength = abs(vector_value)
    direction = vector_value // strength
    return direction, strength


def get_aggregation_results(
    links: list[CoherenceLink],
) -> tuple[int | None, int | None, float | None]:
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
