from collections.abc import Callable

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from comments.services.text_archive import (
    ARCHIVE_AGE_DAYS,
    ARCHIVE_MIN_TEXT_LENGTH,
    ARCHIVE_STUB_LENGTH,
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY,
    S3_KEY_PREFIX,
    ArchiveStats,
    archive_bot_comment_texts,
    check_is_enabled,
)

from ._progress import ProgressWriter, format_duration


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
        parser.add_argument(
            "--concurrency",
            type=int,
            default=DEFAULT_CONCURRENCY,
            help=(
                "Uploads to keep in flight at once. S3 has no multi-object PUT, "
                "so this is what makes a large backfill finish in minutes "
                f"rather than hours (default: {DEFAULT_CONCURRENCY})"
            ),
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if not check_is_enabled():
            raise CommandError(
                "AWS_STORAGE_BUCKET_COMMENTS_TEXT is not configured, "
                "comment text archiving is disabled."
            )

        progress = ProgressWriter(self.stdout)
        on_progress: Callable[[ArchiveStats], None] | None = None

        if not dry_run:
            progress.write(
                f"Archiving to {settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT}/"
                f"{S3_KEY_PREFIX}/ with concurrency {options['concurrency']}, "
                f"batches of {options['batch_size']}"
            )
            progress.write("Counting eligible comments...")

            def write_progress(stats: ArchiveStats) -> None:
                progress.total = stats.total
                detail = ", ".join(
                    f"{count} {label}"
                    for label, count in (
                        ("failed", stats.failed),
                        ("skipped", stats.skipped),
                    )
                    if count
                )
                progress.update(
                    stats.archived + stats.failed + stats.skipped,
                    f"{stats.chars_reclaimed:,} chars reclaimed",
                    detail,
                )

            on_progress = write_progress

        stats = archive_bot_comment_texts(
            dry_run=dry_run,
            limit=options["limit"],
            batch_size=options["batch_size"],
            concurrency=options["concurrency"],
            on_progress=on_progress,
        )

        verb = "Would archive" if dry_run else "Archived"
        elapsed = "" if dry_run else f" in {format_duration(progress.elapsed)}"
        progress.write(
            f"{verb} {stats.archived:,} comment(s), "
            f"reclaiming {stats.chars_reclaimed:,} characters{elapsed}"
        )

        if stats.sample_ids:
            sample = ", ".join(str(pk) for pk in stats.sample_ids)
            progress.write(f"Sample comment ids: {sample}")

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
