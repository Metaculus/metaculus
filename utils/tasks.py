import dramatiq
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import EmailMessage

from questions.types import AggregationMethod
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
def update_translations_task(app_label, model_name, pk):
    if not settings.GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY:
        return

    content_type = ContentType.objects.get(app_label=app_label, model=model_name)
    model_class = content_type.model_class()

    queryset = model_class._default_manager.filter(pk=pk)

    queryset = queryset_filter_outdated_translations(queryset)
    detect_and_update_content_language(queryset, 1)
    update_translations_for_model(queryset, 1)


@dramatiq.actor
def email_all_data_for_questions_task(
    email_address: str,
    question_ids: list[int],
    filename: str | None = None,
    include_comments: bool = False,
    include_scores: bool = True,
    **kwargs,
):
    # TODO: deprecate this, use email_data_task instead
    try:
        from utils.csv_utils import export_all_data_for_questions
        from questions.models import Question

        questions = Question.objects.filter(id__in=question_ids)
        data = export_all_data_for_questions(
            questions,
            include_comments=include_comments,
            include_scores=include_scores,
            **kwargs,
        )

        assert data is not None, "No data generated"

        email = EmailMessage(
            subject="Your Metaculus Data",
            body="Attached is your Metaculus data.",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[email_address],
        )
        email.attach(filename or "metaculus_data.zip", data, "application/zip")
        email.send()

    except Exception as e:
        email = EmailMessage(
            subject="Error generating Metaculus data",
            body="Error generating Metaculus data. Please contact an adminstrator "
            f"for assistance.\nError: {e}",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[email_address],
        )
        email.send()


@dramatiq.actor
def email_data_task(
    user_id: int,
    user_email: str,
    is_staff: bool,
    is_whitelisted: bool,
    filename: str,
    question_ids: list[int],
    aggregation_methods: list[AggregationMethod],
    minimize: bool,
    include_scores: bool,
    include_user_data: bool,
    include_comments: bool,
    user_ids: list[int] | None,
    include_bots: bool | None,
    anonymized: bool,
):
    try:
        from utils.csv_utils import export_data_for_questions

        data = export_data_for_questions(
            user_id,
            is_staff,
            is_whitelisted,
            question_ids,
            aggregation_methods,
            minimize,
            include_scores,
            include_user_data,
            include_comments,
            user_ids,
            include_bots,
            anonymized,
        )

        assert data is not None, "No data generated"

        email = EmailMessage(
            subject="Your Metaculus Data",
            body="Attached is your Metaculus data.",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[user_email],
        )
        email.attach(filename, data, "application/zip")
        email.send()

    except Exception as e:
        email = EmailMessage(
            subject="Error generating Metaculus data",
            body="Error generating Metaculus data. Please contact an adminstrator "
            f"for assistance.\nError: {e}",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[user_email],
        )
        email.send()
