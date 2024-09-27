import logging
import time

from misc.models import ITNArticle
from misc.services.itn import (
    update_article_embedding_vector,
    sync_itn_news,
    clear_old_itn_news,
)
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


def sync_itn_articles(num_processes: int = 1):
    # Sync fresh ITN news
    sync_itn_news()

    # Remove old articles
    clear_old_itn_news()

    # Generate embedding vectors
    article_ids = list(
        ITNArticle.objects.filter(embedding_vector__isnull=True).values_list(
            "id", flat=True
        )
    )

    tm = time.time()

    logger.info("Running ITN articles embeddings generation")

    parallel_command_executor(
        article_ids,
        generate_embedding_vectors__worker,
        num_processes=num_processes,
    )

    print(
        f"\nCompleted processing {len(article_ids)} records in {round(time.time() - tm)}s"
    )
