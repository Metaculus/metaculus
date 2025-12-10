import json
import logging
import textwrap
from typing import Literal, Optional, Union

from django.conf import settings
from django.core.validators import URLValidator
from pydantic import (
    field_validator,
    ValidationInfo,
    ValidationError as PydanticValidationError,
    BaseModel,
    Field,
    model_validator,
)
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor, KeyFactorDriver, KeyFactorNews, KeyFactorBaseRate
from posts.models import Post
from questions.models import Question
from utils.openai import pydantic_to_openai_json_schema, get_openai_client

MAX_LENGTH = 50

logger = logging.getLogger(__name__)


def _normalize_impact_fields(data: dict) -> dict:
    """
    Normalize impact_direction and certainty fields.
    - Coerces values to allowed sets {1, -1} for impact_direction and {-1} for certainty
    - Enforces XOR: certainty (-1) overrides impact_direction
    """
    if not isinstance(data, dict):
        return data

    def coerce(value, allowed):
        try:
            v = int(value)
            return v if v in allowed else None
        except (TypeError, ValueError):
            return None

    impact_direction = coerce(data.get("impact_direction"), {1, -1})
    certainty = coerce(data.get("certainty"), {-1})

    # Enforce XOR preference: certainty (-1) overrides impact_direction
    if certainty == -1:
        impact_direction = None

    data.update(impact_direction=impact_direction, certainty=certainty)

    return data


class DriverResponse(BaseModel):
    type: str = Field("driver", description="Type identifier")
    text: str = Field(
        ..., description="Concise single-sentence key factor (<= 50 chars)"
    )
    impact_direction: Optional[int] = Field(
        None,
        description="Set to 1 or -1 to indicate direction; omit if certainty is set",
    )
    certainty: Optional[int] = Field(
        None,
        description="Set to -1 only if the factor increases uncertainty; else omit",
    )
    option: Optional[str] = Field(
        None,
        description="For multiple choice or group questions, which option/subquestion this factor relates to",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data):
        return _normalize_impact_fields(data)


class NewsResponse(BaseModel):
    url: str = Field(
        None,
        description="URL of the news article extracted from the comment",
    )
    impact_direction: Optional[int] = Field(
        None,
        description="Set to 1 or -1 to indicate direction; omit if certainty is set",
    )
    certainty: Optional[int] = Field(
        None,
        description="Set to -1 only if the article increases uncertainty; else omit",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data):
        return _normalize_impact_fields(data)


class BaseRateResponse(BaseModel):
    type: str = Field("base_rate", description="Type identifier")
    base_rate_type: str = Field(
        ..., description="'frequency' or 'trend' - must be one of these two types"
    )
    reference_class: str = Field(
        ..., description="Reference class for the base rate (required)"
    )
    unit: str = Field(..., description="Unit of measurement (required)")
    source_url: str = Field(
        ..., description="URL of the base rate data source (required)"
    )

    # Frequency-specific fields
    rate_numerator: Optional[int] = Field(
        None, description="Numerator for frequency type (required for frequency)"
    )
    rate_denominator: Optional[int] = Field(
        None, description="Denominator for frequency type (required for frequency)"
    )
    # Trend-specific fields
    projected_value: Optional[float] = Field(
        None, description="Projected value for trend type (required for trend)"
    )
    projected_by_year: Optional[int] = Field(
        None, description="Year for trend projection (required for trend)"
    )
    extrapolation: Optional[Literal["linear", "exponential", "other"]] = Field(
        None,
        description=(
            "Extrapolation method for trend type (required for trend); "
            "must be one of: linear, exponential, other"
        ),
    )
    based_on: Optional[str] = Field(
        None, description="What the trend is based on (optional)"
    )

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, value: str, info: ValidationInfo) -> str:
        # Validate URL
        URLValidator()(value)

        if not info.context:
            return value

        comment = info.context.get("comment")

        if not comment:
            return value

        if value.lower().strip("/") in comment.lower():
            return value

        raise ValueError("URL must be present in the comment")


KeyFactorResponseType = Union[DriverResponse, NewsResponse, BaseRateResponse]


class KeyFactorsResponse(BaseModel):
    key_factors: list[KeyFactorResponseType]


def _create_driver_key_factor(post: Post, response: DriverResponse) -> KeyFactor:
    """Create a KeyFactor with a Driver type from LLM response."""
    question_id = None
    question_option = None

    # Resolve option field to question_id and question_option
    if response.option:
        option = response.option.lower()
        if (
            post.question
            and post.question.type == Question.QuestionType.MULTIPLE_CHOICE
        ):
            question_id = post.question_id
            question_option = next(
                (x for x in post.question.options if x.lower() == option),
                None,
            )

        if post.group_of_questions:
            question_id = next(
                (q.id for q in post.get_questions() if q.label.lower() == option),
                None,
            )

    kf = KeyFactor(question_id=question_id, question_option=question_option)
    kf.driver = KeyFactorDriver(
        text=response.text,
        certainty=response.certainty,
        impact_direction=response.impact_direction,
    )

    return kf


