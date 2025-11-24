import functools
import hashlib
import json
from typing import Callable

from django.core.cache import cache
from django.db.models import Model
from django.utils.encoding import force_str


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
