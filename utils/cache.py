from django.core.cache import cache


def cache_get_or_set(key, f: callable, version: int = None, **kwargs):
    # Try to get the result from the cache
    result = cache.get(key, version=version)

    if not result:
        result = f()
        cache.set(key, result, version=version, **kwargs)

    return result
