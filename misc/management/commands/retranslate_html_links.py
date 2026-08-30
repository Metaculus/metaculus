import logging
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db.models import Q
from modeltranslation.translator import translator
from modeltranslation.utils import build_localized_fieldname
from django.conf import settings

from utils.translation import (
    detect_and_update_content_language,
    get_translation_fields_for_model,
    update_translations_for_model,
)

logging.basicConfig(level=logging.DEBUG)

# Markdown links whose label contains an inline HTML tag - e.g. [<u>text</u>](url).
# Those were destroyed by translating markdown with the (previously defaulted)
# "text/html" mimeType, which dropped the "[" and "](url)" around the tag.
BROKEN_LINK_REGEX = r"\[[^\]]*<[a-zA-Z]"


def get_models(app_label, model_name):
    models = translator.get_registered_models(abstract=False)
    models = [m for m in models if not m._meta.proxy and m._meta.managed]

    if app_label:
        models = [m for m in models if m._meta.app_label == app_label]

    if model_name:
        model_name = model_name.lower()
        models = [m for m in models if m._meta.model_name == model_name]

    return models


def filter_affected(queryset):
    model = queryset.model
    original_lang = settings.ORIGINAL_LANGUAGE_CODE

    match_any_field = Q()
    for field_name in get_translation_fields_for_model(model):
        original_field = build_localized_fieldname(field_name, original_lang)
        match_any_field |= Q(**{f"{original_field}__regex": BROKEN_LINK_REGEX})

    return queryset.filter(
        match_any_field,
        is_automatically_translated=True,
        # Objects without a detected language were never translated, so they have
        # nothing broken to repair. Leave them to the regular update_translations run
        # rather than translating them for the first time as a side effect of this.
        content_original_lang__isnull=False,
    )


class Command(BaseCommand):
    help = (
        "Re-translate content whose markdown links were destroyed by translating"
        " with the html mimeType. Dry run by default."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("app_label", nargs="?")
        parser.add_argument("model_name", nargs="?")
        parser.add_argument("--batch_size", default=5, type=int)
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually re-translate. Without it the command only reports counts.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        batch_size = options["batch_size"]
        apply = options["apply"]

        for model in get_models(options["app_label"], options["model_name"]):
            pks = list(
                filter_affected(model._default_manager.all()).values_list(
                    "pk", flat=True
                )
            )

            if not pks:
                continue

            logging.info(
                f"{model.__name__}: {len(pks)} affected objects, e.g. {pks[:10]}"
            )

            if not apply:
                continue

            queryset = model._default_manager.filter(pk__in=pks)
            # Nulling the hash is what makes queryset_filter_outdated_translations
            # pick these up again - the original content itself has not changed.
            queryset.update(content_last_md5=None)

            detect_and_update_content_language(queryset, batch_size)
            update_translations_for_model(queryset, batch_size)

        if not apply:
            logging.info("Dry run - pass --apply to re-translate.")
