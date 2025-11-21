import json
from unittest.mock import Mock, patch

import pytest
from pydantic import ValidationError

from comments.models import KeyFactorDriver, KeyFactorNews, KeyFactorBaseRate
from comments.services.key_factors.suggestions import (
    DriverResponse,
    NewsResponse,
    BaseRateResponse,
    _convert_llm_response_to_key_factor,
    build_post_question_summary,
    get_impact_type_instructions,
    generate_keyfactors,
    _serialize_key_factor,
    generate_key_factors_for_comment,
)
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)
from .factories import factory_comment, factory_key_factor


@pytest.fixture()
def binary_post(user1):
    return factory_post(
        author=user1,
        question=create_question(question_type=Question.QuestionType.BINARY),
    )


@pytest.fixture()
def multiple_choice_post(user1):
    question = create_question(
        question_type=Question.QuestionType.MULTIPLE_CHOICE,
        options=["Option A", "Option B"],
    )
    return factory_post(author=user1, question=question)


@pytest.fixture()
def group_questions_post(user1):
    q1 = create_question(
        question_type=Question.QuestionType.BINARY, label_original="First"
    )
    q2 = create_question(
        question_type=Question.QuestionType.BINARY, label_original="Second"
    )
    group = factory_group_of_questions(questions=[q1, q2])
    return factory_post(author=user1, group_of_questions=group)


class TestConvertLlmResponseToKeyFactor:
    """Test _convert_llm_response_to_key_factor"""

    def test_driver_conversion(self, binary_post):
        response = DriverResponse(text="Test factor", impact_direction=1)
        key_factor = _convert_llm_response_to_key_factor(binary_post, response)

        assert key_factor.driver.text == "Test factor"
        assert key_factor.driver.impact_direction == 1

    def test_driver_with_multiple_choice_option(self, multiple_choice_post):
        question = multiple_choice_post.question
        response = DriverResponse(text="Test", impact_direction=1, option="option a")
        key_factor = _convert_llm_response_to_key_factor(multiple_choice_post, response)

        assert key_factor.question_id == question.id
        assert key_factor.question_option == "Option A"

    def test_driver_with_group_question_option(self, group_questions_post):
        # Refresh questions to get labels
        questions = [q for q in group_questions_post.get_questions()]
        q1 = questions[0]

        response = DriverResponse(
            text="Test", impact_direction=1, option="first", certainty=None
        )
        key_factor = _convert_llm_response_to_key_factor(group_questions_post, response)

        assert key_factor.question_id == q1.id

    def test_news_conversion(self, binary_post):
        response = NewsResponse(url="https://example.com/article", impact_direction=1)
        key_factor = _convert_llm_response_to_key_factor(binary_post, response)

        assert key_factor.news.url == "https://example.com/article"
        assert key_factor.news.impact_direction == 1

    def test_base_rate_frequency_conversion(self, binary_post):
        response = BaseRateResponse(
            base_rate_type="frequency",
            reference_class="Test Class",
            unit="%",
            rate_numerator=10,
            rate_denominator=100,
            source_url="https://example.com/data",
        )
        key_factor = _convert_llm_response_to_key_factor(binary_post, response)

        assert key_factor.base_rate.type == "frequency"
        assert key_factor.base_rate.reference_class == "Test Class"
        assert key_factor.base_rate.rate_numerator == 10
        assert key_factor.base_rate.source == "https://example.com/data"

    def test_base_rate_trend_conversion(self, binary_post):
        response = BaseRateResponse(
            base_rate_type="trend",
            reference_class="Test Class",
            unit="%",
            projected_value=75.5,
            projected_by_year=2025,
            extrapolation="linear",
            source_url="https://example.com/data",
        )
        key_factor = _convert_llm_response_to_key_factor(binary_post, response)

        assert key_factor.base_rate.type == "trend"
        assert key_factor.base_rate.projected_value == 75.5
        assert key_factor.base_rate.source == "https://example.com/data"


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
        assert post_type == Question.QuestionType.BINARY

    def test_multiple_choice_includes_options(self, user1):
        question = create_question(
            question_type=Question.QuestionType.MULTIPLE_CHOICE, options=["A", "B"]
        )
        post = factory_post(author=user1, question=question)
        summary, _ = build_post_question_summary(post)

        assert "Options:" in summary


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

    def test_multiple_choice_has_option(self):
        instructions = get_impact_type_instructions(
            Question.QuestionType.MULTIPLE_CHOICE, is_group=False
        )
        assert "option" in instructions


