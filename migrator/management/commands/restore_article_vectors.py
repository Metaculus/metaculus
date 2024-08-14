import json
import logging

from django.core.management.base import BaseCommand

from misc.models import ITNArticle

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Restores ITN article vectors from a certain dump
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
            qs = ITNArticle.objects.all()

            for idx, article in enumerate(qs.iterator(chunk_size=chunk_size)):
                article.embedding_vector = mapping.get(article.aid)

                batch.append(article)

                if idx % chunk_size == 0:
                    logger.info(
                        f"[ITNArticle Vectors Import] Imported {idx + 1}/{qs.count()}"
                    )

                    ITNArticle.objects.bulk_update(batch, fields=["embedding_vector"])
                    batch = []

        ITNArticle.objects.bulk_update(batch, fields=["embedding_vector"])
