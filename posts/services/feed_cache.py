"""
Redis caching for the /api/posts feed.

Layer 1: full-response cache for anonymous requests (TTL 75s).
Layer 2: per-post anonymous serialization fragments + per-user overlay (TTL 60s).
See docs/superpowers/specs/2026-06-11-feed-caching-design.md.
"""

import hashlib
import json
import logging
import pickle
import zlib
from datetime import datetime

from django.core.cache import cache
from django.db.models import Model
from django.utils.translation import get_language

logger = logging.getLogger(__name__)

FRAGMENT_TTL = 60
RESPONSE_TTL = 75
# Deep pagination and unbounded-keyspace params are not worth caching
MAX_CACHEABLE_OFFSET = 200
UNCACHEABLE_PARAMS = ("search", "similar_to_post_id", "ids")


def dumps_cached(obj) -> bytes:
    # pickle keeps datetimes exact so cached output is identical to fresh DRF
    # output; zlib level 1 compresses repetitive JSON-ish payloads ~8x at a
    # fraction of the default level's CPU cost
    return zlib.compress(pickle.dumps(obj, protocol=pickle.HIGHEST_PROTOCOL), level=1)


def loads_cached(blob: bytes):
    return pickle.loads(zlib.decompress(blob))


def _canonical(value):
    if isinstance(value, Model):
        return f"{type(value).__name__}:{value.pk}"
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _canonical(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return sorted(str(_canonical(v)) for v in value)
    return value


def _hash_payload(payload: dict) -> str:
    blob = json.dumps(_canonical(payload), sort_keys=True, default=str)
    return hashlib.sha256(blob.encode()).hexdigest()


def fragment_cache_key(
    post_id: int, edited_at: datetime | None, locale: str, flags: dict
) -> str:
    edited_ts = edited_at.timestamp() if edited_at else 0
    return f"feed_frag:{post_id}:{edited_ts}:{locale}:{_hash_payload(flags)}"


def feed_response_cache_key(
    validated_filters: dict, extra: dict, limit: int | None, offset: int
) -> str | None:
    if limit is None or offset > MAX_CACHEABLE_OFFSET:
        return None
    if any(validated_filters.get(p) for p in UNCACHEABLE_PARAMS):
        return None

    payload = {
        "filters": validated_filters,
        "extra": extra,
        "limit": limit,
        "offset": offset,
        "locale": get_language(),
    }
    return f"feed_resp:{_hash_payload(payload)}"


def cache_get_many_safe(keys: list[str]) -> dict:
    try:
        return {k: loads_cached(v) for k, v in cache.get_many(keys).items()}
    except Exception:
        logger.exception("Feed cache get_many failed")
        return {}


def cache_set_many_safe(mapping: dict, timeout: int) -> None:
    try:
        cache.set_many(
            {k: dumps_cached(v) for k, v in mapping.items()}, timeout=timeout
        )
    except Exception:
        logger.exception("Feed cache set_many failed")


def get_cached_feed_response(key: str):
    try:
        blob = cache.get(key)
    except Exception:
        logger.exception("Feed response cache get failed")
        return None
    return loads_cached(blob) if blob is not None else None


def set_cached_feed_response(key: str, results: list) -> None:
    try:
        cache.set(key, dumps_cached(results), timeout=RESPONSE_TTL)
    except Exception:
        logger.exception("Feed response cache set failed")


# The FE's default logged-out consumer feed request, verbatim (see
# ClientPostsApi.getPostsWithCP + questions page feed defaults). If the FE
# default changes, warming silently stops matching — it only costs a miss.
DEFAULT_FEED_QUERY = {
    "for_main_feed": "true",
    "for_consumer_view": "true",
    "order_by": "-hotness",
    "statuses": ["open", "closed", "resolved", "upcoming"],
    "limit": "24",
    "with_cp": "true",
    "include_descriptions": "false",
    "include_cp_history": "true",
    "include_movements": "true",
}


def warm_default_feed_response():
    """
    Re-computes the default anonymous consumer feed through the real view.
    Runs under ORIGINAL_LANGUAGE_CODE — the locale LocaleOverrideMiddleware
    activates for requests without an Accept-Language header (SSR fetches).
    """
    from django.conf import settings
    from django.contrib.auth.models import AnonymousUser
    from django.test import RequestFactory
    from django.utils.translation import override
    from rest_framework.request import Request

    if not settings.FEED_RESPONSE_CACHE_ENABLED:
        return

    from posts.serializers import PostFilterSerializer
    from posts.views import posts_list_api_view
    from utils.paginator import CountlessLimitOffsetPagination

    with override(settings.ORIGINAL_LANGUAGE_CODE):
        request = RequestFactory().get("/api/posts/", data=DEFAULT_FEED_QUERY)
        request.user = AnonymousUser()

        # Compute the key the view will use and drop it, so the view recomputes
        # instead of serving the still-valid cached value.
        drf_request = Request(request)
        filters = PostFilterSerializer(data=drf_request.query_params)
        filters.is_valid(raise_exception=True)
        paginator = CountlessLimitOffsetPagination()
        key = feed_response_cache_key(
            filters.validated_data,
            {
                "with_cp": True,
                "include_descriptions": False,
                "include_cp_history": True,
                "include_movements": True,
                "include_conditional_cps": None,
                "group_cutoff": 3,
            },
            paginator.get_limit(drf_request),
            paginator.get_offset(drf_request),
        )
        if key:
            try:
                cache.delete(key)
            except Exception:
                logger.exception("Feed cache warm delete failed")

        response = posts_list_api_view(request)
        if response.status_code != 200:
            logger.error(
                "Feed cache warming failed with status %s", response.status_code
            )


def build_cached_paginated_response(paginator, request, results):
    """
    Rebuilds CountlessLimitOffsetPagination's response shape around cached
    results. Links derive from the live request, so cached entries never leak
    another request's host or param order.
    """
    from rest_framework.response import Response

    paginator.request = request
    paginator.limit = paginator.get_limit(request)
    paginator.offset = paginator.get_offset(request)
    paginator.count = paginator.get_count(None)

    return Response(
        {
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "results": results,
        }
    )


def serialize_post_many_cached(
    posts,
    *,
    current_user=None,
    with_cp: bool = False,
    with_subscriptions: bool = False,
    group_cutoff: int = None,
    with_key_factors: bool = False,
    include_descriptions: bool = False,
    include_cp_history: bool = False,
    include_movements: bool = False,
    include_conditional_cps: bool = False,
    include_average_scores: bool = False,
    include_user_forecasts: bool = False,
) -> list[dict]:
    """
    serialize_post_many with the user-independent phase
    (serialize_post_many_base) memoized per post in Redis. The user phase
    (enrich_posts_for_user) is the same code the fresh path runs — this module
    knows nothing about the serialized shape.
    """
    from posts.models import Post
    from posts.serializers import enrich_posts_for_user, serialize_post_many_base

    flags = dict(
        with_cp=with_cp,
        group_cutoff=group_cutoff,
        with_key_factors=with_key_factors,
        include_descriptions=include_descriptions,
        include_cp_history=include_cp_history,
        include_movements=include_movements,
        include_conditional_cps=include_conditional_cps,
        include_average_scores=include_average_scores,
    )

    ids = [p.id if isinstance(p, Post) else p for p in posts]
    locale = get_language()
    edited_map = dict(Post.objects.filter(id__in=ids).values_list("id", "edited_at"))
    keys = {
        post_id: fragment_cache_key(post_id, edited_map.get(post_id), locale, flags)
        for post_id in ids
    }

    cached = cache_get_many_safe(list(keys.values()))
    fragments_by_id = {
        post_id: cached[key] for post_id, key in keys.items() if key in cached
    }

    miss_ids = [post_id for post_id in ids if post_id not in fragments_by_id]
    if miss_ids:
        fresh = serialize_post_many_base(miss_ids, **flags)
        fresh_by_id = {fragment["id"]: fragment for fragment in fresh}
        # store BEFORE enrichment mutates the dicts
        cache_set_many_safe(
            {keys[post_id]: fresh_by_id[post_id] for post_id in fresh_by_id},
            timeout=FRAGMENT_TTL,
        )
        fragments_by_id.update(fresh_by_id)

    # posts can disappear between the feed query and here; keep known ones
    ordered = [fragments_by_id[i] for i in ids if i in fragments_by_id]

    return enrich_posts_for_user(
        ordered,
        current_user,
        with_cp=with_cp,
        include_user_forecasts=include_user_forecasts,
        with_key_factors=with_key_factors,
        with_subscriptions=with_subscriptions,
    )
