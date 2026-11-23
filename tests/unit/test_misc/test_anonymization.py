import json
import re
from collections import defaultdict
from io import StringIO
from uuid import uuid4

from django.apps import apps
from django.contrib.admin.models import CHANGE, LogEntry
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.db import connection, models
from django.utils import timezone
from django_dramatiq.models import Task
from modeltranslation.fields import TranslationField
from pgvector.django import VectorField
from social_django.models import Association, Code, Nonce, Partial, UserSocialAuth

from authentication.models import ApiKey
from comments.models import (
    CommentDiff,
    CommentsOfTheWeekNotification,
    KeyFactorBaseRate,
    KeyFactorDriver,
    KeyFactorNews,
)
from comments.services.key_factors.common import delete_key_factor
from misc.anonymization import get_anonymization_statements, run_anonymization
from misc.anonymization.manifest import COLUMNS, KEEP, SCRUB, WIPED_TABLES
from misc.models import UserDataAccess
from notifications.constants import MailingTags
from notifications.models import Notification
from posts.models import PostUserSnapshot
from scoring.models import MedalExclusionRecord
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post, factory_post_snapshot
from tests.unit.test_users.factories import factory_user
from users.models import User, UserCampaignRegistration, UserSpamActivity

TEXT_FIELD_TYPES = (
    models.CharField,
    models.TextField,
    models.JSONField,
    models.BinaryField,
    models.FileField,
    models.GenericIPAddressField,
    models.UUIDField,
    SearchVectorField,
    VectorField,
)

COMMENT_TEXT_COLUMNS = [
    "text",
    "text_original",
    "text_en",
    "text_cs",
    "text_es",
    "text_zh",
    "text_zh_TW",
    "text_pt",
]


def is_text_like(field: models.Field) -> bool:
    if isinstance(field, ArrayField):
        return is_text_like(field.base_field)

    return isinstance(field, TEXT_FIELD_TYPES)


def get_model_tables() -> set[str]:
    return {
        model._meta.db_table
        for model in apps.get_models(include_auto_created=True)
        if not model._meta.proxy
    }


def get_text_columns() -> dict[tuple[str, str], list[str]]:
    """
    Maps (table, column) to the physical columns that hold its data:
    the column itself plus its translation columns.
    """

    columns = defaultdict(list)

    for model in apps.get_models(include_auto_created=True):
        if model._meta.proxy:
            continue

        for field in model._meta.local_concrete_fields:
            if not is_text_like(field):
                continue

            base = (
                field.translated_field if isinstance(field, TranslationField) else field
            )
            columns[(model._meta.db_table, base.column)].append(field.column)

    return columns


def get_sql_targets() -> tuple[dict[str, str], set[str]]:
    """
    Returns the SET clauses of UPDATE statements per target table,
    and the tables emptied by unfiltered DELETE statements.
    """

    set_clauses = defaultdict(str)
    cleared = set()

    for statement in get_anonymization_statements():
        normalized = " ".join(statement.split())

        if match := re.fullmatch(r"DELETE FROM (\w+);?", normalized, re.IGNORECASE):
            cleared.add(match.group(1))
        elif match := re.search(
            r"\bUPDATE (\w+).*?\bSET\b(.*?)(?:\bFROM\b|\bWHERE\b|;|$)",
            normalized,
            re.IGNORECASE,
        ):
            set_clauses[match.group(1)] += f" {match.group(2)}"

    return set_clauses, cleared


def assigns_column(set_clause: str, column: str) -> bool:
    return bool(re.search(rf'(?<![\w"])"?{re.escape(column)}"?\s*=', set_clause))


def fetch_columns(table: str, pk: int, columns: list[str]) -> dict:
    quoted_columns = ", ".join(f'"{column}"' for column in columns)

    with connection.cursor() as cursor:
        cursor.execute(f"SELECT {quoted_columns} FROM {table} WHERE id = %s", [pk])
        return dict(zip(columns, cursor.fetchone()))


