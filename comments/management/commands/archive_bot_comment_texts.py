from django.core.management.base import BaseCommand, CommandError

from comments.services.text_archive import (
    ARCHIVE_AGE_DAYS,
    ARCHIVE_MIN_TEXT_LENGTH,
    ARCHIVE_STUB_LENGTH,
    DEFAULT_BATCH_SIZE,
    archive_bot_comment_texts,
    check_is_enabled,
)


class Command(BaseCommand):
    help = (
        "Moves the full text of private bot comments older than "
        f"{ARCHIVE_AGE_DAYS} days and longer than {ARCHIVE_MIN_TEXT_LENGTH} "
        f"characters to S3, leaving a {ARCHIVE_STUB_LENGTH}-character stub in "
        "the database. Runs monthly as a cron job; the full text stays "
        "readable through the comment-full-text endpoint."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be archived without writing to S3 or the database",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of comments to archive (useful for the first backfill)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=DEFAULT_BATCH_SIZE,
            help=f"Comments per database update (default: {DEFAULT_BATCH_SIZE})",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if not check_is_enabled():
            raise CommandError(
                "AWS_STORAGE_BUCKET_COMMENTS_TEXT is not configured, "
                "comment text archiving is disabled."
            )

        stats = archive_bot_comment_texts(
            dry_run=dry_run,
            limit=options["limit"],
            batch_size=options["batch_size"],
        )

        verb = "Would archive" if dry_run else "Archived"
        self.stdout.write(
            f"{verb} {stats.archived} comment(s), "
            f"reclaiming {stats.chars_reclaimed:,} characters"
        )

        if stats.sample_ids:
            sample = ", ".join(str(pk) for pk in stats.sample_ids)
            self.stdout.write(f"Sample comment ids: {sample}")

        if stats.skipped:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped {stats.skipped} comment(s) edited during the run"
                )
            )

        if stats.failed:
            self.stdout.write(
                self.style.ERROR(f"Failed to upload {stats.failed} comment(s)")
            )
