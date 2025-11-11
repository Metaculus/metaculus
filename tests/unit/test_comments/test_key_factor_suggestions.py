import json
from unittest.mock import Mock, patch

import pytest
from comments.models import KeyFactorDriver
from comments.services.key_factors.suggestions import (
    KeyFactorResponse,
    _convert_llm_response_to_key_factor,
    build_post_question_summary,
    get_impact_type_instructions,
    generate_keyfactors,
    _serialize_key_factor,
    generate_key_factors_for_comment,
)
from pydantic import ValidationError
from questions.models import Question
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)


class TestConvertLlmResponseToKeyFactor:
    """Test _convert_llm_response_to_key_factor"""

    def test_simple_conversion(self, user1):
        post = factory_post(
            author=user1,
            question=create_question(question_type=Question.QuestionType.BINARY),
        )
        response = KeyFactorResponse(text="Test factor", impact_direction=1)
        key_factor = _convert_llm_response_to_key_factor(post, response)

        assert key_factor.driver.text == "Test factor"
        assert key_factor.driver.impact_direction == 1

    def test_multiple_choice_option_matching(self, user1):
        question = create_question(
            question_type=Question.QuestionType.MULTIPLE_CHOICE,
            options=["Option A", "Option B"],
        )
        post = factory_post(author=user1, question=question)
        response = KeyFactorResponse(text="Test", impact_direction=1, option="option a")
        key_factor = _convert_llm_response_to_key_factor(post, response)

        assert key_factor.question_id == question.id
        assert key_factor.question_option == "Option A"

    def test_group_question_matching(self, user1):
        q1 = create_question(
            question_type=Question.QuestionType.BINARY, label_original="First"
        )
        q2 = create_question(
            question_type=Question.QuestionType.BINARY, label_original="Second"
        )
        group = factory_group_of_questions(questions=[q1, q2])
        post = factory_post(author=user1, group_of_questions=group)

        # Refresh questions from DB to ensure labels are loaded
        q1.refresh_from_db()
        q2.refresh_from_db()

        response = KeyFactorResponse(
            text="Test", impact_direction=1, option="first", certainty=None
        )
        key_factor = _convert_llm_response_to_key_factor(post, response)

        # The function should match the label case-insensitively
        assert key_factor.question_id == q1.id


class TestBuildPostQuestionSummary:
    """Test build_post_question_summary"""

    def test_binary_question(self, user1):
        question = create_question(
            question_type=Question.QuestionType.BINARY, description_en="Will it happen?"
        )
        post = factory_post(author=user1, question=question, title_en="Test Post")
        summary, post_type = build_post_question_summary(post)

        assert "Title:" in summary
        assert "Type: binary" in summary
        assert "Description:" in summary
        assert "Will it happen?" in summary
        assert post_type == Question.QuestionType.BINARY

    def test_multiple_choice_includes_options(self, user1):
        question = create_question(
            question_type=Question.QuestionType.MULTIPLE_CHOICE, options=["A", "B"]
        )
        post = factory_post(author=user1, question=question)
        summary, _ = build_post_question_summary(post)

        assert "Options: ['A', 'B']" in summary


class TestGetImpactTypeInstructions:
    """Test get_impact_type_instructions"""

    def test_binary_no_certainty(self):
        instructions = get_impact_type_instructions(
            Question.QuestionType.BINARY, is_group=False
        )
        assert "impact_direction" in instructions
        assert "certainty" not in instructions

    def test_numeric_has_certainty(self):
        instructions = get_impact_type_instructions(
            Question.QuestionType.NUMERIC, is_group=False
        )
        assert "certainty" in instructions
        assert "1 pushes the predicted value higher" in instructions

    def test_multiple_choice_has_option(self):
        instructions = get_impact_type_instructions(
            Question.QuestionType.MULTIPLE_CHOICE, is_group=False
        )
        assert "option" in instructions


class TestSerializeKeyFactor:
    """Test _serialize_key_factor"""

    def test_serialize_with_driver(self, user1):
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        driver = KeyFactorDriver.objects.create(text="Driver", impact_direction=1)
        key_factor = factory_key_factor(comment=comment, driver=driver)
        serialized = _serialize_key_factor(key_factor)

        assert serialized["text"] == "Driver"
        assert serialized["impact_direction"] == 1

    def test_serialize_without_driver_returns_none(self, user1):
        """Test that _serialize_key_factor returns None when driver_id is None"""
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        driver = KeyFactorDriver.objects.create(text="Driver", impact_direction=1)
        key_factor = factory_key_factor(comment=comment, driver=driver)
        # Manually set driver_id to None to test the function logic
        key_factor.driver_id = None
        assert _serialize_key_factor(key_factor) is None


class TestGenerateKeyfactors:
    """Test generate_keyfactors with mocked OpenAI"""

    @patch("comments.services.key_factors.suggestions.get_openai_client")
    def test_successful_generation(self, mock_get_client):
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps(
            {
                "key_factors": [
                    {"text": "Factor 1", "impact_direction": 1},
                    {"text": "Factor 2", "impact_direction": -1},
                ]
            }
        )
        mock_client.chat.completions.create.return_value = mock_response

        result = generate_keyfactors(
            question_summary="Q",
            comment="C",
            existing_key_factors=[],
            type_instructions="I",
        )

        assert len(result) == 2
        assert result[0].text == "Factor 1"

    @patch("comments.services.key_factors.suggestions.get_openai_client")
    def test_handles_none_response(self, mock_get_client):
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "None"
        mock_client.chat.completions.create.return_value = mock_response

        result = generate_keyfactors(
            question_summary="Q",
            comment="C",
            existing_key_factors=[],
            type_instructions="I",
        )
        assert result == []

    @patch("comments.services.key_factors.suggestions.get_openai_client")
    def test_handles_api_errors(self, mock_get_client):
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        result = generate_keyfactors(
            question_summary="Q",
            comment="C",
            existing_key_factors=[],
            type_instructions="I",
        )
        assert result == []


class TestGenerateKeyFactorsForComment:
    """Test generate_key_factors_for_comment integration"""

    def test_validation_error_no_question(self, user1):
        """Test that error is raised when post has no question or group"""
        post = factory_post(author=user1)
        with pytest.raises((ValidationError, TypeError)):
            generate_key_factors_for_comment("comment", [], post)

    @patch("comments.services.key_factors.suggestions.generate_keyfactors")
    def test_successful_generation(self, mock_generate, user1):
        question = create_question(question_type=Question.QuestionType.BINARY)
        post = factory_post(author=user1, question=question)
        mock_generate.return_value = [
            KeyFactorResponse(text="Factor", impact_direction=1)
        ]

        result = generate_key_factors_for_comment("comment", [], post)

        assert len(result) == 1
        assert result[0].driver.text == "Factor"

    @patch("comments.services.key_factors.suggestions.generate_keyfactors")
    def test_passes_existing_key_factors(self, mock_generate, user1):
        question = create_question(question_type=Question.QuestionType.BINARY)
        post = factory_post(author=user1, question=question)
        comment = factory_comment(author=user1, on_post=post)
        existing_driver = KeyFactorDriver.objects.create(
            text="Existing", impact_direction=1
        )
        existing_kf = factory_key_factor(comment=comment, driver=existing_driver)
        mock_generate.return_value = []

        generate_key_factors_for_comment("comment", [existing_kf], post)

        call_kwargs = mock_generate.call_args.kwargs
        assert len(call_kwargs["existing_key_factors"]) == 1
        assert call_kwargs["existing_key_factors"][0]["text"] == "Existing"
