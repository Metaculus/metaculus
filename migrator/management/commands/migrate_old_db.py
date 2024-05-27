from django.core.management.base import BaseCommand
from django.db import transaction

from migrator.services.migrate_users import migrate_users
from migrator.services.migrate_questions import migrate_questions
from migrator.services.migrate_projects import migrate_projects
from migrator.services.migrate_forecasts import migrate_forecasts

class Command(BaseCommand):
    help = """
    Migrates old database data to the new one
    """

    def handle(self, *args, **options):
        migrate_users()
        migrate_questions()
        migrate_forecasts()
        migrate_projects()
