import logging

from django.core.management.base import BaseCommand

from ...services.common import compute_hotness

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Computes post hotness
    """

    def handle(self, *args, **options):
        compute_hotness()
