import json
import logging
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import timedelta

from botocore.config import Config
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Count, Q, QuerySet, Sum, TextField, Value
from django.db.models.functions import Coalesce, Length, NullIf, Substr
from django.utils import timezone

from comments.models import Comment
from utils.aws import get_boto_client
from utils.translation import build_supported_localized_fieldname

logger = logging.getLogger(__name__)

# Comments older than this are eligible for archiving
ARCHIVE_AGE_DAYS = 30
# Only archive comments whose text is longer than this. Below this, it's not important
# to move.
ARCHIVE_MIN_TEXT_LENGTH = 500
# Length of the stub left behind in the text columns
ARCHIVE_STUB_LENGTH = 200

S3_KEY_PREFIX = "comments_text"

DEFAULT_BATCH_SIZE = 500
# S3 has no multi-object PUT, so the only way to cut the wall-clock cost of the
# uploads is to keep several of them in flight at once. They are latency bound,
# not bandwidth bound, so this scales close to linearly.
DEFAULT_CONCURRENCY = 8

# `text` is the base column shadowed by modeltranslation: it holds a duplicate
# of the original content that is written on save but never read back (reads of
# `comment.text` resolve to `text_original` through the translation
# descriptor). `text_original` may be NULL or empty on rows that were never
# saved through the descriptor, so fall back to the base column.
# `output_field` is required, not decorative: `text_original` is a
# modeltranslation `TranslationTextField` and `Value("")` a `CharField`, which
# Django refuses to reconcile on its own as soon as the expression is selected
# rather than wrapped in `Length`/`Substr`.
ORIGINAL_TEXT = Coalesce(
    NullIf("text_original", Value("")), "text", output_field=TextField()
)


def check_is_enabled() -> bool:
    return bool(settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT)


def build_key(comment_id: int) -> str:
    """
    The archive key is derived from the comment id, so it never needs to be
    stored on the comment itself. This function is the only place that knows
    the key layout.
    """

    return f"{S3_KEY_PREFIX}/{comment_id}.json"


def get_archive_s3_client(concurrency: int = 1):
    """
    S3 client for the archive. Building a client is expensive, so callers that
    upload many objects should build one and pass it around. The connection
    pool has to be at least as large as the number of concurrent uploads, or
    botocore serialises them behind the default pool of 10.
    """

    return get_boto_client(
        "s3",
        config=Config(
            max_pool_connections=max(concurrency, 10),
            # S3 answers a request rate it cannot sustain with 503 SlowDown.
            # We run far below the limit, but `standard` mode covers the
            # throttling error codes explicitly and backs off with jitter,
            # rather than relying on the looser `legacy` default.
            retries={"mode": "standard", "max_attempts": 5},
        ),
    )


def upload_text(comment_id: int, text: str, s3=None) -> str:
    """
    Uploads the full original text of a comment to S3 and returns the key.

    Only the original text is stored: bot/private comments are never
    translated (see `trigger_update_comment_translations`), and storing
    machine translations of an archived text would be pointless anyway.
    """

    s3 = s3 or get_archive_s3_client()
    key = build_key(comment_id)

    s3.put_object(
        Bucket=settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT,
        Key=key,
        Body=json.dumps(
            {
                "comment_id": comment_id,
                "archived_at": timezone.now(),
                "text": text,
            },
            cls=DjangoJSONEncoder,
        ),
        ContentType="application/json",
    )

    return key


def fetch_text(comment_id: int, s3=None) -> str | None:
    """
    Reads the archived full text of a comment back from S3.
    Returns None if the object is missing.
    """

    s3 = s3 or get_archive_s3_client()

    try:
        obj = s3.get_object(
            Bucket=settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT,
            Key=build_key(comment_id),
        )
    except s3.exceptions.NoSuchKey:
        logger.error("Archived text is missing for comment %s", comment_id)

        return None

    return json.loads(obj["Body"].read().decode("utf-8"))["text"]


def get_full_text(comment: Comment) -> str | None:
    """
    Full text of a comment, transparently reading from the archive when the
    stored text has been truncated.
    """

    if not comment.is_text_archived:
        return comment.text

    return fetch_text(comment.pk)


