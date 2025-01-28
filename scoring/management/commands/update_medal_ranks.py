import logging
from django.utils import timezone
import datetime
from django.core.management.base import BaseCommand, CommandParser

from scoring.utils import update_medal_points_and_ranks

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Compute the medals ranks for all users
    """

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--year",
            default=None,
            type=int,
            help="The year for which to compute and update the medals ranks. The highest ranks fields will be updated only in the cases when the ranks for this year are better.",
        )

    def handle(self, *args, **options):
        now = timezone.now()
        at_time = now
        if options["year"]:
            at_time = timezone.datetime(
                options["year"], 12, 31, 23, 59, 59, tzinfo=datetime.timezone.utc
            )
        if at_time > now:
            at_time = now
        print(f"Updating ranks as of {at_time}")
        update_medal_points_and_ranks(at_time)
