import asyncio
import json
from functools import partial

import httpx
import pytest
from openai import AsyncOpenAI, OpenAI

from comments.services.key_factors.suggestions import (
    generate_keyfactors,
    get_impact_type_instructions,
)
from questions.management.commands.generate_question_units import generate_units
from questions.models import Question
from users.services.spam_detection import ask_gpt_to_check_profile_for_spam
from utils.llm import (
    LLMFeature,
    generate_text_embed_vector,
    generate_text_embed_vector_async,
    run_spam_analysis,
)

OPENROUTER_URL = "https://openrouter.ai/api/v1"
CHAT_MODEL = "test/chat-model"
EMBEDDING_MODEL = "test/embedding-model"


class FakeOpenRouter:
    def __init__(self):
        self.content = "{}"
        self.requests: list[tuple[httpx.Request, dict]] = []

    def handle(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        self.requests.append((request, body))

        if request.url.path.endswith("/embeddings"):
            return httpx.Response(
                200,
                json={
                    "object": "list",
                    "data": [{"object": "embedding", "index": 0, "embedding": [0.1]}],
                    "model": body["model"],
                    "usage": {"prompt_tokens": 1, "total_tokens": 1},
                },
            )

        return httpx.Response(
            200,
            json={
                "id": "gen-1",
                "object": "chat.completion",
                "created": 0,
                "model": body["model"],
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant", "content": self.content},
                    }
                ],
            },
        )

    @property
    def last(self) -> tuple[httpx.Request, dict]:
        return self.requests[-1]


@pytest.fixture
def openrouter(mocker, settings):
    settings.OPENROUTER_API_KEY = "sk-or-test"
    settings.GENERAL_LLM_MODEL = CHAT_MODEL
    settings.LLM_EMBEDDING_MODEL = EMBEDDING_MODEL
    fake = FakeOpenRouter()
    transport = httpx.MockTransport(fake.handle)
    mocker.patch(
        "utils.llm.OpenAI",
        partial(OpenAI, http_client=httpx.Client(transport=transport)),
    )
    mocker.patch(
        "utils.llm.AsyncOpenAI",
        partial(AsyncOpenAI, http_client=httpx.AsyncClient(transport=transport)),
    )
    return fake


def assert_routed(body: dict, feature: LLMFeature):
    assert body["user"] == feature
    assert body["provider"] == {
        "order": ["openai"],
        "allow_fallbacks": False,
        "require_parameters": True,
    }


def test_requests_go_to_openrouter_with_app_attribution(openrouter):
    generate_text_embed_vector("text", LLMFeature.EMBEDDINGS_SEARCH)

    request, body = openrouter.last
    assert str(request.url) == f"{OPENROUTER_URL}/embeddings"
    assert request.headers["Authorization"] == "Bearer sk-or-test"
    assert request.headers["X-OpenRouter-Title"] == "Metaculus"
    assert request.headers["HTTP-Referer"]
    assert body["model"] == EMBEDDING_MODEL
    assert_routed(body, LLMFeature.EMBEDDINGS_SEARCH)


def test_falls_back_to_openai_without_openrouter_key(openrouter, settings):
    settings.OPENROUTER_API_KEY = None
    settings.OPENAI_API_KEY = "sk-openai-test"

    generate_text_embed_vector("text", LLMFeature.EMBEDDINGS_ITN)

    request, body = openrouter.last
    assert str(request.url) == "https://api.openai.com/v1/embeddings"
    assert request.headers["Authorization"] == "Bearer sk-openai-test"
    assert "provider" not in body
    assert "user" not in body


def test_async_embeddings_are_tagged(openrouter):
    vector = asyncio.run(
        generate_text_embed_vector_async("query", LLMFeature.EMBEDDINGS_SEARCH)
    )

    request, body = openrouter.last
    assert vector == [0.1]
    assert str(request.url) == f"{OPENROUTER_URL}/embeddings"
    assert_routed(body, LLMFeature.EMBEDDINGS_SEARCH)


def test_spam_content_analysis_is_tagged(openrouter):
    openrouter.content = json.dumps(
        {"is_spam": True, "reason": "sells watches", "confidence": 0.9}
    )

    result = run_spam_analysis("cheap watches", "comment")

    _, body = openrouter.last
    assert result.is_spam is True
    assert body["model"] == CHAT_MODEL
    assert_routed(body, LLMFeature.SPAM_CONTENT)


def test_spam_bio_check_is_tagged(openrouter):
    openrouter.content = "Sells replica watches.\nTRUE"

    is_spam, _ = asyncio.run(ask_gpt_to_check_profile_for_spam("bio"))

    request, body = openrouter.last
    assert is_spam is True
    assert str(request.url) == f"{OPENROUTER_URL}/chat/completions"
    assert body["model"] == CHAT_MODEL
    assert_routed(body, LLMFeature.SPAM_BIO)


def test_key_factors_are_tagged_with_low_reasoning(openrouter):
    openrouter.content = json.dumps(
        {
            "key_factors": [
                {"type": "driver", "text": "Rates fall", "impact_direction": 1}
            ]
        }
    )

    result = generate_keyfactors(
        question_summary="Title: Will rates fall?",
        comment="Inflation is cooling",
        existing_key_factors=[],
        type_instructions=get_impact_type_instructions(
            Question.QuestionType.BINARY, False
        ),
    )

    _, body = openrouter.last
    assert len(result) == 1
    assert body["model"] == CHAT_MODEL
    assert body["reasoning_effort"] == "low"
    assert body["response_format"]["json_schema"]["strict"] is False
    assert_routed(body, LLMFeature.KEY_FACTORS)


def test_question_units_are_tagged(openrouter):
    question = Question(id=1, title="US unemployment rate", resolution_criteria="BLS")
    openrouter.content = json.dumps({"1": "%"})

    units = generate_units([question])

    _, body = openrouter.last
    assert units == {question: "%"}
    assert body["model"] == CHAT_MODEL
    assert_routed(body, LLMFeature.QUESTION_UNITS)
