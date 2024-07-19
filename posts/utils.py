import logging

from posts.models import Post
from utils.openai import generate_text_embed_vector

logger = logging.getLogger(__name__)


def generate_post_content_for_embedded_vectorization(post: Post):
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


def update_post_search_embedded_vector(post: Post):
    content = generate_post_content_for_embedded_vectorization(post)
    vector = generate_text_embed_vector(content)

    post.embedded_vector = vector
    post.save()
