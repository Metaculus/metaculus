import json
import logging
import re
import socket
import sys
from types import SimpleNamespace

import pytest
from django.core.exceptions import MiddlewareNotUsed
from django.db import connections
from django.db.utils import ConnectionHandler
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.test import Client
from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from authentication.models import ApiKey
from users.constants import ApiAccessTier
from users.models import User
from utils import db_egress
from utils.db_egress import (
    DbEgressCollector,
    DbEgressSamplingMiddleware,
    query_fingerprint,
    query_label,
    tcp_bytes_received,
)

PROBE_PK = 987654
LOG_KEYS = {
    "route",
    "view",
    "method",
    "status",
    "client",
    "auth",
    "tier",
    "bot",
    "params",
    "queries",
    "db_bytes",
    "resp_bytes",
    "ms",
    "top",
}

linux_only = pytest.mark.skipif(
    not sys.platform.startswith("linux") or not hasattr(socket, "TCP_INFO"),
    reason="tcp_info is Linux-only",
)


def probe_view(request, pk):
    list(User.objects.filter(pk__in=[pk, pk + 1, pk + 2]))
    User.objects.filter(pk=pk).exists()
    User.objects.count()
    return JsonResponse({"ok": True})


def probe_user_view(request, username):
    return JsonResponse({"ok": True})


