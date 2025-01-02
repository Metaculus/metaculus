import dramatiq
from django.conf import settings
from django.contrib.contenttypes.models import ContentType

from utils.dramatiq import concurrency_retries, task_concurrent_limit
from utils.translation import (
    update_translations_for_model,
    detect_and_update_content_language,
    queryset_filter_outdated_translations,
)


@dramatiq.actor(max_backoff=10_000, retry_when=concurrency_retries(max_retries=20))
@task_concurrent_limit(
    lambda app_label, model_name, pk: f"update-translations-{app_label}.{model_name}/{pk}",
    limit=1,
    # This task shouldn't take longer than 1m
    # So it's fine to set mutex lock timeout for this duration
    ttl=60_000,
)
def update_translations(app_label, model_name, pk):
    if not settings.GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY:
        return

    content_type = ContentType.objects.get(app_label=app_label, model=model_name)
    model_class = content_type.model_class()

    queryset = model_class._default_manager.filter(pk=pk)

    queryset = queryset_filter_outdated_translations(queryset)
    detect_and_update_content_language(queryset, 1)
    update_translations_for_model(queryset, 1)
