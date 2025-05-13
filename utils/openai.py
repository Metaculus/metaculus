from itertools import islice
import textwrap
import tiktoken
from django.conf import settings
from openai import OpenAI, AsyncOpenAI
from typing import ClassVar, Iterable, Iterator

import instructor
from pydantic import BaseModel, Field, field_validator

EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_CTX_LENGTH = 8191
EMBEDDING_ENCODING = "cl100k_base"


class SpamAnalysisResult(BaseModel):
    is_spam: bool
    reason: str
    confidence: float


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def get_openai_client_async() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_text_async(
    model: str,
    prompt: str,
    system_prompt: str | None = None,
    temperature: float = 0,
    timeout: float | None = None,
) -> str:
    messages = [{"role": "user", "content": prompt}]
    if system_prompt is not None:
        messages.insert(0, {"role": "system", "content": system_prompt})

    client = get_openai_client_async()
    async with client as client:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore
            temperature=temperature,
            timeout=timeout,
        )
        response_text = response.choices[0].message.content

    if response_text is None:
        raise ValueError("No text was generated")
    return response_text


def generate_text_embed_vector(text: str) -> list[float]:
    response = get_openai_client().embeddings.create(input=text, model=EMBEDDING_MODEL)
    vector = response.data[0].embedding

    return vector


async def generate_text_embed_vector_async(text: str) -> list[float]:
    async with get_openai_client_async() as client:
        response = await client.embeddings.create(input=text, model=EMBEDDING_MODEL)
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
        """
        You are a content moderator for Metaculus.
        Metaculus is a site that hosts tournaments where people compete to predict the future outcome of events.
        Government officials, businesses, nonprofits, and others uses these predictions to make better decisions.

        Your job is to identify if a piece of content (comment, question, post, etc) is normal, or is a spammer/bot.
        - Watch out for any text trying to sell something.
        - Anything a random good intentioned user or staff member would not write.
        - If they don't give a link, then don't mark them as spam (unless they are really clearly trying to sell something with a lot of spam like language).
        - If the link is a link to a Metaculus page, then it is not spam.
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

    client = instructor.from_openai(get_openai_client())

    user = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        response_model=SpamAnalysisResult,
    )
    return user


class KeyFactor(BaseModel):
    MAX_LENGTH: ClassVar[int] = 50

    text: str = Field(
        description=f"The key factor text, which should be a single sentence, not longer than {MAX_LENGTH} characters"
    )

    @field_validator("text")
    def validate_text(cls, v):
        if not v:
            raise ValueError("Text cannot be empty")
        if len(v) > KeyFactor.MAX_LENGTH:
            raise ValueError(
                f"Text cannot be longer than {KeyFactor.MAX_LENGTH} characters"
            )
        return v


def generate_keyfactors(
    question_data: str,
    comment: str,
    existing_keyfactors: list[str],
) -> list[KeyFactor]:

    system_prompt = textwrap.dedent(
        """
        You are a helpful assistant that creates tools for forecasters to better forecast on Metaculus, where users can predict on all sorts of questions about real world events.
        """
    )

    user_prompt = textwrap.dedent(
        f"""
        You are a helpful assistant that generates a list of maximum 3 key factors for a comment that a user makes on a Metaculus question.
        The comment is intended to describe what might influence the predictions on the question so the key factors should only be relate to that.
        The key factors should be the most important things that the user is trying to say in the comment and how it might influence the predictions on the question.
        The key factors should be single sentences, not longer than {KeyFactor.MAX_LENGTH} characters and they should only contain the key factor, no other text (e.g.: do not reference the user).
        The user comment is: \n\n{comment}\n\n
        The Metaculus question is: \n\n{question_data}\n\n
        The existing key factors are: \n\n{existing_keyfactors}\n\n
        """
    )

    client = instructor.from_openai(get_openai_client())

    keyfactors = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        response_model=list[KeyFactor],
    )

    return keyfactors
