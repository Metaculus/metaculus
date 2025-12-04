import numpy as np
import pytest
from datetime import datetime

from questions.models import Question
from utils.the_math.formulas import (
    get_scaled_quartiles_from_cdf,
    string_location_to_bucket_index,
    unscaled_location_to_scaled_location,
)


class TestFormulas:

    binary_details = {"type": Question.QuestionType.BINARY}
    multiple_choice_details = {
        "type": Question.QuestionType.MULTIPLE_CHOICE,
        "options": ["a", "c", "Other"],
        "options_history": [
            (0, ["a", "b", "Other"]),
            (100, ["a", "Other"]),
            (200, ["a", "c", "Other"]),
        ],
    }
    numeric_details = {
        "type": Question.QuestionType.NUMERIC,
        "range_min": 0,
        "range_max": 200,
        "zero_point": None,
        "inbound_outcome_count": 200,
    }
    discrete_details = {
        "type": Question.QuestionType.DISCRETE,
        "range_min": -0.5,
        "range_max": 10.5,
        "zero_point": None,
        "inbound_outcome_count": 11,
    }
    date_details = {
        "type": Question.QuestionType.DATE,
        "range_min": datetime(2020, 1, 1).timestamp(),
        "range_max": datetime(2020, 12, 31).timestamp(),
        "zero_point": None,
        "inbound_outcome_count": 200,
    }
    logarithmic_details = {
        "type": Question.QuestionType.NUMERIC,
        "range_min": 1,
        "range_max": 1e10,
        "zero_point": 0,
        "inbound_outcome_count": 200,
    }

    @pytest.mark.parametrize(
        "string_location, question_details, expected",
        [
            # Binary questions
            ("yes", binary_details, 1),
            ("no", binary_details, 0),
            ("annulled", binary_details, None),
            ("ambiguous", binary_details, None),
            ("", binary_details, None),
            (None, binary_details, None),
            # Multiple choice questions
            ("a", multiple_choice_details, 0),
            ("b", multiple_choice_details, 1),
            ("c", multiple_choice_details, 2),
            ("Other", multiple_choice_details, 3),
            # Numeric questions
            ("below_lower_bound", numeric_details, 0),
            ("-2", numeric_details, 0),
            ("-1", numeric_details, 0),
            ("-0.001", numeric_details, 0),  # below lower bound
            ("0", numeric_details, 1),  # both 0 and 1 are in first bucket
            ("0.001", numeric_details, 1),
            ("0.999", numeric_details, 1),
            ("1", numeric_details, 1),
            ("1.001", numeric_details, 2),  # for all others, take the ceiling
            ("1.999", numeric_details, 2),
            ("2.0", numeric_details, 2),
            ("100", numeric_details, 100),
            ("100.001", numeric_details, 101),
            ("100.999", numeric_details, 101),
            ("199", numeric_details, 199),
            ("199.001", numeric_details, 200),
            ("199.999", numeric_details, 200),
            ("200", numeric_details, 200),
            ("200.001", numeric_details, 201),  # above upper bound
            ("201", numeric_details, 201),
            ("202", numeric_details, 201),
            ("above_upper_bound", numeric_details, 201),
            # Discrete questions
            ("below_lower_bound", discrete_details, 0),
            ("-2", discrete_details, 0),
            ("-1", discrete_details, 0),  # below lower bound
            ("0", discrete_details, 1),
            ("1", discrete_details, 2),
            ("2", discrete_details, 3),
            ("3", discrete_details, 4),
            ("4", discrete_details, 5),
            ("5", discrete_details, 6),
            ("6", discrete_details, 7),
            ("7", discrete_details, 8),
            ("8", discrete_details, 9),
            ("9", discrete_details, 10),
            ("10", discrete_details, 11),
            ("11", discrete_details, 12),  # above upper bound
            ("12", discrete_details, 12),
            ("above_upper_bound", discrete_details, 12),
            # Date questions
            ("below_lower_bound", date_details, 0),
            ("2019-12-30", date_details, 0),
            ("2019-12-31", date_details, 0),  # below lower bound
            ("2020-01-01", date_details, 1),
            ("2020-01-02", date_details, 1),  # 1/1 and 1/2 are in first bucket
            ("2020-01-03", date_details, 2),
            ("2020-06-30", date_details, 100),  # approximate middle
            ("2020-12-29", date_details, 199),
            ("2020-12-30", date_details, 200),
            ("2020-12-31", date_details, 200),  # 12/30 and 12/31 are in last bucket
            ("2021-01-01", date_details, 201),  # above upper bound
            ("2021-01-02", date_details, 201),
            ("above_upper_bound", date_details, 201),
            # Logarithmic questions
            ("below_lower_bound", logarithmic_details, 0),
            ("0.1", logarithmic_details, 0),
            ("0.999", logarithmic_details, 0),  # below lower bound
            (str(1e0), logarithmic_details, 1),
            (str(1e5), logarithmic_details, 100),
            (str(1e10), logarithmic_details, 200),
            (str(1e10 + 1), logarithmic_details, 201),  # above upper bound
            ("above_upper_bound", logarithmic_details, 201),
        ],
    )
    def test_string_location_to_bucket_index(
        self, string_location, question_details, expected
    ):
        question = Question(**question_details)
        result = string_location_to_bucket_index(string_location, question)
        assert result == expected

    @pytest.mark.parametrize(
        "unscaled_location, question_details, expected",
        [
            # Binary questions
            (1, binary_details, 1),
            (0, binary_details, 0),
            # Multiple choice questions
            (0, multiple_choice_details, 0),
            (2, multiple_choice_details, 2),
            # Numeric questions
            (-1 / 200, numeric_details, -1),
            (0 / 200, numeric_details, 0),
            (0.5 / 200, numeric_details, 0.5),
            (1 / 200, numeric_details, 1),
            (2 / 200, numeric_details, 2),
            (100 / 200, numeric_details, 100),
            (200 / 200, numeric_details, 200),
            (201 / 200, numeric_details, 201),
            # logarithmic questions
            (0, logarithmic_details, 1e0),
            (0.1, logarithmic_details, 1e1),
            (0.2, logarithmic_details, 1e2),
            (0.5, logarithmic_details, 1e5),
            (1, logarithmic_details, 1e10),
        ],
    )
    def test_unscaled_location_to_scaled_location(
        self, unscaled_location, question_details, expected
    ):
        question = Question(**question_details)
        result = unscaled_location_to_scaled_location(unscaled_location, question)
        assert round(result, 7) == expected

    @pytest.mark.parametrize(
        "cdf, question_details, expected",
        [
            ([0, 0.5, 1], numeric_details, [50, 100, 150]),
            ([0] * 200 + [1], numeric_details, [199.25, 199.50, 199.75]),
            (np.linspace(0, 1, 201), numeric_details, [50, 100, 150]),
        ],
    )
    def test_get_scaled_quartiles_from_cdf(self, cdf, question_details, expected):
        question = Question(**question_details)
        result = get_scaled_quartiles_from_cdf(cdf, question)
        assert all(round(r, 7) == e for r, e in zip(result, expected))
