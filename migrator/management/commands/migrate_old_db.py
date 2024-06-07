from io import StringIO

from django.apps import apps
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_forecasts import migrate_forecasts
from migrator.services.migrate_projects import migrate_projects
from migrator.services.migrate_questions import migrate_questions
from migrator.services.migrate_users import migrate_users
from migrator.services.migrate_votes import migrate_votes
from migrator.services.migrate_comments import migrate_comments


class Command(BaseCommand):
    help = """
    Migrates old database data to the new one
    """

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("DROP SCHEMA public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
        call_command("makemigrations")
        call_command("migrate")

        migrate_users()
        print("Migrated users")
        migrate_questions()
        print("Migrated questions")
        migrate_forecasts()
        print("Migrated forecasts")
        migrate_projects()
        print("Migrated projects")
        migrate_votes()
        print("Migrated votes")
        migrate_comments()
        print("Migrated comments")

        # Reset sql sequences
        self._reset_sequence()

    @staticmethod
    def _reset_sequence():
        # Resetting DB auto-incremented sequences of Primary keys
        # Very important since migrate objects keeping their ids
        cursor = connection.cursor()

        for app in apps.get_app_configs():
            label = app.label
            commands = StringIO()
            call_command("sqlsequencereset", label, stdout=commands)

            if sql_query := commands.getvalue():
                cursor.execute(sql_query)
