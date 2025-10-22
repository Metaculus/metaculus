import json
import textwrap
from typing import List, Optional

from django.conf import settings
from pydantic import BaseModel, Field, ValidationError

from comments.models import KeyFactor, KeyFactorDriver
from posts.models import Post
from questions.models import Question
from utils.openai import pydantic_to_openai_json_schema, get_openai_client


# TODO: unit tests!
class KeyFactorResponse(BaseModel):
    text: str = Field(
        ..., description="Concise single-sentence key factor (<= 50 chars)"
    )
    impact: str = Field(..., description="Impact direction depending on question type")
    option: Optional[str] = Field(
        None,
        description="For multiple choice or group questions, which option/subquestion this factor relates to",
    )


class KeyFactorsResponse(BaseModel):
    key_factors: List[KeyFactorResponse]


def _convert_impact_to_properties(impact: str) -> dict:
    if impact == "INCREASES_UNCERTAINTY":
        return {"certainty": -1, "impact_direction": None}

    impact_map = {
        "INCREASE": 1,
        "DECREASE": -1,
        "EARLIER": -1,
        "LATER": 1,
        "MORE": 1,
        "LESS": -1,
    }

    return {"certainty": None, "impact_direction": impact_map.get(impact)}


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
            question_option = next(
                (x for x in post.question.options if x.lower() == option),
                None,
            )

        if post.group_of_questions:
            question_id = next(
                (q.id for q in post.get_questions() if q.label.lower() == option), None
            )

    impact_props = _convert_impact_to_properties(response.impact)

    return KeyFactor(
        question_id=question_id,
        question_option=question_option,
        driver=KeyFactorDriver(text=response.text, **impact_props),
    )


def _convert_properties_to_impact_label(
    question_type: Question.QuestionType, certainty: int, impact_direction: int
):
    if certainty == -1:
        return "INCREASES_UNCERTAINTY"

    if question_type == Question.QuestionType.NUMERIC:
        return {
            1: "MORE",
            -1: "LESS",
        }.get(impact_direction)

    if question_type == Question.QuestionType.DATE:
        return {
            1: "LATER",
            -1: "EARLIER",
        }.get(impact_direction)

    return {
        1: "INCREASE",
        -1: "DECREASE",
    }.get(impact_direction)


def get_impact_type_instructions(
    question_type: Question.QuestionType, is_group: bool
) -> str:
    instructions = f"""
    - Impact must be one of: ["INCREASE", "DECREASE"].
    - "INCREASE" means this factor makes the event more likely.
    - "DECREASE" means it makes the event less likely.
    """

    if question_type == Question.QuestionType.NUMERIC:
        instructions = f"""
        - Impact must be one of: ["MORE", "LESS", "INCREASES_UNCERTAINTY"].
        - "MORE" means this factor pushes the predicted value higher.
        - "LESS" means it pushes the predicted value lower.
        - "INCREASES_UNCERTAINTY" means it makes the forecast less certain.
        """

    if question_type == Question.QuestionType.DATE:
        instructions = f"""
        - Impact must be one of: ["EARLIER", "LATER", "INCREASES_UNCERTAINTY"].
        - "EARLIER" means this factor makes the event expected sooner.
        - "LATER" means it makes the event expected later.
        - "INCREASES_UNCERTAINTY" means it makes the timing more uncertain.
        """

    if is_group or question_type == Question.QuestionType.MULTIPLE_CHOICE:
        instructions += f"""
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
    MAX_LENGTH = 50

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

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format=response_format,
    )

    content = response.choices[0].message.content

    if content is None or content.lower() == "none":
        return []

    try:
        data = json.loads(content)
        # TODO: replace KeyFactorsResponse with plain list
        parsed = KeyFactorsResponse(**data)
        return parsed.key_factors
    except (json.JSONDecodeError, ValidationError):
        return []


def _serialize_key_factor(kf: KeyFactor):
    option = kf.question.label if kf.question else kf.question_option

    if kf.driver_id:
        return {
            "text": kf.driver.text,
            "impact": kf.driver.impact_direction,
            "option": option or None,
        }


def generate_key_factors_for_comment(
    comment_text: str, existing_key_factors: list[KeyFactor], post: Post
):
    if post.question is None and post.group_of_questions is None:
        raise ValidationError(
            "Key factors can only be generated for questions and question groups"
        )

    questions = post.get_questions()
    post_type = questions[0].type if questions else Question.QuestionType.BINARY

    question_summary = [
        f"Title: {post.title}",
        f"Type: {post_type}",
    ]

    if post.question:
        question_summary += [
            f"Description: {post.question.description}",
        ]

        if post_type == Question.QuestionType.MULTIPLE_CHOICE:
            question_summary.append(f"Options: {post.question.options}")

    elif post.group_of_questions_id:
        question_summary += [
            f"Description: {post.group_of_questions.description}",
            # TODO: should we do open questions only?
            f"Options: {[q.label for q in questions]}",
        ]

    serialized_key_factors = [_serialize_key_factor(kf) for kf in existing_key_factors]
    serialized_question_summary = "\n".join(question_summary)

    response = generate_keyfactors(
        question_summary=serialized_question_summary,
        comment=comment_text,
        existing_key_factors=serialized_key_factors,
        type_instructions=get_impact_type_instructions(
            post_type, bool(post.group_of_questions_id)
        ),
    )

    return [_convert_llm_response_to_key_factor(post, kf) for kf in response]
