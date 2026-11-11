from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from comments.services.futureeval_comment_reminders import (
    MIN_COMMENTED_SHARE,
    MIN_FORECASTED_POSTS,
    send_futureeval_comment_reminders,
)


class Command(BaseCommand):
    help = (
        "Emails owners of FutureEval and MiniBench bots that commented on fewer "
        f"than {MIN_COMMENTED_SHARE:.0%} of the posts they forecast in the past "
        f"week (minimum {MIN_FORECASTED_POSTS} posts). Runs weekly as a cron job."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List who would be emailed without sending anything",
        )
        parser.add_argument(
            "--as-of",
            type=datetime.fromisoformat,
            default=None,
            help="Evaluate the week ending at this ISO datetime instead of now",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        as_of = options["as_of"] or timezone.now()

        if timezone.is_naive(as_of):
            as_of = timezone.make_aware(as_of)

        reminders = send_futureeval_comment_reminders(as_of, dry_run=dry_run)

        verb = "Would email" if dry_run else "Emailed"
        self.stdout.write(f"{verb} {len(reminders)} recipient(s)")

        for recipient, bot_missing_comments in reminders:
            self.stdout.write(
                f"- {bot_missing_comments.bot.username} -> "
                f"{recipient.username} (user {recipient.id})"
            )

            for coverage in bot_missing_comments.projects:
                self.stdout.write(
                    f"    commented on {coverage.commented_posts}/"
                    f"{coverage.forecasted_posts} posts in {coverage.project.name} "
                    f"(project {coverage.project.id})"
                )
