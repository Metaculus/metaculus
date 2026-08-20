import json
from datetime import timedelta
from io import StringIO

import pytest  # noqa
from django.contrib import admin
from django.core.management import call_command
from django.core.management.base import CommandError
from django.urls import reverse
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from comments.admin import CommentAdmin
from comments.models import Comment
from comments.services.common import update_comment
from comments.services.text_archive import (
    ARCHIVE_MIN_TEXT_LENGTH,
    ARCHIVE_STUB_LENGTH,
    archive_bot_comment_texts,
    build_key,
    get_archivable_comments,
    list_archived_comment_ids,
    sync_archived_comment_texts,
    upload_text,
)
from posts.models import Post
from projects.permissions import ObjectPermission
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_users.factories import factory_user

LONG_TEXT = "b" * (ARCHIVE_MIN_TEXT_LENGTH + 500)


@pytest.fixture()
def bot(user1):
    return factory_user(username="bot1", email="bot1@metaculus.com", is_bot=True)


@pytest.fixture()
def staff_user():
    return factory_user(username="staff1", email="staff1@metaculus.com", is_staff=True)


@pytest.fixture()
def post(user1):
    return factory_post(
        author=user1,
        default_project=factory_project(
            default_permission=ObjectPermission.FORECASTER,
        ),
        curation_status=Post.CurationStatus.APPROVED,
    )


def factory_archivable_comment(author, post, text=LONG_TEXT, **kwargs):
    kwargs.setdefault("created_at", timezone.now() - timedelta(days=60))
    kwargs.setdefault("is_private", True)

    return factory_comment(
        author=author,
        on_post=post,
        text=text,
        text_original=text,
        **kwargs,
    )


@pytest.fixture()
def s3_stub(mocker, settings):
    """
    Minimal in-memory stand-in for the S3 client used by the archive service.
    """

    objects = {}

    class Client:
        class exceptions:
            class NoSuchKey(Exception):
                pass

        def put_object(self, Bucket, Key, Body, **kwargs):
            objects[Key] = Body

        def get_object(self, Bucket, Key):
            # A key mapped to None is one the listing still reports but whose
            # object has gone: exactly what S3 answers with NoSuchKey
            if objects.get(Key) is None:
                raise Client.exceptions.NoSuchKey()

            return {"Body": mocker.Mock(read=lambda: objects[Key].encode("utf-8"))}

        def get_paginator(self, operation_name):
            assert operation_name == "list_objects_v2"

            class Paginator:
                def paginate(self, Bucket, Prefix):
                    # One page is enough here; the real paginator's chunking
                    # is botocore's concern, not ours
                    yield {
                        "Contents": [
                            {"Key": key}
                            for key in sorted(objects)
                            if key.startswith(Prefix)
                        ]
                    }

            return Paginator()

    mocker.patch(
        "comments.services.text_archive.get_boto_client", return_value=Client()
    )
    settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT = "test-bucket"

    return objects


class TestArchivableCommentsQueryset:
    def test_includes_long_old_private_bot_comments(self, bot, post):
        comment = factory_archivable_comment(bot, post)

        assert list(get_archivable_comments()) == [comment]

    def test_excludes_recent_comments(self, bot, post):
        factory_archivable_comment(bot, post, created_at=timezone.now())

        assert not get_archivable_comments().exists()

    def test_excludes_short_comments(self, bot, post):
        factory_archivable_comment(bot, post, text="a" * ARCHIVE_MIN_TEXT_LENGTH)

        assert not get_archivable_comments().exists()

    def test_excludes_public_comments(self, bot, post):
        factory_archivable_comment(bot, post, is_private=False)

        assert not get_archivable_comments().exists()

    def test_excludes_human_comments(self, user1, post):
        factory_archivable_comment(user1, post)

        assert not get_archivable_comments().exists()

    def test_excludes_already_archived_comments(self, bot, post):
        factory_archivable_comment(bot, post, is_text_archived=True)

        assert not get_archivable_comments().exists()

    def test_includes_soft_deleted_comments(self, bot, post):
        comment = factory_archivable_comment(bot, post, is_soft_deleted=True)

        assert list(get_archivable_comments()) == [comment]


