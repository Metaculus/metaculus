import logging

from django.core.management.base import BaseCommand

from misc.jobs import sync_itn_articles

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sync ITN news and find similar posts"

    def add_arguments(self, parser):
        parser.add_argument(
            "--num_processes",
            type=int,
            default=1,
            help="Number of processes to use for processing (default: 10)",
        )

    def handle(self, *args, num_processes: int = 1, **options):
        sync_itn_articles(num_processes=num_processes)