def _create_news_key_factor(response: NewsResponse) -> KeyFactor:
    """
    Create a KeyFactor with a News type from LLM response.
    """
    kf = KeyFactor()
    kf.news = KeyFactorNews(
        url=response.url,
        # Other fields will be extracted on the frontend side
        # by fetching link-preview endpoint
        certainty=response.certainty,
        impact_direction=response.impact_direction,
    )

    return kf


def _create_base_rate_key_factor(response: BaseRateResponse) -> KeyFactor:
    """Create a KeyFactor with a BaseRate type from LLM response."""
    kf = KeyFactor()
    kf.base_rate = KeyFactorBaseRate(
        type=response.base_rate_type,
        reference_class=response.reference_class,
        rate_numerator=response.rate_numerator,
        rate_denominator=response.rate_denominator,
        projected_value=response.projected_value,
        projected_by_year=response.projected_by_year,
        unit=response.unit,
        extrapolation=response.extrapolation,
        based_on=response.based_on or "",
        source=response.source_url,
    )
    return kf


def _convert_llm_response_to_key_factor(
    post: Post, response: KeyFactorResponseType
) -> KeyFactor:
    """
    Convert LLM response to KeyFactor object (but not saving, just for the structure).
    Dispatches to appropriate type-specific converter.
    """
    if isinstance(response, DriverResponse):
        return _create_driver_key_factor(post, response)
    elif isinstance(response, NewsResponse):
        return _create_news_key_factor(response)
    elif isinstance(response, BaseRateResponse):
        return _create_base_rate_key_factor(response)


def build_post_question_summary(post: Post) -> tuple[str, Question.QuestionType]:
    """
    Build a compact text summary for a `Post` to provide to the LLM and
    determine the effective question type for impact rules.
    """
    questions = post.get_questions()
    post_type = questions[0].type if questions else Question.QuestionType.BINARY

    summary_lines = [
        f"Title: {post.title}",
        f"Type: {post_type}",
    ]

    if post.question:
        summary_lines.append(f"Description: {post.question.description}")
        if post_type == Question.QuestionType.MULTIPLE_CHOICE:
            summary_lines.append(f"Options: {post.question.options}")
    elif post.group_of_questions_id:
        summary_lines += [
            f"Description: {post.group_of_questions.description}",
            f"Options: {[q.label for q in questions]}",
        ]

    return "\n".join(summary_lines), post_type


def get_impact_type_instructions(
    question_type: Question.QuestionType, is_group: bool
) -> str:
    instructions = """
    - Set impact_direction (required): 1 or -1.
        - 1 means this factor makes the event more likely.
        - -1 means it makes the event less likely.
    """

    if question_type == Question.QuestionType.NUMERIC:
        instructions = """
        - For each key factor, set exactly one of these fields:
          - impact_direction: 1 or -1
          - certainty: -1
        - Use certainty = -1 only if the factor increases uncertainty about the forecast.
        - If using impact_direction:
          - 1 pushes the predicted value higher.
          - -1 pushes the predicted value lower.
        """

    if question_type == Question.QuestionType.DATE:
        instructions = """
        - For each key factor, set exactly one of these fields:
          - impact_direction: 1 or -1
          - certainty: -1
        - Use certainty = -1 only if the factor increases uncertainty about the timing.
        - If using impact_direction:
          - 1 means the event is expected later.
          - -1 means the event is expected earlier.
        """

    if is_group or question_type == Question.QuestionType.MULTIPLE_CHOICE:
        instructions += """
        - Add an optional "option" field if the key factor specifically supports one answer option over others.
        - If it affects all options, omit the "option" field.
        """

    return instructions


