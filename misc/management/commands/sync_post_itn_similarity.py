import logging
import time
from datetime import timedelta, datetime

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.timezone import make_aware

from misc.models import ITNArticle
from misc.services.itn import generate_related_posts_for_article

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sync PostArticle similarity records for ITN Articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--min_created_at",
            type=str,
            help="Minimum created_at date in YYYY-MM-DD format",
            default=(timezone.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        )

    def handle(self, *args, **options):
        min_created_at_str = options["min_created_at"]
        min_created_at = datetime.strptime(min_created_at_str, "%Y-%m-%d")

        articles = ITNArticle.objects.filter(created_at__gt=make_aware(min_created_at))
        articles_count = articles.count()
        tm = time.time()

        logger.info(
            f"Generating PostArticle relations from {articles_count} ITN Articles"
        )
        chunk_size = 100

        for idx, article in enumerate(articles.iterator(chunk_size)):
            generate_related_posts_for_article(article)

            if idx % 100 == 0:
                logger.info(
                    f"Processed {idx + 1}/{articles_count} ITN Articles in {round(time.time() - tm, 2)} seconds"
                )
                tm = time.time()

        logger.info(f"Done generating PostArticle relations")
