import logging

from django.core.management.base import BaseCommand

from ...jobs import job_compute_movement

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Computes post movement
    """

    def handle(self, *args, **options):
        job_compute_movement()
