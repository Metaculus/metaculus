from django.core.management.base import BaseCommand

from migrator.services.migrate_users import migrate_users


class Command(BaseCommand):
    help = """
    Migrates old database data to the new one
    """

    def handle(self, *args, **options):
        migrate_users()
