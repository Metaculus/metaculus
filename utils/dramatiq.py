import functools
from typing import Callable

import dramatiq
import sentry_sdk
from django.conf import settings
from dramatiq import RateLimitExceeded
from dramatiq.rate_limits import ConcurrentRateLimiter
from dramatiq.rate_limits.backends import RedisBackend
from sentry_sdk import start_transaction


def get_redis_backend():
    return RedisBackend(**settings.DRAMATIQ_RATE_LIMITER_BACKEND_OPTIONS)


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


class SentryTracingMiddleware(dramatiq.Middleware):
    """
    Custom middleware that starts a Sentry transaction for each Dramatiq message.
    Because DjangoIntegration is already active (see settings.py), any ORM calls
    during the actor will automatically generate DB spans under this transaction.
    """

    def before_process_message(self, broker, message):
        # Start a new transaction with the actor’s name. When this transaction is
        # active, DjangoIntegration will record ORM queries as child spans automatically.
        transaction = start_transaction(
            op="task.dramatiq",
            name=message.actor_name,
            sampled=True,  # Honors traces_sample_rate from Sentry SDK init
        )
        # Keep a reference so we can finish it later
        message._sentry_transaction = transaction

    def after_process_message(self, broker, message, *, result=None, exception=None):
        transaction = getattr(message, "_sentry_transaction", None)
        if not transaction:
            return

        if exception:
            # Capture exception inside this transaction’s context, tagging it
            sentry_sdk.capture_exception(exception)
            transaction.set_status("internal_error")
        else:
            transaction.set_status("ok")

        transaction.finish()