def get_archivable_comments() -> QuerySet[Comment]:
    """
    Long private bot comments old enough to be archived.

    Soft-deleted comments are included: their text is not rendered anywhere,
    but it still occupies the row, and archiving keeps it recoverable.
    """

    cutoff = timezone.now() - timedelta(days=ARCHIVE_AGE_DAYS)

    return (
        # `rewrite(False)` is essential, not an optimisation. Comment is
        # registered with modeltranslation, whose queryset rewrites every
        # mention of `text` into the current language's column. Without it,
        # `Length(ORIGINAL_TEXT)` degrades to measuring `text_original` twice
        # and rows whose text only lives in the base column are never seen.
        Comment.objects.rewrite(False)
        .filter(
            author__is_bot=True,
            is_private=True,
            is_text_archived=False,
            created_at__lt=cutoff,
        )
        .annotate(text_length=Length(ORIGINAL_TEXT))
        .filter(text_length__gt=ARCHIVE_MIN_TEXT_LENGTH)
    )


@dataclass
class ArchiveStats:
    # Number of comments the run expects to process. Only populated when a
    # progress callback asks for it, since counting means measuring the length
    # of every candidate text.
    total: int = 0
    archived: int = 0
    failed: int = 0
    skipped: int = 0
    chars_reclaimed: int = 0
    sample_ids: list[int] = field(default_factory=list)


def _build_truncate_kwargs() -> dict:
    """
    Update kwargs that leave a stub in both copies of the original text and
    drop every machine translation.
    """

    stub = Substr(ORIGINAL_TEXT, 1, ARCHIVE_STUB_LENGTH)
    kwargs = {"text": stub, "text_original": stub, "is_text_archived": True}

    for lang, _label in settings.LANGUAGES:
        if lang == settings.ORIGINAL_LANGUAGE_CODE:
            continue

        kwargs[build_supported_localized_fieldname("text", lang)] = None

    return kwargs


def archive_bot_comment_texts(
    dry_run: bool = False,
    limit: int | None = None,
    batch_size: int = DEFAULT_BATCH_SIZE,
    concurrency: int = DEFAULT_CONCURRENCY,
    on_progress: Callable[[ArchiveStats], None] | None = None,
) -> ArchiveStats:
    """
    Moves the full text of long, private, old bot comments to S3, leaving a
    truncated stub in the database.

    `on_progress` is called with the running stats after every batch.
    """

    stats = ArchiveStats()
    queryset = get_archivable_comments()

    if dry_run:
        # Aggregate without transferring any text. The limit has to be applied
        # before aggregating, so that the reported totals describe the rows the
        # real run would actually touch.
        scoped = queryset.order_by("id")

        if limit is not None:
            scoped = scoped[:limit]

        totals = scoped.aggregate(count=Count("id"), chars=Sum("text_length"))
        count = totals["count"] or 0

        stats.archived = count
        stats.chars_reclaimed = max(
            (totals["chars"] or 0) - count * ARCHIVE_STUB_LENGTH, 0
        )
        stats.sample_ids = list(
            queryset.order_by("id").values_list("id", flat=True)[:5]
        )

        return stats

    if on_progress is not None:
        # Counting is not free: the eligibility filter measures the length of
        # every candidate text, so this reads the whole candidate set
        total = queryset.count()
        stats.total = min(total, limit) if limit is not None else total

    started_at = timezone.now()
    truncate_kwargs = _build_truncate_kwargs()
    cursor = 0
    concurrency = max(concurrency, 1)
    # One client, shared by every worker: botocore clients are safe to call
    # from multiple threads once built, and building one per upload is pure
    # overhead
    s3 = get_archive_s3_client(concurrency)

    while limit is None or stats.archived + stats.failed < limit:
        page_size = batch_size
        if limit is not None:
            page_size = min(batch_size, limit - stats.archived - stats.failed)

        # `original_text` is annotated rather than selecting both columns:
        # they hold the same content, and a page of 500 comments that may run
        # to 150k characters each is worth not loading twice.
        rows = list(
            queryset.filter(id__gt=cursor)
            .order_by("id")
            .annotate(original_text=ORIGINAL_TEXT)
            .values("id", "original_text", "text_length")[:page_size]
        )

        if not rows:
            break

        # Advance past the whole page, including rows that failed to upload, so
        # a persistent failure can never stall the run. Skipped rows stay
        # eligible for the next one.
        cursor = rows[-1]["id"]
        uploaded_ids = []

        # Each comment is still its own independently retrievable object; the
        # requests are simply issued in parallel, since they are round-trip
        # bound. The database update below waits for the whole page, so an
        # upload can never be outrun by its own truncation.
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = {
                pool.submit(upload_text, row["id"], row["original_text"], s3): row["id"]
                for row in rows
            }

            for future, comment_id in futures.items():
                try:
                    future.result()
                except Exception:
                    logger.exception("Failed to archive text of comment %s", comment_id)
                    stats.failed += 1

                    continue

                uploaded_ids.append(comment_id)

        if uploaded_ids:
            # Only truncate rows that have not been touched since the run
            # began, so an edit racing the upload can never lose text.
            # `edited_at` is nullable on rows that predate
            # TimeStampedModel.save.
            # `rewrite(False)` again: modeltranslation's `update()` rewrites
            # the `text` kwarg to `text_original`, which collides with the
            # `text_original` kwarg and leaves the base column holding the
            # full text — silently forfeiting half the space this reclaims.
            untouched = (
                Comment.objects.rewrite(False)
                .filter(pk__in=uploaded_ids)
                .filter(Q(edited_at__lt=started_at) | Q(edited_at__isnull=True))
            )
            archived_ids = set(untouched.values_list("id", flat=True))
            updated = untouched.update(**truncate_kwargs)

            stats.archived += updated
            stats.skipped += len(uploaded_ids) - updated
            stats.chars_reclaimed += sum(
                max(row["text_length"] - ARCHIVE_STUB_LENGTH, 0)
                for row in rows
                if row["id"] in archived_ids
            )
            stats.sample_ids = (stats.sample_ids + sorted(archived_ids))[:5]

        if on_progress is not None:
            on_progress(stats)

    return stats


