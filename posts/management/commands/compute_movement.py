import logging

from django.core.management.base import BaseCommand

from ...tasks import run_compute_movement

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Computes post movement
    """

    def handle(self, *args, **options):
        run_compute_movement()
