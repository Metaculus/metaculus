import pytest  # noqa


from scoring.models import LeaderboardEntry
from scoring.utils import assign_prize_percentages


class TestScoringUtilsHelpers:

    @pytest.mark.parametrize(
        "entry_takes, minimum_prize_percent, expected",
        [
            ([], 0, []),
            ([6, 3, 1], 0, [0.6, 0.3, 0.1]),
            ([6, 3, 1], 0.25, [2 / 3, 1 / 3, 0]),
            ([6, 3, 1], 0.50, [1, 0, 0]),
            ([6, 3, 1, 0], 0, [0.6, 0.3, 0.1, 0]),
            ([6, 3, 1, 0, -1], 0, [0.6, 0.3, 0.1, 0, 0]),
            ([6, 3, 1, 0, -1], 0.25, [2 / 3, 1 / 3, 0, 0, 0]),
            ([0.90, 0.049, 0.041, 0.01], 0.05, [0.90 / 0.949, 0.049 / 0.949, 0, 0]),
        ],
    )
    def test_prize_percentages(self, entry_takes, minimum_prize_percent, expected):
        entries = [LeaderboardEntry(take=take) for take in entry_takes]
        assign_prize_percentages(entries, minimum_prize_percent)
        for entry, expected_percent in zip(entries, expected):
            assert pytest.approx(entry.percent_prize, 1e-7) == expected_percent
