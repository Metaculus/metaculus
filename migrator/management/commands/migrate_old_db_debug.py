from django.core.management import call_command
from django.core.management.base import BaseCommand

from posts.jobs import job_compute_movement
from ...utils import reset_sequence


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        job_compute_movement()
        call_command("build_forecasts")

        # Reset sql sequences
        reset_sequence()
