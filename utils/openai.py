from django.conf import settings
from openai import OpenAI


def get_openai_client():
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_text_embed_vector(text: str):
    response = get_openai_client().embeddings.create(input=text, model="text-embedding-ada-002")
    vector = response.data[0].embedding

    return vector
