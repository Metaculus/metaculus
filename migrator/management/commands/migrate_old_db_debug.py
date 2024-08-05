from django.core.management.base import BaseCommand
from django.db import connection

from migrator.services.migrate_subscriptions import migrate_subscriptions


class Command(BaseCommand):
    help = """
    A small debug command to play around with your current migration script stage
    """

    def handle(self, *args, **options):
        site_ids = [1]
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM posts_postsubscription;")
            cursor.execute("DELETE FROM projects_projectsubscription;")

        migrate_subscriptions(site_ids)
