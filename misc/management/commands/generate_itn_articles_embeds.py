import logging
import time

from django.core.management.base import BaseCommand

from misc.models import ITNArticle
from misc.services.itn import update_article_embedding_vector
from utils.management import parallel_command_executor

logger = logging.getLogger(__name__)


def generate_embedding_vectors__worker(ids, worker_idx):
    for idx, article in enumerate(
        ITNArticle.objects.filter(id__in=ids).iterator(chunk_size=100)
    ):
        try:
            update_article_embedding_vector(article)
            if idx % 10 == 0:
                print(f"[W{worker_idx}] Processed total {idx} of {len(ids)} records")
        except Exception:
            logger.exception("Error during generation of the vector")


class Command(BaseCommand):
    help = "Generates search embeds for ITN articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--num_processes",
            type=int,
            default=1,
            help="Number of processes to use for processing (default: 10)",
        )

    def handle(self, *args, **options):
        article_ids = list(
            ITNArticle.objects.filter(embedding_vector__isnull=True).values_list(
                "id", flat=True
            )
        )

        tm = time.time()

        parallel_command_executor(
            article_ids,
            generate_embedding_vectors__worker,
            num_processes=options["num_processes"],
        )

        print(
            f"\nCompleted processing {len(article_ids)} records in {round(time.time() - tm)}s"
        )
