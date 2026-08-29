import json
from datetime import timedelta
from io import StringIO

import pytest  # noqa
from django.core.management import call_command
from django.core.management.base import CommandError
from django.urls import reverse
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from comments.models import Comment
from comments.services.common import update_comment
from comments.services.text_archive import (
    ARCHIVE_MIN_TEXT_LENGTH,
    ARCHIVE_STUB_LENGTH,
    archive_bot_comment_texts,
    build_key,
    get_archivable_comments,
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

        # Full text is in S3, alongside the ids a bucket survey needs
        payload = json.loads(s3_stub[build_key(comment.pk)])
        assert payload["comment_id"] == comment.pk
        assert payload["post_id"] == post.pk
        assert payload["author_id"] == bot.pk
        assert payload["text"] == LONG_TEXT

        # Only a stub is left, in the one column that is read back
        comment.refresh_from_db()
        assert comment.is_text_archived is True
        assert comment.text_original == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        assert comment.text == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        # `rewrite(False)` is what makes this assertion meaningful: a plain
        # `values_list("text")` is rewritten by modeltranslation to read
        # `text_original`, so it would pass even if the base column still
        # held the full text.
        assert (
            Comment.objects.rewrite(False)
            .filter(pk=comment.pk)
            .values_list("text", flat=True)[0]
            == ""
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
        # The stub ends up in `text_original` even though the text came from
        # the base column, which is where every read looks for it
        comment.refresh_from_db()
        assert comment.text_original == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
        assert (
            Comment.objects.rewrite(False)
            .filter(pk=comment.pk)
            .values_list("text", flat=True)[0]
            == ""
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


class TestCommentDetailApiView:
    def test_anonymous_reads_a_public_comment(self, user1, post, anon_client):
        """
        The endpoint is open to logged-out callers; what they may read is
        decided per comment, not by whether they have an account.
        """

        comment = factory_comment(
            author=user1, on_post=post, text=LONG_TEXT, text_original=LONG_TEXT
        )

        response = anon_client.get(reverse("comment-detail", kwargs={"pk": comment.pk}))

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_anonymous_reads_archived_public_text(
        self, user1, post, s3_stub, anon_client
    ):
        """
        Only private bot comments are archived today. This covers the case the
        open endpoint exists for: a public comment archived on age alone, whose
        row holds a stub a logged-out reader has to be able to open.
        """

        comment = factory_comment(
            author=user1, on_post=post, text=LONG_TEXT, text_original=LONG_TEXT
        )
        upload_text(comment.pk, LONG_TEXT, comment.on_post_id, comment.author_id)
        Comment.objects.rewrite(False).filter(pk=comment.pk).update(
            text="",
            text_original=LONG_TEXT[:ARCHIVE_STUB_LENGTH],
            is_text_archived=True,
        )

        response = anon_client.get(reverse("comment-detail", kwargs={"pk": comment.pk}))

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT
        assert response.data["is_text_archived"] is True

    def test_anonymous_cannot_read_a_private_comment(
        self, bot, post, s3_stub, anon_client
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = anon_client.get(reverse("comment-detail", kwargs={"pk": comment.pk}))

        assert response.status_code == 403

    def test_anonymous_cannot_read_a_deleted_comment(self, user1, post, anon_client):
        comment = factory_comment(
            author=user1, on_post=post, text=LONG_TEXT, is_soft_deleted=True
        )

        response = anon_client.get(reverse("comment-detail", kwargs={"pk": comment.pk}))

        assert response.status_code == 403

    def test_author_reads_archived_text(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(bot).get(
            reverse("comment-detail", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT
        # The endpoint returns the whole comment, not just its text
        assert response.data["id"] == comment.pk
        assert response.data["author"]["id"] == bot.pk
        assert response.data["on_post"] == post.pk
        assert response.data["is_text_archived"] is True

    def test_returns_db_text_when_not_archived(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)

        response = create_client_for_user(bot).get(
            reverse("comment-detail", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_other_user_cannot_read_private_comment(
        self, bot, post, s3_stub, user2, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(user2).get(
            reverse("comment-detail", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 403

    def test_soft_deleted_comment_is_not_readable(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()
        Comment.objects.filter(pk=comment.pk).update(is_soft_deleted=True)

        response = create_client_for_user(bot).get(
            reverse("comment-detail", kwargs={"pk": comment.pk})
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
            reverse("comment-detail", kwargs={"pk": comment.pk})
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
            reverse("comment-detail", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 200
        assert response.data["text"] == LONG_TEXT

    def test_superuser_reads_someone_elses_private_archived_text(
        self, bot, post, s3_stub, user_admin, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = create_client_for_user(user_admin).get(
            reverse("comment-detail", kwargs={"pk": comment.pk})
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
            reverse("comment-detail", kwargs={"pk": comment.pk})
        )

        assert response.status_code == 404


class TestArchivedTextNoticeForApiClients:
    """
    The web front end offers a button that loads the rest of the comment, so
    the notice is only spelled out for callers that have no such affordance.
    """

    def _list_own_private_comments(self, client, post):
        return client.get(
            reverse("comment-list"), {"post": post.pk, "is_private": True}
        )

    def test_api_key_caller_gets_a_pointer_to_the_full_text(
        self, bot, post, s3_stub, create_client_for_user
    ):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        response = self._list_own_private_comments(create_client_for_user(bot), post)

        assert response.status_code == 200
        (data,) = [c for c in response.data["results"] if c["id"] == comment.pk]
        assert data["is_text_archived"] is True
        assert "Content Truncated" in data["text"]
        assert f"/api/comments/{comment.pk}/" in data["text"]

    def test_session_caller_gets_the_bare_stub(self, bot, post, s3_stub):
        comment = factory_archivable_comment(bot, post)
        archive_bot_comment_texts()

        client = APIClient()
        client.force_login(bot)
        response = self._list_own_private_comments(client, post)

        assert response.status_code == 200
        (data,) = [c for c in response.data["results"] if c["id"] == comment.pk]
        # The flag is still there; it is what the front end renders the button from
        assert data["is_text_archived"] is True
        assert "Content Truncated" not in data["text"]
        assert data["text"] == LONG_TEXT[:ARCHIVE_STUB_LENGTH]