class TestArchiveBotCommentTexts:
    def test_archives_text_to_s3_and_truncates_row(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)

        stats = archive_bot_comment_texts()

        assert stats.archived == 1
        assert stats.failed == 0
        assert stats.skipped == 0
        assert stats.chars_reclaimed == len(LONG_TEXT) - ARCHIVE_STUB_LENGTH

        # Full text is in S3
        payload = json.loads(s3_stub[build_key(comment.pk)])
        assert payload["comment_id"] == comment.pk
        assert payload["text"] == LONG_TEXT

        # Only a stub is left in both copies of the original text
        comment.refresh_from_db()
        assert comment.is_text_archived is True
        assert comment.text_original == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        # `rewrite(False)` is what makes this assertion meaningful: a plain
        # `values_list("text")` is rewritten by modeltranslation to read
        # `text_original`, so it would pass even if the base column still
        # held the full text.
        assert (
            Comment.objects.rewrite(False)
            .filter(pk=comment.pk)
            .values_list("text", flat=True)[0]
            == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        )

    def test_drops_translations(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post, text_en="translated")

        archive_bot_comment_texts()

        comment.refresh_from_db()
        assert comment.text_en is None

    def test_does_not_bump_edited_at(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        edited_at = comment.edited_at

        archive_bot_comment_texts()

        comment.refresh_from_db()
        assert comment.edited_at == edited_at

    def test_is_idempotent(self, bot, post, s3_stub):
        factory_archivable_comment(bot, post)

        assert archive_bot_comment_texts().archived == 1
        assert archive_bot_comment_texts().archived == 0

    def test_dry_run_writes_nothing(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)

        stats = archive_bot_comment_texts(dry_run=True)

        assert stats.archived == 1
        assert stats.chars_reclaimed == len(LONG_TEXT) - ARCHIVE_STUB_LENGTH
        assert stats.sample_ids == [comment.pk]

        assert s3_stub == {}
        comment.refresh_from_db()
        assert comment.is_text_archived is False
        assert comment.text_original == LONG_TEXT

    def test_dry_run_totals_are_scoped_to_the_limit(self, bot, post, s3_stub):
        for _ in range(3):
            factory_archivable_comment(bot, post)

        per_comment = len(LONG_TEXT) - ARCHIVE_STUB_LENGTH
        unlimited = archive_bot_comment_texts(dry_run=True)
        limited = archive_bot_comment_texts(dry_run=True, limit=1)

        assert unlimited.archived == 3
        assert unlimited.chars_reclaimed == 3 * per_comment

        # The limited estimate must describe only the rows a real run would
        # touch, not the whole queryset
        assert limited.archived == 1
        assert limited.chars_reclaimed == per_comment

    def test_upload_failure_leaves_comment_intact(self, bot, post, s3_stub, mocker):
        comment = factory_archivable_comment(bot, post)
        mocker.patch(
            "comments.services.text_archive.upload_text",
            side_effect=RuntimeError("s3 is down"),
        )

        stats = archive_bot_comment_texts()

        assert stats.archived == 0
        assert stats.failed == 1

        comment.refresh_from_db()
        assert comment.is_text_archived is False
        assert comment.text_original == LONG_TEXT

    def test_respects_limit(self, bot, post, s3_stub):
        factory_archivable_comment(bot, post)
        factory_archivable_comment(bot, post)

        assert archive_bot_comment_texts(limit=1).archived == 1
        assert get_archivable_comments().count() == 1

    def test_archives_comments_whose_text_is_only_in_the_base_column(
        self, bot, post, s3_stub
    ):
        """
        Rows written before modeltranslation was introduced have an empty
        `text_original`. They are the largest rows in the table, so they must
        not fall through the eligibility filter.
        """

        comment = factory_archivable_comment(bot, post)
        Comment.objects.rewrite(False).filter(pk=comment.pk).update(
            text=LONG_TEXT, text_original=""
        )

        assert archive_bot_comment_texts().archived == 1

        payload = json.loads(s3_stub[build_key(comment.pk)])
        assert payload["text"] == LONG_TEXT
        assert (
            Comment.objects.rewrite(False)
            .filter(pk=comment.pk)
            .values_list("text", flat=True)[0]
            == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        )

    def test_processes_multiple_batches(self, bot, post, s3_stub):
        for _ in range(5):
            factory_archivable_comment(bot, post)

        assert archive_bot_comment_texts(batch_size=2).archived == 5
        assert not get_archivable_comments().exists()


class TestArchiveCommand:
    def test_dry_run_reports_without_writing(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        out = StringIO()

        call_command("archive_bot_comment_texts", "--dry-run", stdout=out)

        assert "Would archive 1 comment(s)" in out.getvalue()
        assert s3_stub == {}
        comment.refresh_from_db()
        assert comment.is_text_archived is False

    def test_archives(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        out = StringIO()

        call_command("archive_bot_comment_texts", stdout=out)

        assert "Archived 1 comment(s)" in out.getvalue()
        comment.refresh_from_db()
        assert comment.is_text_archived is True

    def test_errors_when_bucket_is_not_configured(self, bot, post, settings):
        settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT = None

        with pytest.raises(CommandError):
            call_command("archive_bot_comment_texts", "--dry-run")


class TestArchivedCommentEditing:
    def test_archived_comment_cannot_be_edited(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        comment.refresh_from_db()

        with pytest.raises(ValidationError):
            update_comment(comment, text="new text")

    def test_unarchived_comment_can_still_be_edited(self, bot, post):
        comment = factory_archivable_comment(bot, post, created_at=timezone.now())

        update_comment(comment, text="new text")

        comment.refresh_from_db()
        assert comment.text == "new text"


class TestCommentFullTextApiView:
    def test_author_reads_archived_text(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(bot).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_returns_db_text_when_not_archived(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)

        response = create_client_for_user(bot).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_other_user_cannot_read_private_comment(
        self, bot, post, s3_stub, user2, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(user2).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 403

    def test_soft_deleted_comment_is_not_readable(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        Comment.objects.filter(pk=comment.pk).update(is_soft_deleted=True)

        response = create_client_for_user(bot).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 403

    def test_staff_reads_someone_elses_private_archived_text(
        self, bot, post, s3_stub, staff_user, create_client_for_user
    ):
        """
        Archiving must not take away the view staff already had in the admin.
        """

        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(staff_user).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_staff_reads_soft_deleted_archived_text(
        self, bot, post, s3_stub, staff_user, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        Comment.objects.filter(pk=comment.pk).update(is_soft_deleted=True)

        response = create_client_for_user(staff_user).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_superuser_reads_someone_elses_private_archived_text(
        self, bot, post, s3_stub, user_admin, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(user_admin).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_missing_archive_object_returns_404(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        s3_stub.clear()

        response = create_client_for_user(bot).get(
            reverse("comment-full-text", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 404


class TestCommentAdminArchivedText:
    """
    The admin is where staff investigate a comment, so it has to show the
    archived text rather than the stub the row was left with.
    """

    @pytest.fixture()
    def comment_admin(self):
        return CommentAdmin(Comment, admin.site)

    def test_renders_the_archived_text(self, bot, post, s3_stub, comment_admin):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        comment.refresh_from_db()

        assert LONG_TEXT in comment_admin.archived_text(comment)

    def test_says_so_when_the_archive_cannot_be_read(
        self, bot, post, s3_stub, comment_admin
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        comment.refresh_from_db()
        s3_stub.clear()

        assert "could not be retrieved" in comment_admin.archived_text(comment)

    def test_field_is_only_added_for_archived_comments(
        self, bot, post, s3_stub, comment_admin
    ):
        comment = factory_archivable_comment(bot, post)

        assert "archived_text" not in comment_admin.get_fields(None, comment)

        archive_bot_comment_texts()
        comment.refresh_from_db()

        assert "archived_text" in comment_admin.get_fields(None, comment)

    def test_text_and_archived_text_are_read_only_once_archived(
        self, bot, post, s3_stub, comment_admin
    ):
        comment = factory_archivable_comment(bot, post)

        assert "text" not in comment_admin.get_readonly_fields(None, comment)

        archive_bot_comment_texts()
        comment.refresh_from_db()

        readonly_fields = comment_admin.get_readonly_fields(None, comment)
        assert "text" in readonly_fields
        assert "text_original" in readonly_fields
        assert "archived_text" in readonly_fields


@pytest.fixture()
def archived_elsewhere(bot, post, s3_stub):
    """
    A comment whose text is in the archive while the row still holds it in
    full: the state the production database is in after the uploads have been
    performed against a copy of it.
    """

    comment = factory_archivable_comment(bot, post)
    upload_text(comment.pk, LONG_TEXT)

    return comment


class TestListArchivedCommentIds:
    def test_reads_ids_from_the_bucket(self, bot, post, s3_stub):
        comments = [factory_archivable_comment(bot, post) for _ in range(3)]
        for comment in comments:
            upload_text(comment.pk, LONG_TEXT)

        assert list_archived_comment_ids() == {c.pk for c in comments}

    def test_ignores_keys_that_are_not_comment_ids(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        upload_text(comment.pk, LONG_TEXT)
        s3_stub["comments_text/not-an-id.json"] = "{}"

        assert list_archived_comment_ids() == {comment.pk}


class TestSyncArchivedCommentTexts:
    def test_truncates_without_uploading(self, archived_elsewhere, s3_stub):
        before = dict(s3_stub)

        stats = sync_archived_comment_texts(snapshot_at=timezone.now())

        assert stats.synced == 1
        assert stats.chars_reclaimed == len(LONG_TEXT) - ARCHIVE_STUB_LENGTH
        # Nothing was written back to the archive
        assert s3_stub == before

        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.is_text_archived is True
        assert archived_elsewhere.text_original == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        assert (
            Comment.objects.rewrite(False)
            .filter(pk=archived_elsewhere.pk)
            .values_list("text", flat=True)[0]
            == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        )

    def test_does_not_bump_edited_at(self, archived_elsewhere, s3_stub):
        edited_at = archived_elsewhere.edited_at

        sync_archived_comment_texts(snapshot_at=timezone.now())

        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.edited_at == edited_at

    def test_dry_run_writes_nothing(self, archived_elsewhere, s3_stub):
        stats = sync_archived_comment_texts(snapshot_at=timezone.now(), dry_run=True)

        assert stats.synced == 1
        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.is_text_archived is False
        assert archived_elsewhere.text_original == LONG_TEXT

    def test_skips_rows_edited_since_the_snapshot(self, archived_elsewhere, s3_stub):
        """
        The archived copy predates the edit, so truncating would lose it.
        """

        Comment.objects.rewrite(False).filter(pk=archived_elsewhere.pk).update(
            edited_at=timezone.now()
        )

        stats = sync_archived_comment_texts(
            snapshot_at=timezone.now() - timedelta(hours=1)
        )

        assert stats.synced == 0
        assert stats.skipped_stale == 1

        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.is_text_archived is False
        assert archived_elsewhere.text_original == LONG_TEXT

    def test_skips_rows_whose_text_was_edited_since_the_snapshot(
        self, archived_elsewhere, s3_stub
    ):
        Comment.objects.rewrite(False).filter(pk=archived_elsewhere.pk).update(
            text_edited_at=timezone.now(), edited_at=None
        )

        stats = sync_archived_comment_texts(
            snapshot_at=timezone.now() - timedelta(hours=1)
        )

        assert stats.synced == 0
        assert stats.skipped_stale == 1

    def test_skips_rows_created_since_the_snapshot(self, archived_elsewhere, s3_stub):
        Comment.objects.rewrite(False).filter(pk=archived_elsewhere.pk).update(
            created_at=timezone.now()
        )

        stats = sync_archived_comment_texts(
            snapshot_at=timezone.now() - timedelta(hours=1)
        )

        assert stats.synced == 0
        assert stats.skipped_stale == 1

    def test_counts_already_truncated_rows(self, archived_elsewhere, s3_stub):
        sync_archived_comment_texts(snapshot_at=timezone.now())

        stats = sync_archived_comment_texts(snapshot_at=timezone.now())

        assert stats.synced == 0
        assert stats.already_archived == 1

    def test_counts_objects_with_no_comment(self, bot, post, s3_stub):
        upload_text(999_999_999, LONG_TEXT)

        stats = sync_archived_comment_texts(snapshot_at=timezone.now())

        assert stats.synced == 0
        assert stats.orphaned == 1

    def test_ignores_keys_for_comments_the_archiver_would_never_upload(
        self, user1, bot, post, s3_stub
    ):
        """
        The bucket says what was uploaded, not what may be truncated. A key
        pointing at a public human comment is a mistake, not an instruction.
        """

        human = factory_archivable_comment(user1, post, is_private=False)
        upload_text(human.pk, LONG_TEXT)

        stats = sync_archived_comment_texts(snapshot_at=timezone.now())

        assert stats.synced == 0
        assert stats.ineligible == 1
        assert stats.skipped_stale == 0

        human.refresh_from_db()
        assert human.is_text_archived is False
        assert human.text_original == LONG_TEXT

    def test_counts_rows_too_short_to_truncate_as_ineligible(self, bot, post, s3_stub):
        short = factory_archivable_comment(bot, post, text="c" * ARCHIVE_STUB_LENGTH)
        upload_text(short.pk, short.text)

        stats = sync_archived_comment_texts(snapshot_at=timezone.now())

        assert stats.synced == 0
        assert stats.ineligible == 1
        assert stats.skipped_stale == 0

    def test_verify_skips_rows_whose_archive_no_longer_matches(
        self, archived_elsewhere, s3_stub
    ):
        upload_text(archived_elsewhere.pk, "something else entirely")

        stats = sync_archived_comment_texts(snapshot_at=timezone.now(), verify=True)

        assert stats.synced == 0
        assert stats.mismatched == 1

        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.text_original == LONG_TEXT

    def test_verify_accepts_a_matching_archive(self, archived_elsewhere, s3_stub):
        stats = sync_archived_comment_texts(snapshot_at=timezone.now(), verify=True)

        assert stats.synced == 1
        assert stats.mismatched == 0
        assert stats.verify_failed == 0

    def test_verify_counts_an_unreadable_object_apart_from_a_mismatch(
        self, archived_elsewhere, s3_stub, mocker
    ):
        """
        A read failure says nothing about whether the archive matches, so it
        must not be reported as drift.
        """

        mocker.patch(
            "comments.services.text_archive.fetch_text",
            side_effect=RuntimeError("s3 is down"),
        )

        stats = sync_archived_comment_texts(snapshot_at=timezone.now(), verify=True)

        assert stats.synced == 0
        assert stats.mismatched == 0
        assert stats.verify_failed == 1

        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.text_original == LONG_TEXT

    def test_verify_counts_a_missing_object_as_unreadable(
        self, archived_elsewhere, s3_stub
    ):
        s3_stub.clear()
        # Put the key back in the listing without a body behind it
        s3_stub[build_key(archived_elsewhere.pk)] = None

        stats = sync_archived_comment_texts(snapshot_at=timezone.now(), verify=True)

        assert stats.synced == 0
        assert stats.mismatched == 0
        assert stats.verify_failed == 1


class TestSyncCommand:
    def test_syncs(self, archived_elsewhere, s3_stub):
        out = StringIO()

        call_command(
            "sync_archived_comment_texts",
            "--snapshot-at",
            timezone.now().isoformat(),
            stdout=out,
        )

        assert "Synced 1 of 1 archived object(s)" in out.getvalue()
        archived_elsewhere.refresh_from_db()
        assert archived_elsewhere.is_text_archived is True

    def test_requires_a_snapshot_timestamp(self, s3_stub):
        with pytest.raises(CommandError):
            call_command("sync_archived_comment_texts")

    def test_rejects_an_unparseable_snapshot_timestamp(self, s3_stub):
        with pytest.raises(CommandError):
            call_command("sync_archived_comment_texts", "--snapshot-at", "yesterday")

    def test_errors_when_bucket_is_not_configured(self, settings):
        settings.AWS_STORAGE_BUCKET_COMMENTS_TEXT = None

        with pytest.raises(CommandError):
            call_command(
                "sync_archived_comment_texts", "--snapshot-at", "2026-01-01T00:00:00Z"
            )
