import json
import logging
from dataclasses import dataclass, field
from datetime import timedelta

from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Count, Q, QuerySet, Sum, Value
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
ARCHIVE_MIN_TEXT_LENGTH = 2000
# Length of the stub left behind in the text columns
ARCHIVE_STUB_LENGTH = 200

S3_KEY_PREFIX = "comments_text"

DEFAULT_BATCH_SIZE = 500

# `text` is the base column shadowed by modeltranslation: it holds a duplicate
# of the original content that is written on save but never read back (reads of
# `comment.text` resolve to `text_original` through the translation
# descriptor). `text_original` may be NULL or empty on rows that were never
# saved through the descriptor, so fall back to the base column.
ORIGINAL_TEXT = Coalesce(NullIf("text_original", Value("")), "text")


def check_is_enabled() -> bool:
    return bool(settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT)


def build_key(comment_id: int) -> str:
    """
    The archive key is derived from the comment id, so it never needs to be
    stored on the comment itself. This function is the only place that knows
    the key layout.
    """

    return f"{S3_KEY_PREFIX}/{comment_id}.json"


def upload_text(comment_id: int, text: str) -> str:
    """
    Uploads the full original text of a comment to S3 and returns the key.

    Only the original text is stored: bot/private comments are never
    translated (see `trigger_update_comment_translations`), and storing
    machine translations of an archived text would be pointless anyway.
    """

    s3 = get_boto_client("s3")
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


def fetch_text(comment_id: int) -> str | None:
    """
    Reads the archived full text of a comment back from S3.
    Returns None if the object is missing.
    """

    s3 = get_boto_client("s3")

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
        Comment.objects.filter(
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
) -> ArchiveStats:
    """
    Moves the full text of long, private, old bot comments to S3, leaving a
    truncated stub in the database.
    """

    stats = ArchiveStats()
    queryset = get_archivable_comments()

    if dry_run:
        # Aggregate without transferring any text
        totals = queryset.aggregate(count=Count("id"), chars=Sum("text_length"))
        count = totals["count"] or 0

        if limit is not None:
            count = min(count, limit)

        stats.archived = count
        stats.chars_reclaimed = max(
            (totals["chars"] or 0) - count * ARCHIVE_STUB_LENGTH, 0
        )
        stats.sample_ids = list(
            queryset.order_by("id").values_list("id", flat=True)[:5]
        )

        return stats

    started_at = timezone.now()
    truncate_kwargs = _build_truncate_kwargs()
    cursor = 0

    while limit is None or stats.archived + stats.failed < limit:
        page_size = batch_size
        if limit is not None:
            page_size = min(batch_size, limit - stats.archived - stats.failed)

        rows = list(
            queryset.filter(id__gt=cursor)
            .order_by("id")
            .values("id", "text", "text_original", "text_length")[:page_size]
        )

        if not rows:
            break

        # Advance past the whole page, including rows that failed to upload, so
        # a persistent failure can never stall the run. Skipped rows stay
        # eligible for the next one.
        cursor = rows[-1]["id"]
        uploaded_ids = []

        for row in rows:
            text = row["text_original"] or row["text"]

            try:
                upload_text(row["id"], text)
            except Exception:
                logger.exception("Failed to archive text of comment %s", row["id"])
                stats.failed += 1

                continue

            uploaded_ids.append(row["id"])

        if not uploaded_ids:
            continue

        # Only truncate rows that have not been touched since the run began, so
        # an edit racing the upload can never lose text. `edited_at` is
        # nullable on rows that predate TimeStampedModel.save.
        untouched = Comment.objects.filter(pk__in=uploaded_ids).filter(
            Q(edited_at__lt=started_at) | Q(edited_at__isnull=True)
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

    return stats
