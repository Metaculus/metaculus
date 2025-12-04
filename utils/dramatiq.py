import functools
from typing import Callable

from django.conf import settings
from dramatiq import RateLimitExceeded
from dramatiq.rate_limits import ConcurrentRateLimiter
from dramatiq.rate_limits.backends import RedisBackend


@functools.lru_cache(maxsize=None)
def get_redis_backend():
    """
    ConcurrentRateLimiter uses the same Redis db index as redis queue
    """

    return RedisBackend(**settings.DRAMATIQ_BROKER["OPTIONS"])


def concurrency_retries(max_retries=20):
    """
    We want our calculation task be accomplished consequently no matter
    how much time it might take.
    """

    def f(retries_so_far, exception):
        return isinstance(exception, RateLimitExceeded) or retries_so_far < max_retries

    return f


def task_concurrent_limit(key: Callable | str, **limiter_kwargs):
    """
    This decorator applies ConcurrentRateLimiter to dramatiq actor
    End ensures max concurrent executions of the same actor
    """

    def f(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            mutex_key = key if isinstance(key, str) else key(*args, **kwargs)
            mutex = ConcurrentRateLimiter(
                get_redis_backend(), mutex_key, **limiter_kwargs
            )

            with mutex.acquire() as acquired:
                if acquired:
                    return func(*args, **kwargs)

        return wrapper

    return f
