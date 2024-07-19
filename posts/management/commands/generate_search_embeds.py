import logging
import time

from django.core.management.base import BaseCommand

from posts.models import Post
from posts.utils import update_post_search_embedded_vector

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Generates search embeds"

    def handle(self, *args, **options):
        posts = Post.objects.all()
        total = posts.count()
        tm = time.time()

        for idx, post in enumerate(
            Post.objects.filter(embedded_vector__isnull=True)
            .order_by("-id")
            .iterator(chunk_size=100)
        ):
            try:
                update_post_search_embedded_vector(post)
            except Exception:
                logger.exception("Error during generation of the vector")

                continue

            print(
                f"Processed {int(idx + 1 / total * 100)}% ({idx + 1}/{total})"
                f" questions. Overall duration: {round(time.time() - tm)}s",
                end="\r",
            )