def generate_keyfactors(
    *,
    question_summary: str,
    comment: str,
    existing_key_factors: list[dict],
    type_instructions: str,
) -> list[KeyFactorResponseType]:
    """
    Generate key factors based on question type and comment.
    """

    system_prompt = textwrap.dedent(
        """
        You are a helpful assistant that creates tools for forecasters to better forecast on Metaculus,
        where users can predict on all sorts of questions about real-world events.
        """
    )

    user_prompt = textwrap.dedent(
        f"""
        You are a helpful assistant that generates a list of up to 3 key factors for a comment
        that a user makes on a Metaculus question.

        The comment is intended to describe what might influence the predictions on the question so the
        key factors should only be relate to that.
        The key factors should be the most important things that the user is trying to say
        in the comment and how it might influence the predictions on the question.

        You can generate three types of key factors:
        1. Driver: A factor that drives the outcome (e.g., "X policy change increases likelihood")
            - Text should be single sentences under {MAX_LENGTH} characters.
            - Should only contain the key factor, no other text (e.g.: do not reference the user).
            - Specify impact_direction (1/-1) or certainty (-1)
        2. News: A relevant news article found in the comment.
            - url: REQUIRED. Must be extracted from the comment body. If no URL, skip this factor.
            - Specify impact_direction (1/-1) or certainty (-1) for how this article affects the forecast
        3. BaseRate: A historical base rate or reference frequency/trend.
            - source_url: REQUIRED. Must be a real URL extracted verbatim from <user_comment>.
            - CRITICAL: Do not use URLs from <question_summary> or hallucinate URLs.
            - If no valid URL is found in the comment, skip this factor entirely.

        The key factors should represent the most important things influencing the forecast.

        {type_instructions}

        Output rules:
        - Return valid JSON only, matching the schema.
        - Include a "type" field for each factor: "driver", "news", or "base_rate"
        - For base_rate: source_url must come from <user_comment> only, never from <question_summary>
        - Do not duplicate existing key factors - check the list carefully
        - Ensure suggested key factors do not duplicate each other
        - Be conservative and only include clearly relevant factors
        - Do not include any formatting like quotes, numbering or other punctuation
        - If the comment provides no meaningful forecasting insight, return empty list e.g {"key_factors":[]}.

        The question details are:
        <question_summary>
        {question_summary}
        </question_summary>

        The user comment is:

        <user_comment>
        {comment}
        </user_comment>

        The existing key factors are:

        <key_factors>
        {existing_key_factors}
        </key_factors>
        """
    )

    client = get_openai_client(settings.OPENAI_API_KEY_FACTORS)

    response_format = pydantic_to_openai_json_schema(KeyFactorsResponse)

    try:
        response = client.chat.completions.create(
            # TODO: update to 5
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=response_format,
        )
    except Exception:
        return []

    if not response.choices:
        return []

    content = response.choices[0].message.content

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []

    # Validate each key factor individually
    type_map = {
        "driver": DriverResponse,
        "news": NewsResponse,
        "base_rate": BaseRateResponse,
    }

    validated_key_factors = []
    for item in data.get("key_factors", []):
        try:
            kf_type = item.get("type")
            model_class = type_map.get(kf_type)

            if model_class:
                model_instance = model_class.model_validate(
                    item, context={"comment": comment}
                )
                validated_key_factors.append(model_instance)
        except PydanticValidationError as e:
            logger.debug(f"Validation error for key factor at index: {e}")

    return validated_key_factors


def _serialize_key_factor(kf: KeyFactor):
    option = kf.question.label if kf.question else kf.question_option

    if kf.driver_id:
        return {
            "type": "driver",
            "text": kf.driver.text,
            "impact_direction": kf.driver.impact_direction,
            "certainty": kf.driver.certainty,
            "option": option or None,
        }
    elif kf.news_id:
        return {
            "type": "news",
            "title": kf.news.title,
            "url": kf.news.url,
        }
    elif kf.base_rate_id:
        return {
            "type": "base_rate",
            "base_rate_type": kf.base_rate.type,
            "reference_class": kf.base_rate.reference_class,
            "rate_numerator": kf.base_rate.rate_numerator,
            "rate_denominator": kf.base_rate.rate_denominator,
            "projected_value": kf.base_rate.projected_value,
            "projected_by_year": kf.base_rate.projected_by_year,
            "unit": kf.base_rate.unit,
            "extrapolation": kf.base_rate.extrapolation,
        }


def generate_key_factors_for_comment(
    comment_text: str, existing_key_factors: list[KeyFactor], post: Post
):
    if post.question is None and post.group_of_questions is None:
        raise ValidationError(
            "Key factors can only be generated for questions and question groups"
        )

    serialized_question_summary, post_type = build_post_question_summary(post)
    serialized_key_factors = [_serialize_key_factor(kf) for kf in existing_key_factors]

    response = generate_keyfactors(
        question_summary=serialized_question_summary,
        comment=comment_text,
        existing_key_factors=serialized_key_factors,
        type_instructions=get_impact_type_instructions(
            post_type, bool(post.group_of_questions_id)
        ),
    )

    return [_convert_llm_response_to_key_factor(post, kf) for kf in response]