class TestManifest:
    def test_every_text_column_is_classified(self):
        unclassified = sorted(
            f"{table}.{column}"
            for table, column in get_text_columns()
            if table not in WIPED_TABLES and column not in COLUMNS.get(table, {})
        )

        assert not unclassified, (
            "Classify these columns in misc/anonymization/manifest.py, and scrub "
            "them in misc/anonymization/anonymize.sql if they can hold personal "
            f"data: {', '.join(unclassified)}"
        )

    def test_manifest_has_no_stale_entries(self):
        text_columns = get_text_columns()
        model_tables = get_model_tables()

        stale = sorted(
            [table for table in WIPED_TABLES if table not in model_tables]
            + [
                f"{table}.{column}"
                for table, table_columns in COLUMNS.items()
                for column in table_columns
                if (table, column) not in text_columns
            ]
        )

        assert not stale, f"Remove these from the manifest: {', '.join(stale)}"
        assert not WIPED_TABLES & COLUMNS.keys()
        assert {
            kind
            for table_columns in COLUMNS.values()
            for kind in table_columns.values()
        } <= {KEEP, SCRUB}

    def test_every_database_table_belongs_to_a_model(self):
        tables = set(connection.introspection.table_names())
        unknown = tables - get_model_tables() - {"django_migrations"}

        assert not unknown, (
            "These tables have no model, so the manifest can't classify them: "
            f"{', '.join(sorted(unknown))}"
        )

    def test_every_database_column_belongs_to_a_model_field(self):
        model_columns = defaultdict(set)

        for model in apps.get_models(include_auto_created=True):
            if not model._meta.proxy:
                model_columns[model._meta.db_table].update(
                    field.column for field in model._meta.local_concrete_fields
                )

        unknown = []
        with connection.cursor() as cursor:
            for table, columns in model_columns.items():
                description = connection.introspection.get_table_description(
                    cursor, table
                )
                unknown += [
                    f"{table}.{column.name}"
                    for column in description
                    if column.name not in columns
                ]

        assert not unknown, (
            "These columns have no model field, so the manifest can't classify "
            f"them: {', '.join(sorted(unknown))}"
        )

    def test_sql_handles_every_wiped_table_and_scrubbed_column(self):
        text_columns = get_text_columns()
        set_clauses, cleared = get_sql_targets()

        missing = [table for table in WIPED_TABLES if table not in cleared]
        missing += [
            f"{table}.{physical_column}"
            for table, table_columns in COLUMNS.items()
            for column, kind in table_columns.items()
            if kind == SCRUB
            for physical_column in text_columns[(table, column)]
            if not assigns_column(set_clauses[table], physical_column)
        ]

        assert not missing, (
            "misc/anonymization/anonymize.sql doesn't handle: "
            f"{', '.join(sorted(missing))}"
        )


