from django.core.cache import cache


def cache_get_or_set(key, f: callable, **kwargs):
    # Try to get the result from the cache
    result = cache.get(key)

    if not result:
        result = f()
        cache.set(key, result, **kwargs)

    return result
