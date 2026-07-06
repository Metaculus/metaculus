import pytest

from coherence.utils import (
    get_aggregation_results,
    convert_vector_to_direction_strength,
)
from tests.unit.test_coherence.factories import (
    factory_coherence_link,
    factory_agg_link_vote,
)


class TestGetAggregationResults:
    def test_empty_list(self):
        result = get_aggregation_results([], [])
        assert result == (None, None, None)

    def test_single_link(self):
        links = [factory_coherence_link(direction=1, strength=5)]
        result = get_aggregation_results(links, [])
        assert result == (1, 5, None)

        links = [factory_coherence_link(direction=-1, strength=3)]
        result = get_aggregation_results(links, [])
        assert result == (-1, 3, None)

    def test_multiple_links(self):
        # Case 1: All same direction and strength
        links = [
            factory_coherence_link(direction=1, strength=5),
            factory_coherence_link(direction=1, strength=5),
        ]
        # Vectors: 5, 5
        # Mean: 10
        # Direction: 1, Strength: 5
        # SEM: 0
        # Relative SEM: 0 / 5 = 0.0
        result = get_aggregation_results(links, [])
        assert result == (1, 5.0, 0.0)

        # Case 2: Opposing directions, same strength cancelling out
        links = [
            factory_coherence_link(direction=1, strength=5),
            factory_coherence_link(direction=-1, strength=5),
        ]
        # Vectors: 5, -5
        # Mean: 0
        # Direction: None, Strength: None
        # SEM: some value > 0
        # Relative SEM: undefined/handled (mean is 0) -> None
        result = get_aggregation_results(links, [])
        assert result == (None, None, None)

        # Case 3: Mixed
        links = [
            factory_coherence_link(direction=1, strength=5),
            factory_coherence_link(direction=1, strength=2),
        ]
        # Vectors: 5, 2
        # Mean: 6
        # Direction: 1, Strength: 3.5
        # SEM: sem([10, 2]) = 4
        result = get_aggregation_results(links, [])
        assert result[0] == 1
        assert result[1] == 3.5
        assert result[2] == pytest.approx(0.4286, abs=1e-3)

    def test_multiple_links_votes(self):
        links = [
            factory_coherence_link(direction=1, strength=5),
            factory_coherence_link(direction=1, strength=5),
        ]
        # All Agree
        result = get_aggregation_results(
            links, [factory_agg_link_vote(score=1), factory_agg_link_vote(score=1)]
        )
        assert result == (1, 5.0, 0.0)

        # 50/50
        result = get_aggregation_results(
            links, [factory_agg_link_vote(score=1), factory_agg_link_vote(score=-1)]
        )
        assert result == (1, 3.75, 0.0)

        # All disagree
        result = get_aggregation_results(
            links, [factory_agg_link_vote(score=-1), factory_agg_link_vote(score=-1)]
        )
        assert result == (1, 2.5, 0.0)

    def test_convert_vector_to_direction_strength(self):
        # Basic checks for the helper too, although integrated above
        assert convert_vector_to_direction_strength(5.5) == (1, 5.5)
        assert convert_vector_to_direction_strength(-3.2) == (-1, 3.2)
        assert convert_vector_to_direction_strength(0.4) == (
            None,
            None,
        )  # round(0.4) = 0
        assert convert_vector_to_direction_strength(-0.4) == (
            None,
            None,
        )  # round(-0.4) = 0
