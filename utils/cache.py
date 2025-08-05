import functools
import hashlib
import json
from typing import Callable

from django.core.cache import cache
from django.db.models import Model
from django.utils.encoding import force_str


def cache_get_or_set(key, f: callable, version: int = None, **kwargs):
    # Try to get the result from the cache
    result = cache.get(key, version=version)

    if not result:
        result = f()
        cache.set(key, result, version=version, **kwargs)

    return result


def _default_key(obj, fqfn: str, args: tuple, kw: dict) -> str:
    ident = f"{obj._meta.label}:{obj.pk}" if isinstance(obj, Model) else force_str(obj)
    ctx = hashlib.md5(
        json.dumps([args, kw], default=force_str, sort_keys=True).encode()
    ).hexdigest()
    return f"{fqfn}:{ident}:{ctx}"


def cache_per_object(
    key_builder: Callable | None = None,  # ← was “callable | None”
    *,
    timeout: int | None = None,
):
    key_builder = key_builder or _default_key

    def decorator(fn):
        fqfn = f"{fn.__module__}.{fn.__qualname__}"

        @functools.wraps(fn)
        def wrapper(objects, *args, **kw) -> dict:
            objs = list(objects)
            keys = [key_builder(o, fqfn, args, kw) for o in objs]
            cached = cache.get_many(keys)

            hits, misses, miss_keys = {}, [], {}
            for o, k in zip(objs, keys):
                if k in cached:
                    hits[o] = cached[k]
                else:
                    misses.append(o)
                    miss_keys[o] = k

            if misses:
                fresh = fn(misses, *args, **kw)
                cache.set_many({miss_keys[o]: v for o, v in fresh.items()}, timeout)
                hits.update(fresh)

            return hits

        return wrapper

    return decorator
