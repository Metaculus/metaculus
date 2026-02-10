import functools
import hashlib
import json
import logging
from typing import Callable, Protocol, TypeVar

from django.core.cache import cache
from django.db.models import Model
from django.utils.encoding import force_str

logger = logging.getLogger(__name__)

_SENTINEL = object()

T = TypeVar("T")


class CachedFunction(Protocol[T]):
    cache_key: str

    def __call__(self) -> T: ...

    def clear_cache(self) -> None: ...

    def refresh_cache(self) -> T: ...


def cached_singleton(
    timeout: int | None = None,
) -> Callable[[Callable[[], T]], CachedFunction[T]]:
    """
    Decorator for caching the result of a zero-argument function.

    Usage:
        @cached_singleton(timeout=3600)
        def get_expensive_data() -> list[int]:
            return compute()

        get_expensive_data()              # get or set cache (returns list[int])
        get_expensive_data.clear_cache()  # clear cached value
        get_expensive_data.refresh_cache() # clear + recompute (returns list[int])
        get_expensive_data.cache_key      # the Redis key (str)
    """

    def decorator(fn: Callable[[], T]) -> CachedFunction[T]:
        cache_key = f"cached_singleton:{fn.__module__}.{fn.__qualname__}"

        @functools.wraps(fn)
        def wrapper(*args, **kwargs) -> T:
            if args or kwargs:
                raise TypeError(
                    f"{fn.__qualname__}() is a cached zero-argument function "
                    f"and does not accept arguments"
                )
            result = cache.get(cache_key, _SENTINEL)
            if result is _SENTINEL:
                result = fn()
                cache.set(cache_key, result, timeout)
            return result

        def clear_cache() -> None:
            cache.delete(cache_key)

        def refresh_cache() -> T:
            cache.delete(cache_key)
            result = fn()
            cache.set(cache_key, result, timeout)
            return result

        wrapper.clear_cache = clear_cache
        wrapper.refresh_cache = refresh_cache
        wrapper.cache_key = cache_key

        return wrapper

    return decorator


def cache_get_or_set(key, f: Callable, version: int = None, **kwargs):
    # Try to get the result from the cache
    result = cache.get(key, version=version)

    if not result:
        result = f()
        cache.set(key, result, version=version, **kwargs)

    return result


def _default_key(func_name: str) -> Callable:
    def f(obj, *args, **kwargs):
        ident = (
            f"{obj._meta.label}:{obj.pk}" if isinstance(obj, Model) else force_str(obj)
        )
        ctx = hashlib.md5(
            json.dumps([args, kwargs], default=force_str, sort_keys=True).encode()
        ).hexdigest()
        return f"{func_name}:{ident}:{ctx}"

    return f


def cache_per_object(
    key_builder: Callable | None = None,  # ← was “callable | None”
    *,
    timeout: int | None = None,
):
    def decorator(fn):
        fqfn = f"{fn.__module__}.{fn.__qualname__}"

        @functools.wraps(fn)
        def wrapper(objects, *args, **kwargs) -> dict:
            kb = key_builder or _default_key(fqfn)

            objs = list(objects)
            keys = [kb(o, *args, **kwargs) for o in objs]
            cached = cache.get_many(keys)

            hits, misses, miss_keys = {}, [], {}
            for o, k in zip(objs, keys):
                if k in cached:
                    hits[o] = cached[k]
                else:
                    misses.append(o)
                    miss_keys[o] = k

            if misses:
                fresh = fn(misses, *args, **kwargs)
                cache.set_many({miss_keys[o]: v for o, v in fresh.items()}, timeout)
                hits.update(fresh)

            return hits

        return wrapper

    return decorator
