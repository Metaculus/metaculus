import time

from django.core.management.base import BaseCommand
from django.db.models import F

from users.models import User

BATCH_SIZE = 5000


def backfill_username_set_at(batch_size=BATCH_SIZE, sleep=0.0, stdout=None):
    """
    Stamp existing accounts whose username_set_at is NULL with their creation
    date, so they are treated as human-set. Only new social-auth signups should
    stay NULL going forward.

    Runs in pk-bounded batches, each its own autocommitted UPDATE (commands run
    in autocommit mode), so it never holds a long transaction or a table-wide
    lock. Idempotent and resumable: only rows still NULL are touched.
    """
    max_pk = (
        User.objects.filter(username_set_at__isnull=True)
        .order_by("-pk")
        .values_list("pk", flat=True)
        .first()
    )
    if max_pk is None:
        return 0

    updated = 0
    start = 0
    while start <= max_pk:
        count = User.objects.filter(
            username_set_at__isnull=True, pk__gte=start, pk__lt=start + batch_size
        ).update(username_set_at=F("date_joined"))
        updated += count

        if stdout and count:
            stdout.write(f"  backfilled {updated} (through pk {start + batch_size})")

        start += batch_size
        if sleep:
            time.sleep(sleep)

    return updated


class Command(BaseCommand):
    help = "Backfill User.username_set_at = date_joined for existing NULL rows."

    def add_arguments(self, parser):
        parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
        parser.add_argument(
            "--sleep",
            type=float,
            default=0.0,
            help="Seconds to sleep between batches to throttle DB load.",
        )

    def handle(self, *args, **options):
        updated = backfill_username_set_at(
            batch_size=options["batch_size"],
            sleep=options["sleep"],
            stdout=self.stdout,
        )
        self.stdout.write(self.style.SUCCESS(f"Done. Backfilled {updated} users."))
