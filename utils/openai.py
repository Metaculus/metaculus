from itertools import islice

import tiktoken
from django.conf import settings
from openai import OpenAI, AsyncOpenAI

EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_CTX_LENGTH = 8191
EMBEDDING_ENCODING = "cl100k_base"


def get_openai_client():
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def get_openai_client_async():
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def generate_text_embed_vector(text: str):
    response = get_openai_client().embeddings.create(input=text, model=EMBEDDING_MODEL)
    vector = response.data[0].embedding

    return vector


async def generate_text_embed_vector_async(text: str):
    response = await get_openai_client_async().embeddings.create(
        input=text, model=EMBEDDING_MODEL
    )
    vector = response.data[0].embedding

    return vector


def batched(iterable, n):
    if n < 1:
        raise ValueError("n must be at least one")
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch


def chunked_tokens(text):
    encoding = tiktoken.get_encoding(EMBEDDING_ENCODING)
    tokens = encoding.encode(text)
    chunks_iterator = batched(tokens, EMBEDDING_CTX_LENGTH)

    yield from chunks_iterator
