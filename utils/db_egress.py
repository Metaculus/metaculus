import hashlib
import json
import logging
import random
import re
import socket
import sys
import time
from contextlib import ExitStack, contextmanager, suppress

from django.conf import settings
from django.core.exceptions import MiddlewareNotUsed
from django.db import connections
from django.urls import Resolver404, resolve
from django.utils.functional import SimpleLazyObject, empty

logger = logging.getLogger("db_egress")

# struct tcp_info.tcpi_bytes_received (__u64), linux/include/uapi/linux/tcp.h
_TCPI_BYTES_RECEIVED = slice(128, 136)
_TCP_INFO_SUPPORTED = sys.platform.startswith("linux") and hasattr(socket, "TCP_INFO")

_IN_LIST = re.compile(r"\bIN\s*\(\s*%s(?:\s*,\s*%s)*\s*\)", re.IGNORECASE)
_PAGING = re.compile(
    r"\b(?:LIMIT\s+\d+(?:\s+OFFSET\s+\d+)?|OFFSET\s+\d+)\b", re.IGNORECASE
)
_SAVEPOINT_ID = re.compile(r'"s\d+_x\d+"')
_VERB = re.compile(r"[\s(]*(\w+)")
_TABLE = re.compile(r'\b(?:FROM|INTO|UPDATE)\s+"?([A-Za-z_]\w*)', re.IGNORECASE)
_DIGIT_SEGMENT = re.compile(r"/\d+(?=/|$)")
_LOGGED_PARAMS = (
    "with_cp",
    "include_cp_history",
    "include_descriptions",
    "include_movements",
    "limit",
)
_TOP_SHAPES = 5


def tcp_bytes_received(connection) -> int | None:
    raw = connection.connection
    if not _TCP_INFO_SUPPORTED or raw is None or raw.closed:
        return None
    try:
        sock = socket.socket(fileno=raw.fileno())
        try:
            info = sock.getsockopt(
                socket.IPPROTO_TCP, socket.TCP_INFO, _TCPI_BYTES_RECEIVED.stop
            )
        finally:
            # detach, not close: the fd belongs to psycopg2
            sock.detach()
    except (OSError, ValueError):
        return None
    if len(info) < _TCPI_BYTES_RECEIVED.stop:
        return None
    return int.from_bytes(info[_TCPI_BYTES_RECEIVED], sys.byteorder)


def query_fingerprint(sql: str) -> str:
    normalized = _IN_LIST.sub("IN (...)", sql)
    normalized = _PAGING.sub("LIMIT N", normalized)
    normalized = _SAVEPOINT_ID.sub('"s"', normalized)
    return hashlib.blake2b(normalized.encode(), digest_size=6).hexdigest()


def query_label(sql: str) -> str:
    verb = _VERB.match(sql)
    # outermost table, not one inside a subquery
    table, table_depth, depth, last = None, 0, 0, 0
    for match in _TABLE.finditer(sql):
        start = match.start()
        depth += sql.count("(", last, start) - sql.count(")", last, start)
        last = start
        if table is None or depth < table_depth:
            table, table_depth = match, depth
    parts = (verb[1].upper() if verb else None, table[1] if table else None)
    return " ".join(part for part in parts if part)


class DbEgressCollector:
    def __init__(self, read_bytes=None):
        self.read_bytes = read_bytes or tcp_bytes_received
        self.queries = 0
        self.shapes: dict[str, dict] = {}
        self._fingerprints: dict[str, str] = {}

    @contextmanager
    def install(self):
        with ExitStack() as stack:
            for alias in connections:
                stack.enter_context(connections[alias].execute_wrapper(self))
            yield self

    def __call__(self, execute, sql, params, many, context):
        before = self._read(context)
        try:
            return execute(sql, params, many, context)
        finally:
            with suppress(Exception):
                self._record(sql, before, self._read(context))

    def _read(self, context) -> int | None:
        try:
            # a server-side cursor's rows arrive in later FETCHes, outside this wrapper
            if getattr(context["cursor"].cursor, "name", None) is not None:
                return None
            return self.read_bytes(context["connection"])
        except Exception:
            return None

    def _record(self, sql, before: int | None, after: int | None):
        self.queries += 1
        sql = str(sql)
        delta = None if before is None or after is None else after - before
        fp = self._fingerprints.get(sql)
        if fp is None:
            fp = self._fingerprints[sql] = query_fingerprint(sql)
        shape = self.shapes.get(fp)
        if shape is None:
            shape = self.shapes[fp] = {
                "label": query_label(sql),
                "fp": fp,
                "calls": 0,
                "bytes": 0,
                "max_bytes": 0,
            }
        shape["calls"] += 1
        if delta is None or shape["bytes"] is None:
            shape["bytes"] = shape["max_bytes"] = None
        else:
            shape["bytes"] += delta
            shape["max_bytes"] = max(shape["max_bytes"], delta)

    @property
    def db_bytes(self) -> int | None:
        totals = [shape["bytes"] for shape in self.shapes.values()]
        return None if None in totals else sum(totals)

    def top(self, n: int = _TOP_SHAPES) -> list[dict]:
        return sorted(
            self.shapes.values(),
            key=lambda shape: (shape["bytes"] or 0, shape["calls"]),
            reverse=True,
        )[:n]


def _client(user_agent: str) -> str:
    if user_agent.startswith("CFWorkerProxy"):
        return "gateway"
    if user_agent.startswith("node"):
        return "nextjs"
    # the Next.js /api-proxy forwards the browser's User-Agent
    if user_agent.startswith("Mozilla/"):
        return "browser"
    return "other"


def _resolve(request):
    urlconf = getattr(request, "urlconf", None)
    for path_info in (request.path_info, f"{request.path_info}/"):
        with suppress(Resolver404):
            return resolve(path_info, urlconf)
    return None


def _summary(request, response, collector: DbEgressCollector, ms: int) -> dict:
    # resolver_match is None on APPEND_SLASH redirects and CORS preflights
    match = request.resolver_match or _resolve(request)
    user = getattr(request, "user", None)
    # evaluating a lazy user here would run auth queries after the response
    if isinstance(user, SimpleLazyObject) and user._wrapped is empty:
        user = None
    authenticated = user is not None and user.is_authenticated
    return {
        "route": (
            match.route if match else _DIGIT_SEGMENT.sub("/{id}", request.path)[:200]
        ),
        "view": match.view_name if match else None,
        "method": request.method,
        "status": response.status_code,
        "client": _client(request.headers.get("User-Agent", "")),
        "auth": "user" if authenticated else "anon",
        "tier": user.api_access_tier if authenticated else None,
        "bot": user.is_bot if authenticated else None,
        "params": {k: request.GET[k][:32] for k in _LOGGED_PARAMS if k in request.GET},
        "queries": collector.queries,
        "db_bytes": collector.db_bytes,
        "resp_bytes": None if response.streaming else len(response.content),
        "ms": ms,
        "top": collector.top(),
    }


class DbEgressSamplingMiddleware:
    def __init__(self, get_response):
        self.rate = settings.DB_EGRESS_SAMPLE_RATE
        if self.rate <= 0:
            raise MiddlewareNotUsed
        self.get_response = get_response

    def __call__(self, request):
        if random.random() >= self.rate:
            return self.get_response(request)

        collector = DbEgressCollector()
        start = time.perf_counter()
        with collector.install():
            response = self.get_response(request)
        ms = round((time.perf_counter() - start) * 1000)
        try:
            summary = _summary(request, response, collector, ms)
            logger.info(json.dumps(summary, separators=(",", ":")))
        except Exception:
            logger.exception("Failed to log DB egress sample")
        return response
