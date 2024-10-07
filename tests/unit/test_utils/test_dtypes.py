import pytest

from utils.dtypes import evenly_distribute_items


@pytest.mark.parametrize(
    "items_per_source, n, expected_output",
    [
        ([[1, 2, 3], [4, 5, 6, 7], [8, 9]], 5, [1, 4, 8, 2, 5]),
        ([["a", "b"], ["c"]], 5, ["a", "c", "b"]),
        ([[], [1, 2], []], 3, [1, 2]),
        ([[], [], []], 5, []),
        ([[1], [2], [3]], 3, [1, 2, 3]),
    ],
)
def test_evenly_distribute_items(items_per_source, n, expected_output):
    assert evenly_distribute_items(items_per_source, n) == expected_output
