from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_naive, make_aware

from comments.services.text_archive import (
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY,
    S3_KEY_PREFIX,
    SyncStats,
    check_is_enabled,
    sync_archived_comment_texts,
)

from ._progress import ProgressWriter, format_duration


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
            "--snapshot-at",
            required=True,
            help=(
                "When the database copy used for the uploads was taken, as an "
                "ISO-8601 timestamp (e.g. 2026-08-20T17:00:00Z). Rows created "
                "or touched after this are left alone, because the archived "
                "copy of their text may be stale. Required: there is no safe "
                "default."
            ),
        )
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
                "archive, but does not rely on the timestamp guards alone"
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

        snapshot_at = parse_datetime(options["snapshot_at"])

        if snapshot_at is None:
            raise CommandError(
                f"Could not parse --snapshot-at {options['snapshot_at']!r} as an "
                "ISO-8601 timestamp."
            )

        if is_naive(snapshot_at):
            # A naive timestamp here would be compared against tz-aware columns
            # and blow up mid-run, after an unknown number of rows
            snapshot_at = make_aware(snapshot_at)

        dry_run = options["dry_run"]
        progress = ProgressWriter(self.stdout)

        progress.write(
            f"Syncing against {settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT}/"
            f"{S3_KEY_PREFIX}/ as of {snapshot_at.isoformat()}"
            + (" (verifying every object)" if options["verify"] else "")
        )
        progress.write("Listing the archive...")

        def on_progress(stats: SyncStats) -> None:
            progress.total = stats.total
            done = (
                stats.synced
                + stats.already_archived
                + stats.orphaned
                + stats.skipped_stale
                + stats.mismatched
            )
            detail = ", ".join(
                f"{count} {label}"
                for label, count in (
                    ("already archived", stats.already_archived),
                    ("orphaned", stats.orphaned),
                    ("stale", stats.skipped_stale),
                    ("mismatched", stats.mismatched),
                )
                if count
            )
            progress.update(done, f"{stats.chars_reclaimed:,} chars reclaimed", detail)

        stats = sync_archived_comment_texts(
            snapshot_at=snapshot_at,
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
            ("skipped as touched since the snapshot", stats.skipped_stale),
        ):
            if count:
                progress.write(f"  {count:,} {label}")

        if stats.sample_ids:
            sample = ", ".join(str(pk) for pk in stats.sample_ids)
            progress.write(f"Sample comment ids: {sample}")

        if stats.mismatched:
            # Not fatal: these keep their text and the monthly job re-archives
            # them, but a large number means the snapshot is not what we think
            self.stdout.write(
                self.style.WARNING(
                    f"{stats.mismatched:,} archived object(s) did not match the "
                    "current text and were left alone"
                )
            )
