import json
import textwrap
from typing import List, Optional

from django.conf import settings
from pydantic import (
    BaseModel,
    Field,
    model_validator,
    ValidationError as PydanticValidationError,
)
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor, KeyFactorDriver
from posts.models import Post
from questions.models import Question
from utils.openai import pydantic_to_openai_json_schema, get_openai_client

# Central constraints
MAX_LENGTH = 50


class KeyFactorResponse(BaseModel):
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


class KeyFactorsResponse(BaseModel):
    key_factors: List[KeyFactorResponse]


def _convert_llm_response_to_key_factor(
    post: Post, response: KeyFactorResponse
) -> KeyFactor:
    """
    Generating and normalizing KeyFactor object (but not saving, just for the structure) from LLM payload
    """

    option = response.option.lower() if response.option else None
    question_id = None
    question_option = None

    if option:
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
                (q.id for q in post.get_questions() if q.label.lower() == option), None
            )

    return KeyFactor(
        question_id=question_id,
        question_option=question_option,
        driver=KeyFactorDriver(
            text=response.text,
            certainty=response.certainty,
            impact_direction=response.impact_direction,
        ),
    )


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
) -> list[KeyFactorResponse]:
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
        The key factors text should be single sentences, not longer than {MAX_LENGTH} characters
        and they should only contain the key factor, no other text (e.g.: do not reference the user).

        Each key factor should describe something that could influence the forecast for the question.
        Also specify the direction of impact as described below.

        {type_instructions}

        Output rules:
        - Return valid JSON only, matching the schema.
        - Each key factor is under {MAX_LENGTH} characters.
        - Do not include any key factors that are already in the existing key factors list. Read that carefully and make sure you don't have any duplicates.
        - Be conservative and only include clearly relevant factors.
        - Do not include any formatting like quotes, numbering or other punctuation
        - If the comment provides no meaningful forecasting insight, return the literal string "None".

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

    if content is None or content.lower() == "none":
        return []

    try:
        data = json.loads(content)
        # TODO: replace KeyFactorsResponse with plain list
        parsed = KeyFactorsResponse(**data)
        return parsed.key_factors
    except (json.JSONDecodeError, PydanticValidationError):
        return []


def _serialize_key_factor(kf: KeyFactor):
    option = kf.question.label if kf.question else kf.question_option

    if kf.driver_id:
        return {
            "text": kf.driver.text,
            "impact_direction": kf.driver.impact_direction,
            "certainty": kf.driver.certainty,
            "option": option or None,
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