def probe_iterator_view(request):
    User.objects.count()
    list(User.objects.iterator(chunk_size=10))
    return JsonResponse({"ok": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def probe_api_view(request):
    return Response({"ok": True})


def probe_stream_view(request):
    return StreamingHttpResponse(iter([b"chunk"]))


def probe_error_view(request):
    User.objects.count()
    raise RuntimeError("probe failure")


urlpatterns = [
    path("probe/<int:pk>/", probe_view, name="egress-probe"),
    path("probe-user/<str:username>/", probe_user_view, name="egress-probe-user"),
    path("probe-iterator/", probe_iterator_view, name="egress-probe-iterator"),
    path("probe-api/", probe_api_view, name="egress-probe-api"),
    path("probe-stream/", probe_stream_view, name="egress-probe-stream"),
    path("probe-error/", probe_error_view, name="egress-probe-error"),
]


class RawConnection:
    closed = 0

    def __init__(self, sock):
        self.sock = sock

    def fileno(self):
        return self.sock.fileno()


class ClosedRawConnection:
    closed = 1

    def fileno(self):
        raise AssertionError("closed connection touched")


class FakeWire:
    def __init__(self):
        self.received = 0

    def read(self, connection):
        return self.received

    def execute(self, size):
        def run(sql, params, many, context):
            self.received += size
            return size

        return run


def client_cursor_context():
    return {
        "connection": None,
        "cursor": SimpleNamespace(cursor=SimpleNamespace(name=None)),
    }


def run_query(collector, wire, sql, size):
    return collector(wire.execute(size), sql, None, False, client_cursor_context())


def counting_reader(step=50):
    reads = iter(range(0, 10**12, step))
    return lambda connection: next(reads)


def unavailable_reader(connection):
    return None


def broken_reader(connection):
    raise OSError("socket gone")


def egress_records(caplog):
    return [r for r in caplog.records if r.name == "db_egress"]


def egress_entries(caplog):
    return [json.loads(r.getMessage()) for r in egress_records(caplog)]


class TestQueryShape:
    def test_in_lists_collapse_to_one_fingerprint(self):
        sql = (
            'SELECT "users_user"."id" FROM "users_user" WHERE "users_user"."id" IN ({})'
        )

        assert query_fingerprint(sql.format("%s")) == query_fingerprint(
            sql.format("%s, %s, %s")
        )

    def test_pages_of_a_queryset_share_a_fingerprint(self):
        users = User.objects.order_by("id")

        fingerprints = {
            query_fingerprint(str(page.query))
            for page in (users[:10], users[10:20], users[:21], users[40:])
        }

        assert len(fingerprints) == 1

    def test_savepoint_ids_collapse(self):
        assert query_fingerprint('SAVEPOINT "s140_x1"') == query_fingerprint(
            'SAVEPOINT "s7_x12"'
        )
        assert query_fingerprint('SAVEPOINT "s140_x1"') != query_fingerprint(
            'RELEASE SAVEPOINT "s140_x1"'
        )

    def test_different_shapes_get_different_fingerprints(self):
        assert query_fingerprint('SELECT "a"."id" FROM "a"') != query_fingerprint(
            'SELECT "a"."name" FROM "a"'
        )

    def test_fingerprint_is_a_short_hash(self):
        assert re.fullmatch(
            r"[0-9a-f]{12}", query_fingerprint('SELECT "a"."id" FROM "a"')
        )

    @pytest.mark.parametrize(
        "sql, label",
        [
            (
                'SELECT "posts_post"."id" FROM "posts_post" WHERE "posts_post"."id" = %s',
                "SELECT posts_post",
            ),
            (
                'INSERT INTO "questions_forecast" ("question_id") VALUES (%s) '
                'RETURNING "questions_forecast"."id"',
                "INSERT questions_forecast",
            ),
            (
                'UPDATE "posts_post" SET "forecasts_count" = %s '
                'WHERE "posts_post"."id" = %s',
                "UPDATE posts_post",
            ),
            (
                'DELETE FROM "comments_comment" WHERE "comments_comment"."id" IN (%s)',
                "DELETE comments_comment",
            ),
            (
                'SELECT "posts_post"."id", (SELECT COUNT(*) FROM "questions_forecast" U0 '
                'WHERE U0."post_id" = ("posts_post"."id")) AS "n" FROM "posts_post"',
                "SELECT posts_post",
            ),
            (
                'SELECT COUNT(*) FROM (SELECT DISTINCT "posts_post"."id" AS "col1" '
                'FROM "posts_post") subquery',
                "SELECT posts_post",
            ),
            (
                'SELECT EXTRACT(YEAR FROM "questions_question"."open_time") AS "y" '
                'FROM "posts_post"',
                "SELECT posts_post",
            ),
            ('(SELECT "a"."id" FROM "a") UNION (SELECT "b"."id" FROM "b")', "SELECT a"),
            ("select id from users_user", "SELECT users_user"),
            ('SAVEPOINT "s123_x1"', "SAVEPOINT"),
        ],
    )
    def test_label(self, sql, label):
        assert query_label(sql) == label


class TestDbEgressCollector:
    def test_top_shapes_in_byte_order(self):
        wire = FakeWire()
        collector = DbEgressCollector(read_bytes=wire.read)
        posts = (
            'SELECT "posts_post"."id" FROM "posts_post" WHERE "posts_post"."id" IN ({})'
        )
        users = 'SELECT "users_user"."id" FROM "users_user"'
        update = 'UPDATE "posts_post" SET "forecasts_count" = %s'

        run_query(collector, wire, posts.format("%s"), 100)
        run_query(collector, wire, posts.format("%s, %s, %s"), 300)
        run_query(collector, wire, users, 1000)
        run_query(collector, wire, update, 10)
        for i in range(4):
            run_query(collector, wire, f'SELECT "t{i}"."id" FROM "t{i}"', i + 1)

        assert collector.queries == 8
        assert collector.db_bytes == 100 + 300 + 1000 + 10 + 1 + 2 + 3 + 4
        assert collector.top() == [
            {
                "label": "SELECT users_user",
                "fp": query_fingerprint(users),
                "calls": 1,
                "bytes": 1000,
                "max_bytes": 1000,
            },
            {
                "label": "SELECT posts_post",
                "fp": query_fingerprint(posts.format("%s")),
                "calls": 2,
                "bytes": 400,
                "max_bytes": 300,
            },
            {
                "label": "UPDATE posts_post",
                "fp": query_fingerprint(update),
                "calls": 1,
                "bytes": 10,
                "max_bytes": 10,
            },
            {
                "label": "SELECT t3",
                "fp": query_fingerprint('SELECT "t3"."id" FROM "t3"'),
                "calls": 1,
                "bytes": 4,
                "max_bytes": 4,
            },
            {
                "label": "SELECT t2",
                "fp": query_fingerprint('SELECT "t2"."id" FROM "t2"'),
                "calls": 1,
                "bytes": 3,
                "max_bytes": 3,
            },
        ]

    def test_execute_exception_propagates_unchanged(self):
        wire = FakeWire()
        collector = DbEgressCollector(read_bytes=wire.read)
        error = RuntimeError("boom")

        def failing_execute(sql, params, many, context):
            raise error

        with pytest.raises(RuntimeError) as excinfo:
            collector(failing_execute, "SELECT 1", None, False, client_cursor_context())

        assert excinfo.value is error
        assert collector.queries == 1

    @pytest.mark.parametrize("reader", [unavailable_reader, broken_reader])
    def test_unmeasurable_queries_still_run_and_count(self, reader):
        collector = DbEgressCollector(read_bytes=reader)

        result = collector(
            lambda *args: "rows", "SELECT 1", None, False, client_cursor_context()
        )

        assert result == "rows"
        assert collector.queries == 1
        assert collector.db_bytes is None
        assert collector.top()[0]["bytes"] is None

    def test_non_str_sql_is_still_measured(self):
        wire = FakeWire()
        collector = DbEgressCollector(read_bytes=wire.read)

        assert run_query(collector, wire, b"SELECT 1", 50) == 50
        run_query(collector, wire, "SELECT 1", 50)

        assert collector.queries == 2
        assert collector.db_bytes == 100

    def test_install_wraps_every_alias(self, monkeypatch, settings):
        db = settings.DATABASES["default"]
        handler = ConnectionHandler({"default": {**db}, "replica": {**db}})
        monkeypatch.setattr(db_egress, "connections", handler)
        collector = DbEgressCollector()

        with collector.install():
            assert [handler[alias].execute_wrappers for alias in handler] == [
                [collector],
                [collector],
            ]

        assert [handler[alias].execute_wrappers for alias in handler] == [[], []]


class TestTcpBytesReceived:
    def test_none_when_not_connected(self):
        assert tcp_bytes_received(SimpleNamespace(connection=None)) is None

    def test_none_when_connection_closed(self):
        connection = SimpleNamespace(connection=ClosedRawConnection())

        assert tcp_bytes_received(connection) is None

    def test_none_for_non_tcp_socket_and_fd_left_open(self):
        a, b = socket.socketpair()
        with a, b:
            assert (
                tcp_bytes_received(SimpleNamespace(connection=RawConnection(a))) is None
            )
            a.sendall(b"x")
            assert b.recv(1) == b"x"

    @linux_only
    def test_none_for_invalid_fd(self):
        raw = SimpleNamespace(closed=0, fileno=lambda: -1)

        assert tcp_bytes_received(SimpleNamespace(connection=raw)) is None

    @linux_only
    def test_counts_tcp_bytes_received(self):
        with socket.create_server(("127.0.0.1", 0)) as server:
            client = socket.create_connection(server.getsockname())
            peer, _ = server.accept()
            with client, peer:
                connection = SimpleNamespace(connection=RawConnection(client))
                before = tcp_bytes_received(connection)

                peer.sendall(b"x" * 5000)
                assert len(client.recv(5000, socket.MSG_WAITALL)) == 5000

                assert tcp_bytes_received(connection) - before == 5000
                client.sendall(b"ping")
                assert peer.recv(4) == b"ping"

    @linux_only
    def test_counts_result_bytes_on_the_database_connection(self):
        connection = connections["default"]
        connection.ensure_connection()
        if (connection.settings_dict["HOST"] or "/").startswith("/"):
            pytest.skip("unix-socket database")
        before = tcp_bytes_received(connection)

        with connection.cursor() as cursor:
            cursor.execute("SELECT repeat('x', 100000)")
            cursor.fetchone()

        assert tcp_bytes_received(connection) - before >= 100_000


@pytest.mark.urls(__name__)
class TestDbEgressSamplingMiddleware:
    def test_registered_right_after_healthcheck(self, settings):
        assert settings.MIDDLEWARE[:2] == [
            "utils.middlewares.HealthCheckMiddleware",
            "utils.db_egress.DbEgressSamplingMiddleware",
        ]

    def test_rate_zero_drops_middleware_from_chain(self, settings):
        settings.DB_EGRESS_SAMPLE_RATE = 0

        with pytest.raises(MiddlewareNotUsed):
            DbEgressSamplingMiddleware(lambda request: HttpResponse())

    def test_rate_zero_logs_nothing(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 0

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get(f"/probe/{PROBE_PK}/")

        assert response.status_code == 200
        assert egress_records(caplog) == []

    def test_unsampled_request_logs_nothing(
        self, settings, client, caplog, monkeypatch
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 0.5
        monkeypatch.setattr(db_egress.random, "random", lambda: 0.75)
        monkeypatch.setattr(
            db_egress,
            "DbEgressCollector",
            lambda *args, **kwargs: pytest.fail(
                "collector built for unsampled request"
            ),
        )

        with caplog.at_level(logging.INFO, logger="db_egress"):
            client.get(f"/probe/{PROBE_PK}/")

        assert egress_records(caplog) == []

    def test_sampled_request_logs_one_json_line(
        self, settings, client, caplog, monkeypatch
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        monkeypatch.setattr(db_egress, "tcp_bytes_received", counting_reader(50))

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get(
                f"/probe/{PROBE_PK}/",
                {
                    "with_cp": "true",
                    "limit": "10",
                    "include_cp_history": "false",
                    "statuses": "open",
                    "search": "secret-term",
                },
                headers={"User-Agent": "node"},
            )

        assert response.status_code == 200
        [record] = egress_records(caplog)
        assert record.levelno == logging.INFO
        line = record.getMessage()
        assert "\n" not in line
        entry = json.loads(line)
        assert set(entry) == LOG_KEYS
        assert entry["route"] == "probe/<int:pk>/"
        assert entry["view"] == "egress-probe"
        assert entry["method"] == "GET"
        assert entry["status"] == 200
        assert entry["client"] == "nextjs"
        assert entry["auth"] == "anon"
        assert entry["tier"] is None
        assert entry["bot"] is None
        assert entry["params"] == {
            "with_cp": "true",
            "limit": "10",
            "include_cp_history": "false",
        }
        assert entry["queries"] == 3
        assert entry["db_bytes"] == 150
        assert entry["resp_bytes"] == len(response.content)
        assert isinstance(entry["ms"], int)
        assert len(entry["top"]) == 3
        assert len({shape["fp"] for shape in entry["top"]}) == 3
        for shape in entry["top"]:
            assert set(shape) == {"label", "fp", "calls", "bytes", "max_bytes"}
            assert shape["label"] == "SELECT users_user"
            assert (shape["calls"], shape["bytes"], shape["max_bytes"]) == (1, 50, 50)
        for leaked in ("secret-term", "statuses", str(PROBE_PK), "WHERE", "%s"):
            assert leaked not in line

    @pytest.mark.parametrize(
        "user_agent, expected",
        [
            ("CFWorkerProxy/1.0", "gateway"),
            ("node", "nextjs"),
            ("node-fetch/1.0", "nextjs"),
            ("Mozilla/5.0 (Macintosh)", "browser"),
            ("curl/8.7.1", "other"),
            (None, "other"),
        ],
    )
    def test_client_from_user_agent(
        self, settings, client, caplog, user_agent, expected
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        headers = {"User-Agent": user_agent} if user_agent else {}

        with caplog.at_level(logging.INFO, logger="db_egress"):
            client.get(f"/probe/{PROBE_PK}/", headers=headers)

        [entry] = egress_entries(caplog)
        assert entry["client"] == expected

    def test_authenticated_user_fields(
        self, settings, caplog, metac_bot, create_client_for_user
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        metac_bot.api_access_tier = ApiAccessTier.UNRESTRICTED
        metac_bot.save()
        api_client = create_client_for_user(metac_bot)

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = api_client.get("/probe-api/")

        assert response.status_code == 200
        [record] = egress_records(caplog)
        entry = json.loads(record.getMessage())
        assert entry["auth"] == "user"
        assert entry["tier"] == "unrestricted"
        assert entry["bot"] is True
        assert entry["view"] == "egress-probe-api"
        line = record.getMessage()
        for leaked in (
            metac_bot.username,
            metac_bot.email,
            ApiKey.objects.get(user=metac_bot).key,
        ):
            assert leaked not in line

    def test_unevaluated_session_user_is_not_loaded(
        self, settings, client, caplog, user1, django_assert_num_queries
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        client.force_login(user1)

        with caplog.at_level(logging.INFO, logger="db_egress"):
            with django_assert_num_queries(3):
                client.get(f"/probe/{PROBE_PK}/")

        [entry] = egress_entries(caplog)
        assert entry["queries"] == 3
        assert entry["auth"] == "anon"

    @pytest.mark.parametrize("reader", [unavailable_reader, broken_reader])
    def test_unavailable_byte_counter_degrades_gracefully(
        self, settings, client, caplog, monkeypatch, reader
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        monkeypatch.setattr(db_egress, "tcp_bytes_received", reader)

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get(f"/probe/{PROBE_PK}/")

        assert response.status_code == 200
        [entry] = egress_entries(caplog)
        assert entry["queries"] == 3
        assert entry["db_bytes"] is None
        assert [shape["calls"] for shape in entry["top"]] == [1, 1, 1]
        assert all(shape["bytes"] is None for shape in entry["top"])

    def test_server_side_cursor_makes_db_bytes_unknown(
        self, settings, client, caplog, monkeypatch
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        monkeypatch.setattr(db_egress, "tcp_bytes_received", counting_reader(50))

        with caplog.at_level(logging.INFO, logger="db_egress"):
            client.get("/probe-iterator/")

        [entry] = egress_entries(caplog)
        assert entry["queries"] == 2
        assert entry["db_bytes"] is None
        assert [shape["bytes"] for shape in entry["top"]] == [50, None]

    def test_reader_measures_the_querying_connection(
        self, settings, client, monkeypatch
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1
        seen = []

        def spy_reader(connection):
            seen.append(connection)
            return 0

        monkeypatch.setattr(db_egress, "tcp_bytes_received", spy_reader)

        client.get(f"/probe/{PROBE_PK}/")

        assert len(seen) == 6
        assert all(connection is connections["default"] for connection in seen)

    def test_view_error_logs_once_and_uninstalls_collector(self, settings, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = Client(raise_request_exception=False).get("/probe-error/")

        assert response.status_code == 500
        [entry] = egress_entries(caplog)
        assert entry["status"] == 500
        assert entry["queries"] == 1
        assert connections["default"].execute_wrappers == []

    def test_unresolved_path_falls_back_to_id_placeholders(
        self, settings, client, caplog
    ):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get("/nowhere/123/x/456/")

        assert response.status_code == 404
        [entry] = egress_entries(caplog)
        assert entry["route"] == "/nowhere/{id}/x/{id}/"
        assert entry["view"] is None
        assert entry["queries"] == 0

    def test_append_slash_redirect_logs_route_not_path(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get("/probe-user/alice")

        assert response.status_code == 301
        [record] = egress_records(caplog)
        entry = json.loads(record.getMessage())
        assert entry["route"] == "probe-user/<str:username>/"
        assert entry["view"] == "egress-probe-user"
        assert "alice" not in record.getMessage()

    def test_free_text_fields_are_bounded(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            client.get("/nowhere/" + "x" * 500, {"limit": "9" * 100})

        [entry] = egress_entries(caplog)
        assert len(entry["route"]) == 200
        assert entry["params"] == {"limit": "9" * 32}

    def test_streaming_response_has_no_resp_bytes(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            client.get("/probe-stream/")

        [entry] = egress_entries(caplog)
        assert entry["resp_bytes"] is None

    def test_healthcheck_is_not_sampled(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get("/api/healthcheck/")

        assert response.content == b"ok"
        assert egress_records(caplog) == []