class TestRunAnonymization:
    def test_anonymizes_and_is_idempotent(self):
        now = timezone.now()

        staff = factory_user(
            email="staff@metaculus.com",
            username="staff",
            first_name="Staff",
            is_staff=True,
            last_login=now,
            metadata={"note": "internal"},
        )
        staff.set_password("staff-password")
        staff.save()

        user = factory_user(
            email="jane@example.com",
            username="jane",
            first_name="Jane",
            last_name="Doe",
            bio="About me",
            twitter="jane",
            location="Paris",
            old_usernames=[["jane_old", now.isoformat()]],
            last_login=now,
            metadata={"pro_details": {"is_current_pro": True}, "note": "called"},
        )
        user.set_password("user-password")
        user.save()

        ApiKey.objects.create(user=user)
        Session.objects.create(session_key="session", session_data="d", expire_date=now)
        UserSocialAuth.objects.create(
            user=user, provider="google-oauth2", uid="jane", extra_data={"t": "x"}
        )
        Partial.objects.create(token="token", backend="google-oauth2", data={})
        Code.objects.create(email="jane@example.com", code="code")
        Nonce.objects.create(server_url="https://example.com", timestamp=1, salt="s")
        Association.objects.create(
            server_url="https://example.com",
            handle="handle",
            secret="secret",
            issued=1,
            lifetime=1,
            assoc_type="HMAC-SHA1",
        )
        Task.tasks.create(
            id=uuid4(),
            message_data=b"jane@example.com",
            actor_name="send_email_async",
            queue_name="default",
        )
        LogEntry.objects.create(
            user=staff,
            content_type=ContentType.objects.get_for_model(User),
            object_id=str(user.pk),
            object_repr="jane",
            action_flag=CHANGE,
            change_message="",
        )

        post = factory_post(author=user)
        private_comment = factory_comment(author=user, on_post=post, is_private=True)
        deleted_comment = factory_comment(
            author=user, on_post=post, is_soft_deleted=True
        )
        public_comment = factory_comment(author=user, on_post=post)
        diff = CommentDiff.objects.create(
            comment=public_comment, author=user, text_diff="removed text"
        )

        with connection.cursor() as cursor:
            for comment, text, is_text_archived in [
                (private_comment, "private note", True),
                (deleted_comment, "deleted text", False),
                (public_comment, "public text", True),
            ]:
                cursor.execute(
                    "UPDATE comments_comment "
                    "SET text = %(text)s, text_original = %(text)s, "
                    'text_en = %(text)s, "text_zh_TW" = %(text)s, '
                    "content_last_md5 = md5(%(text)s), edit_history = %(history)s, "
                    "text_original_search_vector = to_tsvector('english', %(text)s), "
                    "is_text_archived = %(archived)s "
                    "WHERE id = %(id)s",
                    {
                        "text": text,
                        "history": f"[{diff.pk}]",
                        "archived": is_text_archived,
                        "id": comment.pk,
                    },
                )

        private_driver = KeyFactorDriver.objects.create(text="private driver")
        public_driver = KeyFactorDriver.objects.create(text="public driver")
        deleted_base_rate = KeyFactorBaseRate.objects.create(
            type=KeyFactorBaseRate.BaseRateType.FREQUENCY,
            reference_class="private class",
            based_on="private basis",
            unit="%",
            source="private source",
        )
        factory_key_factor(comment=private_comment, driver=private_driver)
        factory_key_factor(comment=public_comment, driver=public_driver)
        factory_key_factor(comment=deleted_comment, base_rate=deleted_base_rate)
        private_news = KeyFactorNews.objects.create(
            url="https://docs.example.com/draft", title="Draft", source="Docs"
        )
        factory_key_factor(comment=private_comment, news=private_news)

        removed_driver = KeyFactorDriver.objects.create(text="removed driver")
        delete_key_factor(
            factory_key_factor(comment=public_comment, driver=removed_driver)
        )
        orphan_news = KeyFactorNews.objects.create(
            url="https://example.com", title="Orphan", source="Example"
        )

        with connection.cursor() as cursor:
            for driver, text in [
                (private_driver, "private driver"),
                (public_driver, "public driver"),
            ]:
                cursor.execute(
                    "UPDATE comments_keyfactordriver "
                    'SET text = %(text)s, text_original = %(text)s, "text_zh_TW" = %(text)s, '
                    "content_last_md5 = md5(%(text)s) WHERE id = %(id)s",
                    {"text": text, "id": driver.pk},
                )

        factory_post_snapshot(
            user=user,
            post=post,
            private_note="my note",
            private_note_updated_at=now,
        )
        UserCampaignRegistration.objects.create(
            user=user,
            key="campaign",
            details={
                "full_name": "Jane Doe",
                "country": "FR",
                "institution": "University",
                "undergrad": True,
                "accepted_terms": True,
            },
        )
        UserCampaignRegistration.objects.create(
            user=staff,
            key="campaign",
            details={"full_name": "Staff", "accepted_terms": {"email": "s@m.com"}},
        )
        MedalExclusionRecord.objects.create(
            user=user,
            exclusion_type=MedalExclusionRecord.ExclusionTypes.OTHER,
            notes="note",
        )
        UserDataAccess.objects.create(user=user, notes="note")
        UserSpamActivity.objects.create(
            user=user,
            reason="reason",
            confidence=1,
            content_type=UserSpamActivity.SpamContentType.COMMENT,
            text="spam text",
        )
        Notification.objects.create(type="test", recipient=staff, params={})
        CommentsOfTheWeekNotification.objects.create(week_start_date=now.date())

        call_command("anonymize_users", force=True, stdout=StringIO())

        with connection.cursor() as cursor:
            for table in WIPED_TABLES:
                cursor.execute(f"SELECT count(*) FROM {table}")
                assert cursor.fetchone()[0] == 0, table

        user.refresh_from_db()
        assert user.username == "jane"
        assert user.email == f"email_{user.pk}@notreal.local"
        assert user.first_name == f"firstname_{user.pk}"
        assert user.last_name == f"lastname_{user.pk}"
        assert user.bio == f"bio_{user.pk}"
        assert user.twitter is None
        assert user.location is None
        assert user.old_usernames == []
        assert user.last_login is None
        assert not user.has_usable_password()
        assert user.metadata == {"pro_details": {"is_current_pro": True}}

        staff.refresh_from_db()
        assert staff.email == "staff@metaculus.com"
        assert staff.first_name == "Staff"
        assert staff.last_login is None
        assert not staff.has_usable_password()
        assert set(MailingTags.values) <= set(staff.unsubscribed_mailing_tags)
        assert staff.metadata is None

        columns = COMMENT_TEXT_COLUMNS + [
            "content_last_md5",
            "edit_history",
            "text_original_search_vector",
            "is_text_archived",
        ]
        for comment in (private_comment, deleted_comment):
            row = fetch_columns("comments_comment", comment.pk, columns)
            assert row["text"] == ""
            assert row["text_original"] == ""
            assert all(row[column] is None for column in COMMENT_TEXT_COLUMNS[2:])
            assert row["content_last_md5"] is None
            assert row["text_original_search_vector"] is None
            assert row["is_text_archived"] is False
            assert json.loads(row["edit_history"]) == []

        row = fetch_columns("comments_comment", public_comment.pk, columns)
        assert row["text_original"] == "public text"
        assert row["text_zh_TW"] == "public text"
        assert row["text_original_search_vector"] is not None
        assert row["is_text_archived"] is True
        assert json.loads(row["edit_history"]) == []

        row = fetch_columns(
            "comments_keyfactordriver",
            private_driver.pk,
            COMMENT_TEXT_COLUMNS + ["content_last_md5"],
        )
        assert row["text"] == ""
        assert row["text_original"] == ""
        assert all(row[column] is None for column in COMMENT_TEXT_COLUMNS[2:])
        assert row["content_last_md5"] is None

        assert fetch_columns(
            "comments_keyfactordriver",
            public_driver.pk,
            ["text_original", "text_zh_TW"],
        ) == {"text_original": "public driver", "text_zh_TW": "public driver"}

        assert fetch_columns(
            "comments_keyfactorbaserate",
            deleted_base_rate.pk,
            ["reference_class", "based_on", "source", "unit"],
        ) == {"reference_class": "", "based_on": "", "source": "", "unit": ""}

        assert fetch_columns(
            "comments_keyfactornews",
            private_news.pk,
            ["url", "title", "img_url", "source"],
        ) == {"url": "", "title": "", "img_url": "", "source": ""}

        assert not KeyFactorDriver.objects.filter(pk=removed_driver.pk).exists()
        assert not KeyFactorNews.objects.filter(pk=orphan_news.pk).exists()
        assert KeyFactorDriver.objects.filter(pk=public_driver.pk).exists()

        snapshot = PostUserSnapshot.objects.get(user=user, post=post)
        assert snapshot.private_note == ""
        assert snapshot.private_note_updated_at is None

        assert UserCampaignRegistration.objects.get(user=user).details == {
            "undergrad": True,
            "accepted_terms": True,
        }
        assert UserCampaignRegistration.objects.get(user=staff).details == {}
        assert MedalExclusionRecord.objects.get(user=user).notes is None
        assert UserDataAccess.objects.get(user=user).notes is None
        spam_activity = UserSpamActivity.objects.get(user=user)
        assert (spam_activity.text, spam_activity.reason) == ("", "")
        assert not Notification.objects.filter(email_sent=False).exists()
        assert not CommentsOfTheWeekNotification.objects.filter(
            email_sent=False
        ).exists()

        changed = [(summary, rows) for summary, rows in run_anonymization() if rows > 0]
        assert not changed, f"A second run changed rows: {changed}"
