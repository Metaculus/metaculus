import logging
import time

from django.core.management.base import BaseCommand

from posts.models import Post
from posts.services.search import update_post_search_embedding_vector
from utils.management import parallel_command_executor

logger = logging.getLogger(__name__)


def process_posts(post_ids, worker_idx):
    for idx, post in enumerate(
        Post.objects.filter(id__in=post_ids).iterator(chunk_size=100)
    ):
        try:
            update_post_search_embedding_vector(post)
            if idx % 10 == 0:
                print(
                    f"[W{worker_idx}] Processed total {idx} of {len(post_ids)} records"
                )
        except Exception:
            logger.exception("Error during generation of the vector")


class Command(BaseCommand):
    help = "Generates search embeds"

    def add_arguments(self, parser):
        parser.add_argument(
            "--num_processes",
            type=int,
            default=1,
            help="Number of processes to use for processing (default: 10)",
        )

    def handle(self, *args, **options):
        post_ids = list(
            Post.objects.filter(embedding_vector__isnull=True)
            .order_by("-id")
            .values_list("id", flat=True)
        )

        tm = time.time()

        parallel_command_executor(
            post_ids, process_posts, num_processes=options["num_processes"]
        )

        print(
            f"\nCompleted processing {len(post_ids)} records in {round(time.time() - tm)}s"
        )
