import logging
import time
from multiprocessing import Pool, Manager

import django
from django.core.management.base import BaseCommand

from posts.models import Post
from posts.services.search import update_post_search_embedding_vector

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
        total = len(post_ids)

        num_processes = options["num_processes"]
        chunk_size = total // num_processes

        tm = time.time()

        if not chunk_size:
            return

        # Split post_ids into chunks for each process
        post_id_chunks = [
            post_ids[i : i + chunk_size] for i in range(0, total, chunk_size)
        ]

        with Manager() as manager:
            with Pool(processes=num_processes, initializer=django.setup) as pool:
                pool.starmap(
                    process_posts,
                    [
                        (chunk, worker_idx)
                        for worker_idx, chunk in enumerate(post_id_chunks)
                    ],
                )

        print(f"\nCompleted processing {total} records in {round(time.time() - tm)}s")