def list_archived_comment_ids(s3=None) -> set[int]:
    """
    Every comment id that already has an object in the archive, read straight
    from the bucket.

    The bucket is the authority on what has been uploaded: the point of the
    sync below is to reconcile a database that knows nothing about uploads
    performed elsewhere. It is not, however, the authority on what may be
    truncated — see `get_syncable_comments`.
    """

    s3 = s3 or get_archive_s3_client()
    prefix = f"{S3_KEY_PREFIX}/"
    comment_ids = set()

    for page in s3.get_paginator("list_objects_v2").paginate(
        Bucket=settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT, Prefix=prefix
    ):
        for obj in page.get("Contents", []):
            stem = obj["Key"][len(prefix) :].removesuffix(".json")

            if stem.isdigit():
                comment_ids.add(int(stem))

    return comment_ids


@dataclass
class SyncStats:
    # Objects found in the bucket
    total: int = 0
    synced: int = 0
    # Present in the bucket, but the row is already truncated
    already_archived: int = 0
    # Present in the bucket with no matching row: deleted since the upload
    orphaned: int = 0
    # A row the archiver would never have uploaded, or one already at or
    # below the stub length: nothing to reclaim, and a hint that the bucket
    # holds keys this command did not put there
    ineligible: int = 0
    # `--verify` only: the archived text no longer matches the row
    mismatched: int = 0
    # `--verify` only: the archived object could not be read back at all,
    # which says nothing about whether it matches
    verify_failed: int = 0
    chars_reclaimed: int = 0
    sample_ids: list[int] = field(default_factory=list)


def get_syncable_comments(comment_ids) -> QuerySet[Comment]:
    """
    Rows this command is allowed to truncate against an archive uploaded
    elsewhere.

    Anything the archiver uploaded was a long, private bot comment, so those
    invariants are re-asserted here rather than trusting the key alone: a
    stray or mistyped object in the bucket must not be able to truncate a row
    the archiver would never have touched.

    Nothing here can tell whether the archived copy is still current — that
    is what `--verify` is for.
    """

    return (
        Comment.objects.rewrite(False)
        .filter(
            pk__in=comment_ids,
            author__is_bot=True,
            is_private=True,
            is_text_archived=False,
        )
        .annotate(text_length=Length(ORIGINAL_TEXT))
        .filter(text_length__gt=ARCHIVE_STUB_LENGTH)
    )


