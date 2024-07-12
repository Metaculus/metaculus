from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_questions import (
    migrate_questions,
    migrate_questions__notebook,
    migrate_post_user_snapshots,
    migrate_post_snapshots_forecasts,
)

from ...services.migrate_permissions import migrate_permissions
from ...services.post_migrate import (
    post_migrate_calculate_divergence,
    post_migrate_movements,
)
from ...utils import paginated_query, reset_sequence


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        post_migrate_movements()
        # migrate_post_user_snapshots()
        # migrate_post_snapshots_forecasts()
        # Reset sql sequences
        reset_sequence()
