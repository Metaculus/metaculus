import pytest

from questions.models import DEFAULT_INBOUND_OUTCOME_COUNT, Question
from questions.serializers.common import QuestionSerializer
from tests.unit.test_questions.factories import create_question


class TestQuestionSerializerInboundOutcomeCount:
    @pytest.mark.parametrize(
        "question_type",
        [
            Question.QuestionType.NUMERIC,
            Question.QuestionType.DATE,
            Question.QuestionType.DISCRETE,
        ],
    )
    def test_defaults_when_not_set(self, question_type):
        # Questions created before inbound_outcome_count existed have no value stored
        question = create_question(
            question_type=question_type,
            range_min=0,
            range_max=100,
            inbound_outcome_count=None,
        )
        data = QuestionSerializer(question).data

        assert question.inbound_outcome_count is None
        assert data["inbound_outcome_count"] == DEFAULT_INBOUND_OUTCOME_COUNT
        assert data["scaling"]["inbound_outcome_count"] == DEFAULT_INBOUND_OUTCOME_COUNT
        assert len(data["scaling"]["continuous_range"]) == (
            DEFAULT_INBOUND_OUTCOME_COUNT + 1
        )

    def test_keeps_stored_value(self):
        question = create_question(
            question_type=Question.QuestionType.DISCRETE,
            range_min=0,
            range_max=100,
            inbound_outcome_count=51,
        )
        data = QuestionSerializer(question).data

        assert data["inbound_outcome_count"] == 51
        assert data["scaling"]["inbound_outcome_count"] == 51
        assert len(data["scaling"]["continuous_range"]) == 52

    @pytest.mark.parametrize(
        "question_type",
        [Question.QuestionType.BINARY, Question.QuestionType.MULTIPLE_CHOICE],
    )
    def test_stays_none_for_non_continuous(self, question_type):
        question = create_question(
            question_type=question_type,
            options=["a", "b"],
        )
        data = QuestionSerializer(question).data

        assert data["inbound_outcome_count"] is None
        assert data["scaling"]["inbound_outcome_count"] is None
