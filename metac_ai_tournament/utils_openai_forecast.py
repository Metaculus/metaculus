import hashlib
import json
import re
import urllib.parse
from functools import wraps
from typing import TypedDict

import requests
from django.conf import settings
from django.core.cache import cache
from openai import OpenAI

from metac_question.models import Question

FORMATTING_INSTRUCTIONS = (
    'You write your rationale and give your final answer as: "Probability: ZZ%", 0-100'
)


def memoize(timeout):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a unique cache key based on the function name and its arguments
            key = f"{func.__module__}.{func.__name__}"
            args_str = json.dumps(args, sort_keys=True)
            kwargs_str = json.dumps(kwargs, sort_keys=True)
            key = hashlib.md5(f"{key}:{args_str}:{kwargs_str}".encode()).hexdigest()

            # Check if the result is already cached
            result = cache.get(key)
            if result is None:
                # If not cached, call the function and cache the result
                result = func(*args, **kwargs)
                cache.set(key, result, timeout=timeout)
            return result

        return wrapper

    return decorator


def _get_perplexity_research_research_bot(question_id):
    url = urllib.parse.urljoin(
        settings.QUESTIONS_API_URL, "perplexity-research-results"
    )
    headers = {
        "accept": "application/json",
        "X-API-Key": settings.QUESTIONS_API_KEY,
        "content-type": "application/json",
    }
    params = {"question_id": question_id}
    response = requests.get(url=url, params=params, headers=headers)
    if response.status_code == 404:
        return (
            "No results found, please use you own knowledge and judgement to forecast"
        )
    content = response.text
    # Perplexity content contains escape characters, decode them
    content = bytes(content, "utf-8").decode("unicode_escape")
    return content


def _get_perplexity_research(question: Question):
    messages = [
        {
            "role": "system",
            "content": (
                "You are an artificial intelligence assistant and you need to "
                "engage in a helpful, detailed, polite conversation with a user."
            ),
        },
        {
            "role": "user",
            "content": question.title,
        },
    ]

    client = OpenAI(
        api_key=settings.PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai"
    )

    response = client.chat.completions.create(
        model="llama-3-sonar-large-32k-online",
        messages=messages,
    )

    return response.choices[0].message.content


def find_number_before_percent(s) -> int | None:
    # Use a regular expression to find all numbers followed by a '%'
    matches = re.findall(r"(\d+)%", s)
    if matches:
        # Return the last number found before a '%'
        return int(matches[-1])
    else:
        # Return None if no number found
        return None


class ForecastResult(TypedDict, total=False):
    reasoning: str
    prediction: float
    perplexity_research: str
    question_id: int
    question_title: str
    last_cp: float | None
    chatgpt_prompt: str


def _get_question_last_cp(question) -> float:
    latest_prediction = (
        question.recency_weighted_community_prediction_v2.latest_prediction
    )
    return latest_prediction.prediction_values[1]


def forecast_with_gpt(
    prompt: str,
    prompt_context: dict[str, str],
    question: Question,
    model_name: str = "gpt-4o",
) -> ForecastResult:
    """
    Forecast with GPT-4
    Args:
        prompt: The GPT-4 prompt
        prompt_context: The context to be used in the prompt
                        Can contain keys:
                        title (question title),
                        today (today's date),
                        background, resolution_criteria fine_print,  (background, resolution criteria, fine print of the question)
    """
    # if FORMATTING_INSTRUCTIONS not in prompt:
    #     prompt += FORMATTING_INSTRUCTIONS

    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
    )
    perplexity_research = _get_perplexity_research(question)
    prompt_context["summary_report"] = perplexity_research
    chatgpt_prompt = prompt.format(**prompt_context)
    chat_completion = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": chatgpt_prompt}],
    )

    gpt_text = chat_completion.choices[0].message.content
    probability_match = find_number_before_percent(gpt_text)
    return ForecastResult(
        reasoning=gpt_text,
        prediction=probability_match,
        perplexity_research=perplexity_research,
        question_id=question.id,
        question_title=question.title,
        chatgpt_prompt=chatgpt_prompt,
    )
