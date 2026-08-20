import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from comments.services.text_archive import (
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY,
    S3_KEY_PREFIX,
    SyncStats,
    check_is_enabled,
    sync_archived_comment_texts,
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

    This command works through hundreds of thousands of objects over hours,
    so the point is to make a long run observable rather than to look pretty.
    Output is one line per batch, not a redrawn line, so it survives being
    piped to a log file.
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
        "Truncates comments whose full text is already in the S3 archive, "
        "without uploading anything. This is the second half of a one-off "
        "migration: `archive_bot_comment_texts` is run once against a copy of "
        "the database to populate the bucket, then this brings the real "
        "database in line with it. Afterwards the monthly cron job takes over."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be truncated without writing to the database",
        )
        parser.add_argument(
            "--verify",
            action="store_true",
            help=(
                "Re-read every archived object and require it to match the row "
                "before truncating. Much slower, and downloads the whole "
                "archive, but it is the only check that the archived copy is "
                "still current"
            ),
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
                "Downloads to keep in flight at once, for --verify "
                f"(default: {DEFAULT_CONCURRENCY})"
            ),
        )

    def handle(self, *args, **options):
        if not check_is_enabled():
            raise CommandError(
                "AWS_STORAGE_BUCKET_COMMENTS_TEXT is not configured, "
                "comment text archiving is disabled."
            )

        dry_run = options["dry_run"]
        progress = ProgressWriter(self.stdout)

        progress.write(
            f"Syncing against {settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT}/"
            f"{S3_KEY_PREFIX}/"
            + (" (verifying every object)" if options["verify"] else "")
        )
        progress.write("Listing the archive...")

        def on_progress(stats: SyncStats) -> None:
            progress.total = stats.total
            done = (
                stats.synced
                + stats.already_archived
                + stats.orphaned
                + stats.ineligible
                + stats.mismatched
                + stats.verify_failed
            )
            detail = ", ".join(
                f"{count} {label}"
                for label, count in (
                    ("already archived", stats.already_archived),
                    ("orphaned", stats.orphaned),
                    ("ineligible", stats.ineligible),
                    ("mismatched", stats.mismatched),
                    ("unreadable", stats.verify_failed),
                )
                if count
            )
            progress.update(done, f"{stats.chars_reclaimed:,} chars reclaimed", detail)

        stats = sync_archived_comment_texts(
            dry_run=dry_run,
            verify=options["verify"],
            batch_size=options["batch_size"],
            concurrency=options["concurrency"],
            on_progress=on_progress,
        )

        verb = "Would sync" if dry_run else "Synced"
        progress.write(
            f"\n{verb} {stats.synced:,} of {stats.total:,} archived object(s), "
            f"reclaiming {stats.chars_reclaimed:,} characters "
            f"in {format_duration(progress.elapsed)}"
        )

        for label, count in (
            ("already truncated", stats.already_archived),
            ("orphaned (no such comment)", stats.orphaned),
            ("ineligible (not a long private bot comment)", stats.ineligible),
        ):
            if count:
                progress.write(f"  {count:,} {label}")

        if stats.sample_ids:
            sample = ", ".join(str(pk) for pk in stats.sample_ids)
            progress.write(f"Sample comment ids: {sample}")

        if stats.mismatched:
            # Not fatal: these keep their text and the monthly job re-archives
            # them, but a large number means the archive is further out of
            # date than expected
            self.stdout.write(
                self.style.WARNING(
                    f"{stats.mismatched:,} archived object(s) did not match the "
                    "current text and were left alone"
                )
            )

        if stats.verify_failed:
            # Distinct from a mismatch: nothing is known about these objects,
            # so a non-zero count here means the bucket is what needs looking at
            self.stdout.write(
                self.style.ERROR(
                    f"{stats.verify_failed:,} archived object(s) could not be read "
                    "back and were left alone"
                )
            )
