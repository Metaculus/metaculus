import logging
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from modeltranslation.translator import translator

from utils.translation import (
    update_translations_for_model,
    queryset_filter_outdated_translations,
    detect_and_update_content_language,
)

logging.basicConfig(level=logging.DEBUG)


def get_models(app_label, model_name):
    # get all models excluding proxy- and not managed models
    models = translator.get_registered_models(abstract=False)
    models = [m for m in models if not m._meta.proxy and m._meta.managed]

    if app_label:
        models = [m for m in models if m._meta.app_label == app_label]

    if model_name:
        model_name = model_name.lower()
        models = [m for m in models if m._meta.model_name == model_name]

    return models


class Command(BaseCommand):
    help = "Update the localized fields with the machine generated translations"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "app_label",
            nargs="?",
            help="App label of an application to update empty values.",
        )
        parser.add_argument(
            "model_name",
            nargs="?",
            help="Model name to update empty values of only this model.",
        )
        parser.add_argument(
            "--batch_size",
            default="5",
            type=int,
            help="Number of parallel requests to make for content detection and translation",
        )
        parser.add_argument(
            "ids",
            nargs="?",
            help="Comma separated IDs for the objects to update.",
        )
        parser.add_argument(
            "--language",
            action="store",
            help=(
                "Language translation field the be updated."
                " Default language field if not provided"
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        batch_size: int = options["batch_size"]
        app_label = options["app_label"]
        model_name = options["model_name"]
        ids = options["ids"]

        models = get_models(app_label, model_name)

        for model in models:
            queryset = model._default_manager.all()

            if ids:
                ids = [int(id) for id in ids.split(",")]
                queryset = queryset.filter(pk__in=ids)

            queryset = model._default_manager.all()
            if ids:
                ids = [int(id) for id in ids.split(",")]
                queryset = queryset.filter(pk__in=ids)

            queryset = queryset_filter_outdated_translations(queryset)

            logging.info(
                f"Detecting language and updating translations for model {model}, {queryset.count()} objects"
            )

            detect_and_update_content_language(queryset, batch_size)

            update_translations_for_model(
                queryset,
                batch_size,
            )
