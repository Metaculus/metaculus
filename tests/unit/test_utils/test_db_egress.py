import json
import logging
import socket
import sys
from types import SimpleNamespace

import pytest
from django.core.exceptions import MiddlewareNotUsed
from django.db import connections
from django.http import HttpResponse, JsonResponse
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


def probe_iterator_view(request):
    User.objects.count()
    list(User.objects.iterator(chunk_size=10))
    return JsonResponse({"ok": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def probe_api_view(request):
    return Response({"ok": True})


def probe_error_view(request):
    User.objects.count()
    raise RuntimeError("probe failure")


urlpatterns = [
    path("probe/<int:pk>/", probe_view, name="egress-probe"),
    path("probe-iterator/", probe_iterator_view, name="egress-probe-iterator"),
    path("probe-api/", probe_api_view, name="egress-probe-api"),
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
    return [json.loads(r.getMessage())["db_egress"] for r in egress_records(caplog)]


class TestQueryShape:
    def test_in_lists_collapse_to_one_fingerprint(self):
        sql = (
            'SELECT "users_user"."id" FROM "users_user" WHERE "users_user"."id" IN ({})'
        )

        assert query_fingerprint(sql.format("%s")) == query_fingerprint(
            sql.format("%s, %s, %s")
        )

    def test_paging_collapses_to_one_fingerprint(self):
        sql = 'SELECT "users_user"."id" FROM "users_user" ORDER BY "users_user"."id"'

        assert (
            len(
                {
                    query_fingerprint(f"{sql} {paging}")
                    for paging in ("LIMIT 10", "LIMIT 10 OFFSET 20", "OFFSET 40")
                }
            )
            == 1
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
                'SELECT "posts_post"."id", (SELECT COUNT(*) FROM "questions_forecast" U0 '
                'WHERE U0."post_id" = ("posts_post"."id")) AS "n" FROM "posts_post"',
                "SELECT posts_post",
            ),
            (
                'SELECT EXTRACT(YEAR FROM "questions_question"."open_time") AS "y" '
                'FROM "posts_post"',
                "SELECT posts_post",
            ),
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

        run_query(collector, wire, posts.format("%s"), 100)
        run_query(collector, wire, posts.format("%s, %s, %s"), 300)
        run_query(collector, wire, 'SELECT "users_user"."id" FROM "users_user"', 1000)
        run_query(collector, wire, 'UPDATE "posts_post" SET "forecasts_count" = %s', 10)
        for i in range(4):
            run_query(collector, wire, f'SELECT "t{i}"."id" FROM "t{i}"', i + 1)

        assert collector.queries == 8
        assert collector.db_bytes == 1420
        assert [
            (s["label"], s["calls"], s["bytes"], s["max_bytes"])
            for s in collector.top()
        ] == [
            ("SELECT users_user", 1, 1000, 1000),
            ("SELECT posts_post", 2, 400, 300),
            ("UPDATE posts_post", 1, 10, 10),
            ("SELECT t3", 1, 4, 4),
            ("SELECT t2", 1, 3, 3),
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


class TestTcpBytesReceived:
    @pytest.mark.parametrize("raw", [None, ClosedRawConnection()])
    def test_none_without_open_connection(self, raw):
        assert tcp_bytes_received(SimpleNamespace(connection=raw)) is None

    def test_none_for_non_tcp_socket_and_fd_left_open(self):
        a, b = socket.socketpair()
        with a, b:
            assert (
                tcp_bytes_received(SimpleNamespace(connection=RawConnection(a))) is None
            )
            a.sendall(b"x")
            assert b.recv(1) == b"x"

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


@pytest.mark.parametrize(
    "user_agent, expected",
    [
        ("CFWorkerProxy x", "gateway"),
        ("node", "nextjs"),
        ("Mozilla/5.0 (Macintosh)", "browser"),
        ("curl/8.7.1", "other"),
        ("", "other"),
    ],
)
def test_client_from_user_agent(user_agent, expected):
    assert db_egress._client(user_agent) == expected


@pytest.mark.urls(__name__)
class TestDbEgressSamplingMiddleware:
    def test_rate_zero_drops_middleware_from_chain(self, settings):
        settings.DB_EGRESS_SAMPLE_RATE = 0

        with pytest.raises(MiddlewareNotUsed):
            DbEgressSamplingMiddleware(lambda request: HttpResponse())

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
                    "limit": "9" * 100,
                    "include_cp_history": "false",
                    "statuses": "open",
                    "search": "secret-term",
                },
                headers={"User-Agent": "node"},
            )

        assert response.status_code == 200
        [record] = egress_records(caplog)
        line = record.getMessage()
        assert "\n" not in line
        entry = json.loads(line)["db_egress"]
        assert set(entry) == LOG_KEYS
        assert entry["route"] == "probe/<int:pk>/"
        assert entry["view"] == "egress-probe"
        assert (entry["method"], entry["status"]) == ("GET", 200)
        assert (entry["client"], entry["auth"], entry["tier"], entry["bot"]) == (
            "nextjs",
            "anon",
            None,
            None,
        )
        assert entry["params"] == {
            "with_cp": "true",
            "limit": "9" * 32,
            "include_cp_history": "false",
        }
        assert (entry["queries"], entry["db_bytes"]) == (3, 150)
        assert entry["resp_bytes"] == len(response.content)
        assert isinstance(entry["ms"], int)
        assert [
            (s["label"], s["calls"], s["bytes"], s["max_bytes"]) for s in entry["top"]
        ] == [("SELECT users_user", 1, 50, 50)] * 3
        for leaked in ("secret-term", "statuses", str(PROBE_PK), "WHERE", "%s"):
            assert leaked not in line

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
        entry = json.loads(record.getMessage())["db_egress"]
        assert (entry["auth"], entry["tier"], entry["bot"]) == (
            "user",
            "unrestricted",
            True,
        )
        line = record.getMessage()
        for leaked in (
            metac_bot.username,
            metac_bot.email,
            ApiKey.objects.get(user=metac_bot).key,
        ):
            assert leaked not in line

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

    def test_view_error_logs_once_and_uninstalls_collector(self, settings, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = Client(raise_request_exception=False).get("/probe-error/")

        assert response.status_code == 500
        [entry] = egress_entries(caplog)
        assert (entry["status"], entry["queries"]) == (500, 1)
        assert connections["default"].execute_wrappers == []

    def test_unresolved_path_is_not_logged(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get("/nowhere/alice@example.com/")

        assert response.status_code == 404
        [record] = egress_records(caplog)
        entry = json.loads(record.getMessage())["db_egress"]
        assert (entry["route"], entry["view"]) == (None, None)
        assert "alice" not in record.getMessage()

    def test_healthcheck_is_not_sampled(self, settings, client, caplog):
        settings.DB_EGRESS_SAMPLE_RATE = 1

        with caplog.at_level(logging.INFO, logger="db_egress"):
            response = client.get("/api/healthcheck/")

        assert response.content == b"ok"
        assert egress_records(caplog) == []
