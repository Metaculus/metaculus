from django.core.management.base import BaseCommand
from django.db import connection

from .migrate_old_db import Command as MigrateCommand
from ...services.migrate_permissions import migrate_permissions
from ...services.migrate_questions import migrate_questions


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Replace with the table you're working with right now
            pass

            cursor.execute("DELETE FROM projects_projectuserpermission")
            cursor.execute("DELETE FROM posts_post_projects USING projects_project "
                           "WHERE posts_post_projects.project_id = projects_project.id AND projects_project.type = 'personal_list';")
            cursor.execute("DELETE FROM projects_project WHERE type = 'personal_list'")

        print("Starting migration script")

        # Function
        migrate_permissions()

        # Reset sql sequences
        MigrateCommand._reset_sequence()
