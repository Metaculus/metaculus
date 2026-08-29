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

# Eligibility asks whether a text is longer than `ARCHIVE_MIN_TEXT_LENGTH`, not
# how long it is. Asking it as `length(text) > N` makes Postgres fetch and
# decompress the whole out-of-line value — up to 150k characters — for every
# row it considers. Slicing the first N+1 characters answers the same question
# from the first few TOAST chunks, because a text is longer than N exactly when
# its leading slice of N+1 characters is N+1 characters long.
LONG_TEXT_PREFIX_LENGTH = Length(Substr(ORIGINAL_TEXT, 1, ARCHIVE_MIN_TEXT_LENGTH + 1))


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


def upload_text(
    comment_id: int,
    text: str,
    post_id: int | None = None,
    author_id: int | None = None,
    s3=None,
) -> str:
    """
    Uploads the full original text of a comment to S3 and returns the key.

    Only the original text is stored: bot/private comments are never
    translated (see `trigger_update_comment_translations`), and storing
    machine translations of an archived text would be pointless anyway.

    `post_id` and `author_id` are duplicated into the object so that a survey
    of the bucket can group the texts without joining back to the database.
    `post_id` is genuinely absent on comments that hang off a project.
    """

    s3 = s3 or get_archive_s3_client()
    key = build_key(comment_id)

    s3.put_object(
        Bucket=settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT,
        Key=key,
        Body=json.dumps(
            {
                "comment_id": comment_id,
                "post_id": post_id,
                "author_id": author_id,
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
        .annotate(text_prefix_length=LONG_TEXT_PREFIX_LENGTH)
        .filter(text_prefix_length__gt=ARCHIVE_MIN_TEXT_LENGTH)
    )


@dataclass
class ArchiveStats:
    # Number of comments the run expects to process
    total: int = 0
    archived: int = 0
    failed: int = 0
    skipped: int = 0
    chars_reclaimed: int = 0
    sample_ids: list[int] = field(default_factory=list)


def _build_truncate_kwargs() -> dict:
    """
    Update kwargs that keep a stub in `text_original`, empty the base column
    and drop every machine translation.

    The stub is kept in `text_original` because that is the only copy anything
    reads: `comment.text` resolves through the modeltranslation descriptor to
    the current language, falling back to `text_original`, and never to the
    base column — a row whose stub lives only in `text` reads back as an empty
    string in every language. The base column is emptied rather than nulled;
    it is NOT NULL.
    """

    stub = Substr(ORIGINAL_TEXT, 1, ARCHIVE_STUB_LENGTH)
    kwargs = {"text": Value(""), "text_original": stub, "is_text_archived": True}

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
        # real run would actually touch. This is the one place that measures
        # the full length of every candidate text rather than its leading
        # slice, because the point of the report is the exact saving.
        scoped = queryset.order_by("id")

        if limit is not None:
            scoped = scoped[:limit]

        totals = scoped.annotate(text_length=Length(ORIGINAL_TEXT)).aggregate(
            count=Count("id"), chars=Sum("text_length")
        )
        count = totals["count"] or 0

        stats.total = count
        stats.archived = count
        stats.chars_reclaimed = max(
            (totals["chars"] or 0) - count * ARCHIVE_STUB_LENGTH, 0
        )
        sample = queryset.order_by("id").values_list("id", flat=True)[:5]
        stats.sample_ids = list(sample)

        return stats

    # The eligibility query is the expensive half of this command: it joins
    # users, cannot use an index for the text-length test, and walks every
    # private bot comment. Running it once and keeping the ids is what stops
    # the run from re-issuing that scan on every batch — hundreds of heavy
    # queries spread over the hours the uploads take, which is enough sustained
    # load to matter to everything else using the database. Ids are all that is
    # held: even a million of them is a few megabytes, and the text itself is
    # still fetched a page at a time below.
    candidate_ids = list(queryset.order_by("id").values_list("id", flat=True))

    if limit is not None:
        candidate_ids = candidate_ids[:limit]

    stats.total = len(candidate_ids)

    started_at = timezone.now()
    truncate_kwargs = _build_truncate_kwargs()
    concurrency = max(concurrency, 1)
    # One client, shared by every worker: botocore clients are safe to call
    # from multiple threads once built, and building one per upload is pure
    # overhead
    s3 = get_archive_s3_client(concurrency)

    for offset in range(0, len(candidate_ids), batch_size):
        page_ids = candidate_ids[offset : offset + batch_size]

        # A plain primary-key lookup, with none of the eligibility work: the
        # ids were already vetted. `is_text_archived` is re-checked because the
        # id list is a snapshot and a concurrent run may have taken these rows
        # in the meantime.
        # `original_text` is annotated rather than selecting both columns:
        # they hold the same content, and a page of 500 comments that may run
        # to 150k characters each is worth not loading twice. Its length is
        # measured in Python for the same reason — the text is in hand already,
        # so asking the database for `length()` would detoast it a second time.
        rows = list(
            Comment.objects.rewrite(False)
            .filter(id__in=page_ids, is_text_archived=False)
            .annotate(original_text=ORIGINAL_TEXT)
            .values("id", "original_text", "on_post_id", "author_id")
        )

        uploaded_ids = []

        # Each comment is still its own independently retrievable object; the
        # requests are simply issued in parallel, since they are round-trip
        # bound. The database update below waits for the whole page, so an
        # upload can never be outrun by its own truncation.
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = {
                pool.submit(
                    upload_text,
                    row["id"],
                    row["original_text"],
                    row["on_post_id"],
                    row["author_id"],
                    s3,
                ): row["id"]
                for row in rows
            }

            for future, comment_id in futures.items():
                try:
                    future.result()
                    uploaded_ids.append(comment_id)
                except Exception:
                    logger.exception("Failed to archive text of comment %s", comment_id)
                    stats.failed += 1

                    continue

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
                max(len(row["original_text"]) - ARCHIVE_STUB_LENGTH, 0)
                for row in rows
                if row["id"] in archived_ids
            )
            stats.sample_ids = (stats.sample_ids + sorted(archived_ids))[:5]

        if on_progress is not None:
            on_progress(stats)

    return stats
