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


class ProgressWriter:
    """
    Prints a running one-line summary with a rate and an ETA.

    The daily run has only a day of new comments to clear, but the first
    backfill works through hundreds of thousands of rows over hours, so the
    point is to make a long run observable rather than to look pretty. Output
    is one line per batch, not a redrawn line, so it survives being piped to a
    log file.
    """

    def __init__(self, stdout, total: int = 0):
        self.stdout = stdout
        self.total = total
        self.started = time.monotonic()

    @property
    def elapsed(self) -> float:
        return time.monotonic() - self.started

    def write(self, line: str) -> None:
        self.stdout.write(line)
        self.stdout.flush()

    def update(self, done: int, summary: str, detail: str = "") -> None:
        elapsed = self.elapsed
        rate = done / elapsed if elapsed else 0
        percent = (done / self.total * 100) if self.total else 0
        remaining = max(self.total - done, 0)
        eta = format_duration(remaining / rate) if rate else "?"

        line = (
            f"  {done:,}/{self.total:,} ({percent:.1f}%)  {summary}  "
            f"{rate:.1f}/s  elapsed {format_duration(elapsed)}  eta {eta}"
        )

        if detail:
            line += f"  [{detail}]"

        self.write(line)


class Command(BaseCommand):
    help = (
        "Moves the full text of private bot comments older than "
        f"{ARCHIVE_AGE_DAYS} days and longer than {ARCHIVE_MIN_TEXT_LENGTH} "
        f"characters to S3, leaving a {ARCHIVE_STUB_LENGTH}-character stub in "
        "the database. Runs daily as a cron job; the full text stays "
        "readable through the comment-detail endpoint."
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
            progress.write("Finding eligible comments...")

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
