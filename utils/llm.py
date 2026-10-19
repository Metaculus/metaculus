import textwrap
from enum import StrEnum
from itertools import islice
from typing import Iterable, Iterator

import tiktoken
from django.conf import settings
from openai import OpenAI, AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# Prefer OpenAI-hosted endpoints; skip endpoints that don't support every sent param
OPENROUTER_PROVIDER = {"order": ["openai"], "require_parameters": True}

EMBEDDING_MODEL = "openai/text-embedding-3-large"
EMBEDDING_CTX_LENGTH = 8191
EMBEDDING_ENCODING = "cl100k_base"

TRUSTED_URL_DOMAINS = [
    "*.gov",
    "nytimes.com",
    "cnn.com",
    "msn.com",
    "foxnews.com",
    "theguardian.com",
    "aljazeera.com, bbc.com",
    "dailymail.co.uk",
    "yahoo.com",
    "cnbc.com",
    "usatoday.com",
    "apnews.com",
    "nypost.com",
    "newsweek.com",
    "reuters.com",
    "forbes.com",
    "cbc.ca",
    "wsj.com",
    "nbcnews.com",
    "washingtonpost.com",
    "businessinsider.com",
    "independent.co.uk",
    "cbsnews.com",
    "telegraph.co.uk",
    "abc.net.au",
    "news.com.au",
    "abcnews.go.com",
    "thesun.co.uk",
    "bloomberg.com",
    "politico.com",
    "express.co.uk",
    "news.sky.com",
    "scholar.google.com",
    "stor.org",
    "doaj.org",
    "webofknowledge.com",
    "scopus.com",
    "sciencedirect.com",
    "core.ac.uk",
    "ncbi.nlm.nih.gov/pubmed/",
    "ieeexplore.ieee.org",
    "eric.ed.gov",
    "ssrn.com",
    "arxiv.org",
    "plos.org",
    "opendoar.org",
    "zenodo.org",
    "elsevier.com",
    "springer.com",
    "onlinelibrary.wiley.com",
    "taylorandfrancis.com",
    "journals.sagepub.com",
    "dl.acm.org",
    "academic.oup.com",
    "cambridge.org",
    "proquest.com",
]


class SpamAnalysisResult(BaseModel):
    is_spam: bool
    reason: str
    confidence: float


class LLMFeature(StrEnum):
    """Sent as `user`; OpenRouter Activity breaks spend down by it."""

    KEY_FACTORS = "key-factors"
    SPAM_CONTENT = "spam-content"
    SPAM_BIO = "spam-bio"
    QUESTION_UNITS = "question-units"
    EMBEDDINGS_SEARCH = "embeddings-search"
    EMBEDDINGS_ITN = "embeddings-itn"


def _client_options() -> dict:
    return {
        "base_url": OPENROUTER_BASE_URL,
        # "" blocks the SDK's fallback to the OPENAI_API_KEY env var
        "api_key": settings.OPENROUTER_API_KEY or "",
        "default_headers": {
            "HTTP-Referer": settings.PUBLIC_APP_URL,
            "X-OpenRouter-Title": "Metaculus",
        },
    }


def get_llm_client() -> OpenAI:
    return OpenAI(**_client_options())


def get_llm_client_async() -> AsyncOpenAI:
    return AsyncOpenAI(**_client_options())


def llm_options(feature: LLMFeature) -> dict:
    return {"user": feature, "extra_body": {"provider": OPENROUTER_PROVIDER}}


async def generate_text_async(
    model: str,
    prompt: str,
    feature: LLMFeature,
    system_prompt: str | None = None,
    timeout: float | None = None,
) -> str:
    messages: list[ChatCompletionMessageParam] = [{"role": "user", "content": prompt}]
    if system_prompt is not None:
        messages.insert(0, {"role": "system", "content": system_prompt})

    client = get_llm_client_async()
    async with client as client:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            timeout=timeout,
            **llm_options(feature),
        )
        response_text = response.choices[0].message.content

    if response_text is None:
        raise ValueError("No text was generated")
    return response_text


def generate_text_embed_vector(text: str, feature: LLMFeature) -> list[float]:
    response = get_llm_client().embeddings.create(
        input=text, model=EMBEDDING_MODEL, **llm_options(feature)
    )
    vector = response.data[0].embedding

    return vector


async def generate_text_embed_vector_async(
    text: str, feature: LLMFeature
) -> list[float]:
    async with get_llm_client_async() as client:
        response = await client.embeddings.create(
            input=text,
            model=EMBEDDING_MODEL,
            # Set a timeout not to block worker
            timeout=5,
            **llm_options(feature),
        )
    vector = response.data[0].embedding

    return vector


def batched(iterable: Iterable, n: int) -> Iterator[tuple]:
    if n < 1:
        raise ValueError("n must be at least one")
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch


def chunked_tokens(text: str) -> Iterator[tuple[int]]:
    encoding = tiktoken.get_encoding(EMBEDDING_ENCODING)
    tokens = encoding.encode(text)
    chunks_iterator = batched(tokens, EMBEDDING_CTX_LENGTH)

    yield from chunks_iterator


def run_spam_analysis(text: str, content_type: str) -> SpamAnalysisResult:
    system_prompt = textwrap.dedent(
        f"""
        You are a content moderator for Metaculus.
        Metaculus is a site that hosts tournaments where people compete to predict the future outcome of events.
        Government officials, businesses, nonprofits, and others uses these predictions to make better decisions.

        Your job is to identify if a piece of content (comment, question, post, etc) is normal, or is a spammer/bot.
        - Watch out for any text trying to sell something.
        - Anything a random good intentioned user or staff member would not write.
        - If they don't give a link, then don't mark them as spam (unless they are really clearly trying to sell something with a lot of spam like language).
        - If the link is a link to a Metaculus page, or is a trusted link, then it should not count to the spam assessment.
          Here are what we currently consider trusted URL domains: {", ".join(TRUSTED_URL_DOMAINS)}
        """
    )

    user_prompt = textwrap.dedent(
        f"""
        Analyse the following piece of text which is a {content_type} on Metaculus website and determine if it is spam or not.
        If it is spam, provide a reason for your answer and a confidence score between 0 and 1.
        Text:

        {text}
        """
    )

    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    response = get_llm_client().chat.completions.parse(
        model="openai/gpt-6-luna",
        messages=messages,
        response_format=SpamAnalysisResult,
        **llm_options(LLMFeature.SPAM_CONTENT),
    )
    result = response.choices[0].message.parsed

    if result is None:
        raise ValueError("No spam analysis was generated")
    return result
