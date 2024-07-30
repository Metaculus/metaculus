import json
import logging

from django.core.management.base import BaseCommand

from posts.models import Post

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Restores post vectors from a certain dump
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "vectors_path",
            type=str,
            help="Path to the vectors dump",
        )

    def handle(self, *args, vectors_path: str = None, **options):
        with open(vectors_path) as f:
            mapping = json.load(f)
            mapping = {int(k): v for k, v in mapping.items()}

            batch = []
            chunk_size = 100
            qs = Post.objects.all()

            for idx, post in enumerate(qs.iterator(chunk_size=chunk_size)):
                post.embedding_vector = mapping.get(post.id)

                batch.append(post)

                if idx % chunk_size == 0:
                    logger.info(
                        f"[Post Vectors Import] Imported {idx + 1}/{qs.count()}"
                    )

                    Post.objects.bulk_update(batch, fields=["embedding_vector"])
                    batch = []

        Post.objects.bulk_update(batch, fields=["embedding_vector"])
