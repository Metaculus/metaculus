import logging

import numpy as np

from posts.models import Post
from utils.openai import (
    generate_text_embed_vector,
    chunked_tokens,
)

logger = logging.getLogger(__name__)


def generate_post_content_for_embedding_vectorization(post: Post):
    """
    Generates a composed Post content to be indexed by openai
    """

    question_chunks = []
    notebook_content = None

    for question in post.get_questions():
        chunks = [
            question.title,
            question.description,
            question.resolution_criteria_description,
            question.fine_print,
        ]
        question_chunks.append("\n".join([x for x in chunks if x]))

    questions_content = "\n\n".join(question_chunks)

    if post.notebook:
        notebook_content = post.notebook.markdown

    # Ensure we won't duplicate titles
    if post.title == questions_content:
        questions_content = None

    post_chunks = [post.title, questions_content, notebook_content]

    return "\n\n".join([x for x in post_chunks if x])


def update_post_search_embedding_vector(post: Post):
    content = generate_post_content_for_embedding_vectorization(post)
    chunk_embeddings = []

    # Step 1: generate embedding chunks
    for chunk in chunked_tokens(content):
        chunk_embeddings.append(generate_text_embed_vector(chunk))

    # Step 2: weight them
    vector = np.average(
        chunk_embeddings, axis=0, weights=[len(ch) for ch in chunk_embeddings]
    )

    post.embedding_vector = vector
    post.save()
