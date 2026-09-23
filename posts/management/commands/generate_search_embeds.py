import logging
import time

from django.core.management.base import BaseCommand

from misc.services.itn import generate_related_articles_for_post
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
            # Matches computed from the previous vector no longer apply
            generate_related_articles_for_post(post)
            if idx % 10 == 0:
                print(
                    f"[W{worker_idx}] Processed total {idx} of {len(post_ids)} records"
                )
        except Exception:
            logger.exception("Error during generation of the vector")


class Command(BaseCommand):
    help = (
        "Generates search embeds for posts that have none. With --all, regenerates "
        "them for every post, e.g. after the embedded content changes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--num_processes",
            type=int,
            default=1,
            help="Number of processes to use for processing (default: 1)",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Regenerate every post's embedding, not only missing ones",
        )
        parser.add_argument(
            "--open",
            action="store_true",
            help="Only posts that have not closed yet",
        )

    def handle(self, *args, **options):
        qs = Post.objects.all()
        if not options["all"]:
            qs = qs.filter(embedding_vector__isnull=True)
        if options["open"]:
            qs = qs.filter_published().filter(
                actual_close_time__isnull=True, resolved=False
            )

        post_ids = list(qs.order_by("-id").values_list("id", flat=True))

        tm = time.time()

        parallel_command_executor(
            post_ids, process_posts, num_processes=options["num_processes"]
        )

        print(
            f"\nCompleted processing {len(post_ids)} records in {round(time.time() - tm)}s"
        )
