import logging

from django.core.management.base import BaseCommand

from community_migration.services import migrate

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Migrate ForPol project"

    def handle(self, *args, **options):
        migrate()
