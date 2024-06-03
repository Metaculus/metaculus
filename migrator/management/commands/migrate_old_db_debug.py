from django.core.management.base import BaseCommand
from django.db import connection

from .migrate_old_db import Command as MigrateCommand


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Replace with the table you're working with right now
            cursor.execute("DELETE FROM comments_comment")

        # Function
        # migrate_comments()

        # Reset sql sequences
        MigrateCommand._reset_sequence()
