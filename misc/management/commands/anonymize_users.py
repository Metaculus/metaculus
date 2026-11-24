from django.core.management.base import BaseCommand
from django.db import connection

from misc.anonymization import run_anonymization


class Command(BaseCommand):
    help = (
        "Anonymises users data with misc/anonymization/anonymize.sql. "
        "Never run it against production."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Skip confirmation prompt and proceed with anonymization",
        )

    def handle(self, *args, **kwargs):
        if not kwargs["force"]:
            db = connection.settings_dict
            confirm = input(
                f"\nWARNING: This will anonymize the database "
                f"{db['NAME']} on {db['HOST'] or 'localhost'}.\n"
                "This action cannot be undone.\n"
                "Are you sure you want to continue? [y/N]: "
            )
            if confirm.lower() != "y":
                self.stdout.write(self.style.WARNING("Operation cancelled."))
                return

        for summary, rowcount in run_anonymization():
            self.stdout.write(f"{rowcount:>10} | {summary}")

        self.stdout.write(self.style.SUCCESS("Successfully anonymized all users."))