def _verify_archived_text(rows, s3, concurrency: int) -> tuple[set[int], set[int]]:
    """
    Ids whose archived object still matches the row's text exactly, and ids
    whose object could not be read back at all.

    The two are kept apart because they mean different things: a mismatch is
    a stale archive, an unreadable object is an S3 problem. Both leave the
    row alone.
    """

    verified = set()
    unreadable = set()

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = {pool.submit(fetch_text, row["id"], s3): row for row in rows}

        for future, row in futures.items():
            try:
                archived = future.result()
            except Exception:
                logger.exception(
                    "Failed to read archived text of comment %s", row["id"]
                )
                unreadable.add(row["id"])

                continue

            if archived is None:
                # `fetch_text` swallows a missing object and logs it
                unreadable.add(row["id"])
            elif archived == row["original_text"]:
                verified.add(row["id"])

    return verified, unreadable


def sync_archived_comment_texts(
    dry_run: bool = False,
    verify: bool = False,
    batch_size: int = DEFAULT_BATCH_SIZE,
    concurrency: int = DEFAULT_CONCURRENCY,
    on_progress: Callable[[SyncStats], None] | None = None,
) -> SyncStats:
    """
    Truncates rows whose text is already in the archive, uploading nothing.

    This exists for one migration. The uploads are slow and bandwidth-heavy,
    so they are performed once against a copy of the database; this then
    brings the real database in line with the bucket without moving the text
    a second time.

    `verify` re-reads every object and requires it to match the row before
    truncating. That is the safe-but-slow path, and the only thing standing
    between an archive that has gone stale and a lost edit: without it a row
    is truncated on the strength of its key being in the bucket.
    """

    stats = SyncStats()
    concurrency = max(concurrency, 1)
    # One client for the whole run, listing and verification alike: building
    # one is expensive, and the verification below would otherwise build a
    # fresh one for every batch.
    s3 = get_archive_s3_client(concurrency)
    archived_ids = sorted(list_archived_comment_ids(s3))
    stats.total = len(archived_ids)

    truncate_kwargs = _build_truncate_kwargs()
    columns = ["id", "text_length"] + (["original_text"] if verify else [])

    for start in range(0, len(archived_ids), batch_size):
        chunk = archived_ids[start : start + batch_size]

        # Two queries per chunk so the accounting is exact: what the database
        # knows about these ids, then which of them may be truncated.
        states = dict(
            Comment.objects.rewrite(False)
            .filter(pk__in=chunk)
            .values_list("id", "is_text_archived")
        )
        syncable = get_syncable_comments(chunk)

        if verify:
            syncable = syncable.annotate(original_text=ORIGINAL_TEXT)

        rows = list(syncable.values(*columns))

        stats.orphaned += len(chunk) - len(states)
        already = sum(1 for archived in states.values() if archived)
        stats.already_archived += already
        stats.ineligible += len(states) - already - len(rows)

        if verify and rows:
            verified, unreadable = _verify_archived_text(rows, s3, concurrency)
            stats.mismatched += len(rows) - len(verified) - len(unreadable)
            stats.verify_failed += len(unreadable)
            rows = [row for row in rows if row["id"] in verified]

        if rows and not dry_run:
            # Re-select at write time: a row archived or shortened between the
            # select above and this update must not be truncated again.
            eligible = get_syncable_comments([row["id"] for row in rows])
            synced_ids = set(eligible.values_list("id", flat=True))
            updated = eligible.update(**truncate_kwargs)

            stats.synced += updated
            stats.ineligible += len(rows) - updated
            rows = [row for row in rows if row["id"] in synced_ids]
        elif rows:
            stats.synced += len(rows)

        stats.chars_reclaimed += sum(
            max(row["text_length"] - ARCHIVE_STUB_LENGTH, 0) for row in rows
        )
        stats.sample_ids = (stats.sample_ids + sorted(row["id"] for row in rows))[:5]

        if on_progress is not None:
            on_progress(stats)

    return stats
