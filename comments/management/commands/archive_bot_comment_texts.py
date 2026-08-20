import time
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


def format_duration(seconds: float) -> str:
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours:
        return f"{hours}h{minutes:02d}m"
    if minutes:
        return f"{minutes}m{seconds:02d}s"

    return f"{seconds}s"


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

    def _write_progress(self, stats, started: float):
        elapsed = time.monotonic() - started
        done = stats.archived + stats.failed + stats.skipped
        rate = done / elapsed if elapsed else 0
        percent = (done / stats.total * 100) if stats.total else 0
        remaining = max(stats.total - done, 0)
        eta = format_duration(remaining / rate) if rate else "?"

        line = (
            f"  {done:,}/{stats.total:,} ({percent:.1f}%)  "
            f"{stats.chars_reclaimed:,} chars reclaimed  "
            f"{rate:.1f}/s  elapsed {format_duration(elapsed)}  eta {eta}"
        )

        if stats.failed or stats.skipped:
            line += f"  [{stats.failed} failed, {stats.skipped} skipped]"

        self.stdout.write(line)
        self.stdout.flush()

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if not check_is_enabled():
            raise CommandError(
                "AWS_STORAGE_BUCKET_COMMENTS_TEXT is not configured, "
                "comment text archiving is disabled."
            )

        started = time.monotonic()
        on_progress: Callable[[ArchiveStats], None] | None = None

        if not dry_run:
            self.stdout.write(
                f"Archiving to {settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT}/"
                f"{S3_KEY_PREFIX}/ with concurrency {options['concurrency']}, "
                f"batches of {options['batch_size']}"
            )
            self.stdout.write("Counting eligible comments...")
            self.stdout.flush()

            def write_progress(stats: ArchiveStats) -> None:
                self._write_progress(stats, started)

            on_progress = write_progress

        stats = archive_bot_comment_texts(
            dry_run=dry_run,
            limit=options["limit"],
            batch_size=options["batch_size"],
            concurrency=options["concurrency"],
            on_progress=on_progress,
        )

        verb = "Would archive" if dry_run else "Archived"
        elapsed = (
            "" if dry_run else f" in {format_duration(time.monotonic() - started)}"
        )
        self.stdout.write(
            f"{verb} {stats.archived:,} comment(s), "
            f"reclaiming {stats.chars_reclaimed:,} characters{elapsed}"
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
