import datetime
from django.core.management.base import BaseCommand

from comments.services.common import update_top_comments_of_week


class Command(BaseCommand):
    help = "Update top comments of the week for multiple weeks going backwards from a start date"

    def add_arguments(self, parser):
        parser.add_argument(
            "week_start_date",
            type=str,
            help="Start date for the week in YYYY-MM-DD format (e.g., 2024-01-01)",
        )
        parser.add_argument(
            "weeks_count",
            type=int,
            help="Number of weeks to process going backwards from the start date",
        )

    def handle(self, *args, **options):
        try:
            # Parse the week start date
            week_start_date = datetime.datetime.strptime(
                options["week_start_date"], "%Y-%m-%d"
            ).date()
        except ValueError:
            self.stdout.write(
                self.style.ERROR(
                    f"Invalid date format: {options['week_start_date']}. "
                    "Please use YYYY-MM-DD format (e.g., 2024-01-01)"
                )
            )
            return

        weeks_count = options["weeks_count"]

        if weeks_count <= 0:
            self.stdout.write(
                self.style.ERROR("weeks_count must be a positive integer")
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Starting to update top comments for {weeks_count} weeks "
                f"starting from {week_start_date}"
            )
        )

        # Process each week going backwards from the start date
        for i in range(weeks_count):
            current_week_start = week_start_date - datetime.timedelta(weeks=i)

            self.stdout.write(
                f"Processing week starting {current_week_start} "
                f"({i + 1}/{weeks_count})"
            )

            try:
                update_top_comments_of_week(current_week_start)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Successfully updated top comments for week starting {current_week_start}"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Failed to update top comments for week starting {current_week_start}: {str(e)}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Completed processing {weeks_count} weeks of top comments"
            )
        )
