import time

from django.core.management.base import BaseCommand

from scoring.reputations import rebuild_peer_reputations


class Command(BaseCommand):
    help = """
    Rebuilds every Reputation row from historical Score data. Run once after
    the migration that creates the table; resolutions keep it current after
    that. Re-running is safe: existing rows are deleted and recomputed.
    """

    def handle(self, *args, **options):
        start = time.time()
        rows = rebuild_peer_reputations()
        self.stdout.write(f"Wrote {rows} Reputation rows in {time.time() - start:.1f}s")
