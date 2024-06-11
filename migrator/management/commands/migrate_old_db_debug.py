from django.core.management.base import BaseCommand
from django.db import connection

from .migrate_old_db import Command as MigrateCommand
from ...services.migrate_questions import migrate_questions


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Replace with the table you're working with right now
            cursor.execute("DELETE FROM questions_forecast")
            cursor.execute("DELETE FROM posts_post_projects")
            cursor.execute("DELETE FROM posts_vote")
            cursor.execute("DELETE FROM comments_comment")
            cursor.execute("DELETE FROM posts_post")
            cursor.execute("DELETE FROM questions_conditional")
            cursor.execute("DELETE FROM questions_question")

        # Function
        migrate_questions()

        # Reset sql sequences
        MigrateCommand._reset_sequence()
