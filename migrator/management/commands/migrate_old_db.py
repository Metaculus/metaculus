from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_comments import migrate_comments
from migrator.services.migrate_forecasts import migrate_forecasts
from migrator.services.migrate_permissions import migrate_permissions
from migrator.services.migrate_projects import migrate_projects
from migrator.services.migrate_questions import migrate_questions
from migrator.services.migrate_users import migrate_users
from migrator.services.migrate_votes import migrate_votes
from migrator.utils import reset_sequence

from migrator.services.migrate_scoring import score_questions
from migrator.services.migrate_leaderboards import (
    create_global_leaderboards,
    populate_global_leaderboards,
    # populate_project_leaderboards,
)


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
        # migrate_forecasts(3e5) # only migrate 300k forecasts
        migrate_forecasts()
        print("Migrated forecasts")
        migrate_projects()
        print("Migrated projects")
        migrate_votes()
        print("Migrated votes")
        migrate_comments()
        print("Migrated comments")
        migrate_permissions()
        print("Migrated permissions")

        # scoring
        # score_questions(qty=1000)  # only evaluate 1000 questions
        score_questions()
        print("Scored questions")
        create_global_leaderboards()
        print("Created global leaderboards")
        populate_global_leaderboards()
        print("Populated global leaderboards")
        # populate_project_leaderboards()
        # print("Populated project leaderboards")

        # Reset sql sequences
        reset_sequence()
