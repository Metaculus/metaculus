import dramatiq
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import EmailMessage

from questions.types import AggregationMethod
from utils.dramatiq import task_concurrent_limit
from utils.translation import (
    update_translations_for_model,
    detect_and_update_content_language,
    queryset_filter_outdated_translations,
)


@dramatiq.actor(min_backoff=3_000, max_retries=3)
@task_concurrent_limit(
    lambda app_label, model_name, pk: f"mutex:update-translations-{app_label}.{model_name}/{pk}",
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
            body="Error generating Metaculus data. Please contact an administrator "
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
    include_key_factors: bool,
    only_include_user_ids: list[int] | None,
    include_bots: bool | None,
    anonymized: bool,
    include_future: bool,
    joined_before_date: str | None = None,
):
    try:
        import datetime

        from utils.csv_utils import export_data_for_questions

        parsed_joined_before = (
            datetime.datetime.fromisoformat(joined_before_date)
            if joined_before_date
            else None
        )

        data = export_data_for_questions(
            user_id=user_id,
            is_staff=is_staff,
            is_whitelisted=is_whitelisted,
            question_ids=question_ids,
            aggregation_methods=aggregation_methods,
            minimize=minimize,
            include_scores=include_scores,
            include_user_data=include_user_data,
            include_comments=include_comments,
            include_key_factors=include_key_factors,
            only_include_user_ids=only_include_user_ids,
            include_bots=include_bots,
            joined_before_date=parsed_joined_before,
            anonymized=anonymized,
            include_future=include_future,
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
            body="Error generating Metaculus data. Please contact an administrator "
            f"for assistance.\nError: {e}",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[user_email],
        )
        email.send()


@dramatiq.actor
def email_user_their_data_task(user_id: int):
    from users.models import User

    user = User.objects.filter(id=user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} does not exist.")
    user_email = user.email
    try:
        from utils.csv_utils import export_data_for_user

        data = export_data_for_user(user)

        assert data is not None, "No data generated"

        email = EmailMessage(
            subject="Your User Data",
            body="Attached is your User Data on Metaculus.",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[user_email],
        )
        email.attach("user_data.zip", data, "application/zip")
        email.send()

    except Exception as e:
        email = EmailMessage(
            subject="Error generating Metaculus data",
            body="Error generating Metaculus data. Please contact an administrator "
            f"for assistance.\nError: {e}",
            from_email=settings.EMAIL_SENDER_NO_REPLY,
            to=[user_email],
        )
        email.send()
