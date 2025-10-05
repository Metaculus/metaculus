import logging
import time

from misc.models import ITNArticle
from misc.services.itn import (
    update_article_embedding_vector,
    sync_itn_news,
    clear_old_itn_news,
    check_itn_enabled,
    generate_related_posts_for_article,
)
from utils.management import parallel_command_executor

logger = logging.getLogger(__name__)


def index_itn_articles__worker(ids, worker_idx):
    for idx, article in enumerate(
        ITNArticle.objects.filter(id__in=ids).iterator(chunk_size=100)
    ):
        try:
            update_article_embedding_vector(article)

            # Generate list of similar posts
            generate_related_posts_for_article(article)

            if idx % 100 == 0:
                logger.info(
                    f"[W{worker_idx}] ITN Articles sync: Processed {idx}/{len(ids)} records"
                )
        except Exception:
            logger.exception("Error during generation of the vector")


def sync_itn_articles(num_processes: int = 1):
    if not check_itn_enabled():
        return

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
        index_itn_articles__worker,
        num_processes=num_processes,
    )

    print(
        f"\nCompleted processing {len(article_ids)} records in {round(time.time() - tm)}s"
    )
