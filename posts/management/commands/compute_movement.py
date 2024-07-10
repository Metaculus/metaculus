import logging

from django.core.management.base import BaseCommand
from django.db.models import Q

from ...models import Post
from ...services import compute_movement

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Computes post movement
    """

    def handle(self, *args, **options):
        qs = (
            Post.objects.filter_active()
            .filter(
                Q(question__isnull=False)
                | Q(group_of_questions__isnull=False)
                | Q(conditional__isnull=False)
            )
            .prefetch_questions()
        )
        total = qs.count()

        posts = []

        for idx, post in enumerate(qs.iterator(100)):
            try:
                post.movement = compute_movement(post)
            except:
                logger.exception(f"Error during compute_movement for post_id {post.id}")
                continue

            posts.append(post)

            if len(posts) >= 100:
                Post.objects.bulk_update(posts, fields=["movement"])
                posts = []

            if not idx % 100:
                logger.info(f"Processed {idx + 1}/{total}. ")
