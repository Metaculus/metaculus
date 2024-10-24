import pytest
import numpy as np

from utils.the_math.aggregations import summarize_array


@pytest.mark.parametrize(
    "array, max_size, expceted_array",
    [
        ([], 10, []),
        (range(10), 10, range(10)),
        (range(10), 150, range(10)),
        (range(5), 3, [0, 2, 4]),
        ([1, 1.1, 1.2, 1.5, 2, 3, 4, 5], 3, [1, 3, 5]),
        (range(10), 5, [0, 3, 5, 7, 9]),
    ],
)
def test_summarize_array(array, max_size, expceted_array):
    summarized = summarize_array(array, max_size)

    # Check that the summarized list has the correct length
    assert np.allclose(summarized, expceted_array)