class TestSerializeKeyFactor:
    """Test _serialize_key_factor"""

    def test_serialize_driver(self, user1):
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        driver = KeyFactorDriver.objects.create(text="Driver", impact_direction=1)
        key_factor = factory_key_factor(comment=comment, driver=driver)
        serialized = _serialize_key_factor(key_factor)

        assert serialized["type"] == "driver"
        assert serialized["text"] == "Driver"

    def test_serialize_news(self, user1):
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        news = KeyFactorNews.objects.create(
            url="https://example.com/article",
            title="Breaking News",
            source="News Agency",
            impact_direction=1,
        )
        key_factor = factory_key_factor(comment=comment, news=news)
        serialized = _serialize_key_factor(key_factor)

        assert serialized["type"] == "news"
        assert serialized["url"] == "https://example.com/article"

    def test_serialize_base_rate(self, user1):
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        base_rate = KeyFactorBaseRate.objects.create(
            type=KeyFactorBaseRate.BaseRateType.FREQUENCY,
            reference_class="Test Class",
            rate_numerator=10,
            rate_denominator=100,
            unit="%",
            source="Test Source",
        )
        key_factor = factory_key_factor(comment=comment, base_rate=base_rate)
        serialized = _serialize_key_factor(key_factor)

        assert serialized["type"] == "base_rate"
        assert serialized["base_rate_type"] == "frequency"

    def test_serialize_without_type_returns_none(self, user1):
        comment = factory_comment(author=user1, on_post=factory_post(author=user1))
        driver = KeyFactorDriver.objects.create(text="Driver", impact_direction=1)
        key_factor = factory_key_factor(comment=comment, driver=driver)
        key_factor.driver_id = None
        key_factor.news_id = None
        key_factor.base_rate_id = None
        assert _serialize_key_factor(key_factor) is None


class TestGenerateKeyfactors:
    """Test generate_keyfactors with mocked OpenAI"""

    def _mock_response(self, content):
        """Helper to create mock OpenAI response"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps(content)
        mock_client.chat.completions.create.return_value = mock_response
        return mock_client

    @patch("comments.services.key_factors.suggestions.get_openai_client")
    def test_successful_generation(self, mock_get_client):
        mock_client = self._mock_response(
            {
                "key_factors": [
                    {"type": "driver", "text": "Factor 1", "impact_direction": 1},
                    {"type": "news", "url": "https://example.com/article"},
                    {
                        "type": "base_rate",
                        "base_rate_type": "frequency",
                        "reference_class": "Historical",
                        "unit": "%",
                        "rate_numerator": 45,
                        "rate_denominator": 100,
                        "source_url": "https://example.com/data",
                    },
                ]
            }
        )
        mock_get_client.return_value = mock_client

        result = generate_keyfactors(
            question_summary="Q",
            comment="C https://example.com/data",
            existing_key_factors=[],
            type_instructions="I",
        )

        assert len(result) == 3
        assert isinstance(result[0], DriverResponse)
        assert isinstance(result[1], NewsResponse)
        assert isinstance(result[2], BaseRateResponse)

    @patch("comments.services.key_factors.suggestions.get_openai_client")
    def test_handles_none_response(self, mock_get_client):
        mock_client = self._mock_response({"key_factors": []})
        mock_get_client.return_value = mock_client

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
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_get_client.return_value = mock_client

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
        post = factory_post(author=user1)
        with pytest.raises((ValidationError, TypeError)):
            generate_key_factors_for_comment("comment", [], post)

    @patch("comments.services.key_factors.suggestions.generate_keyfactors")
    def test_generation_all_types(self, mock_generate, binary_post):
        mock_generate.return_value = [
            DriverResponse(text="Factor", impact_direction=1),
            NewsResponse(url="https://example.com/article"),
            BaseRateResponse(
                base_rate_type="frequency",
                reference_class="Historical",
                unit="%",
                rate_numerator=50,
                rate_denominator=100,
                source_url="https://example.com/data",
            ),
        ]

        result = generate_key_factors_for_comment(
            "comment https://example.com/data", [], binary_post
        )

        assert len(result) == 3
        assert result[0].driver is not None
        assert result[1].news is not None
        assert result[2].base_rate is not None

    @patch("comments.services.key_factors.suggestions.generate_keyfactors")
    def test_passes_existing_key_factors(self, mock_generate, user1, binary_post):
        comment = factory_comment(author=user1, on_post=binary_post)
        existing_driver = KeyFactorDriver.objects.create(
            text="Existing", impact_direction=1
        )
        existing_kf = factory_key_factor(comment=comment, driver=existing_driver)
        mock_generate.return_value = []

        generate_key_factors_for_comment("comment", [existing_kf], binary_post)

        call_kwargs = mock_generate.call_args.kwargs
        assert len(call_kwargs["existing_key_factors"]) == 1
        assert call_kwargs["existing_key_factors"][0]["type"] == "driver"
