from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_questions import (
    migrate_questions,
    migrate_questions__notebook,
)

from ...services.migrate_permissions import migrate_permissions
from ...utils import paginated_query, reset_sequence


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        migrate_questions()
        # Reset sql sequences
        reset_sequence()
