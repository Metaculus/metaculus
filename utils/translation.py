import asyncio
import base64
import hashlib
import html
import json
import logging
from datetime import datetime
import time

import aiohttp
from django.conf import settings
from django.core.cache import cache
from django.db.models import F, Q, TextField
from django.db.models.functions import MD5, Concat
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from modeltranslation.translator import translator
from modeltranslation.utils import build_localized_fieldname


def migration_update_default_fields(model, translation_fields):
    print(f"Updating the original fields for model: {model}")
    for field_name in translation_fields:
        def_lang_fieldname = f"{field_name}_original"
        print(f"   - update data from {field_name} -> {def_lang_fieldname}")
        start_time = time.time()
        count = model.objects.update(**{def_lang_fieldname: F(field_name)})
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"      - update {count} entries in {execution_time:.2f} seconds")


# Google translate API calls utils
def get_and_cache_sa_info():
    service_account_info = json.loads(
        base64.b64decode(settings.GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY)
    )

    token = cache.get("translate_token")
    if token is None:
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/cloud-translation"],
        )

        credentials.refresh(Request())

        token_validity = (credentials.expiry - datetime.now()).total_seconds()

        token = credentials.token
        cache.set("translate_token", token, token_validity * 0.8)
    return token, service_account_info["project_id"]


async def agoogle_translate_detect_language(text):
    token, project_id = get_and_cache_sa_info()
    url = f"https://translation.googleapis.com/v3/projects/{project_id}/locations/global:detectLanguage"
    # url = f"http://localhost:9000/v3/projects/{service_account_info["project_id"]}/locations/global:detectLanguage"
    headers = {
        "Authorization": f"Bearer {token}",
        "x-goog-user-project": project_id,
        "Content-Type": "application/json; charset=utf-8",
    }
    data = {"content": text}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                langCode = result["languages"][0]["languageCode"]
                if "-" in langCode:
                    langCode = langCode.split("-")[0]
                return langCode
            else:
                error = await response.text()
                raise Exception(f"Error detecting language: {error}")


async def agoogle_translate_text(source_language, target_language, text):
    token, project_id = get_and_cache_sa_info()

    if source_language == target_language:
        return text

    # Google Translates doesn't preserve new lines, as it translates text as if it was HTML.
    # so we use a hack by inserting a <br> element for each \n before translating,
    # and then we replace it back with the new line after translation.
    # In addition, it also html-escapes the input so we need to unescape it after the translation
    text = text.replace("\n", "<br>")
    url = f"https://translation.googleapis.com/v3/projects/{project_id}:translateText"

    headers = {
        "Authorization": f"Bearer {token}",
        "x-goog-user-project": project_id,
        "Content-Type": "application/json; charset=utf-8",
        "mimeType": "text/plain",
    }

    data = {
        "sourceLanguageCode": source_language,
        "targetLanguageCode": target_language,
        "contents": text,
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                output = result["translations"][0]["translatedText"]
                # See the comment above with the new lines
                output = output.replace("<br>", "\n")
                output = html.unescape(output)
                return output
            else:
                error = await response.text()
                raise Exception(f"Error translating text: {error}")


# Other utils
def get_translation_fields_for_model(model):
    opts = translator.get_options_for_model(model)
    return sorted(list(opts.all_fields.keys()))


def build_supported_localized_fieldname(field_name, source_lang):
    default_lang = settings.ORIGINAL_LANGUAGE_CODE
    if source_lang not in [
        lang[0] for lang in settings.LANGUAGES if lang[0] != default_lang
    ]:
        source_lang = default_lang
    return build_localized_fieldname(field_name, source_lang)


def batch_qs(queryset, batch_size):
    """
    Used for querysets that get modified while being iterated over.
    Relies on the pk for keeping track of the current iteration.
    """
    queryset = queryset.order_by("pk")
    last_pk = None
    while True:
        if last_pk is None:
            batch_qs = queryset[:batch_size]
        else:
            batch_qs = queryset.filter(pk__gt=last_pk)[:batch_size]
        batch = list(batch_qs)
        if not batch:
            break

        yield batch
        last_pk = batch[-1].pk


# Language detection utils
def get_first_words(text, num_words=5):
    words = text.split()
    return " ".join(words[: min(len(words), num_words)])


def build_text(obj, field_names):
    obj_field_values = [getattr(obj, field_name) or "" for field_name in field_names]
    return " ".join([get_first_words(val, 40) for val in obj_field_values if val])


async def adetect_language_for_object(obj, fields):
    text = build_text(obj, fields)
    if not text:
        return (obj, None)

    lang = await agoogle_translate_detect_language(text)
    supported_languages = [
        lang[0]
        for lang in settings.LANGUAGES
        if lang[0] != settings.ORIGINAL_LANGUAGE_CODE
    ]
    if lang not in supported_languages:
        lang = "en"

    return (obj, lang)


def detect_language_for_object(obj, fields):
    return asyncio.run(adetect_language_for_object(obj, fields))


async def adetect_language_for_objects(objects, translation_fields):
    return await asyncio.gather(
        *[adetect_language_for_object(obj, translation_fields) for obj in objects],
    )


def detect_language_for_objects(objects, translation_fields):
    return asyncio.run(adetect_language_for_objects(objects, translation_fields))


def detect_and_update_content_language(queryset, batch_size):
    processed_count = 0
    model = queryset.model
    translation_fields = get_translation_fields_for_model(model)
    original_content_fields = [
        build_localized_fieldname(field_name, settings.ORIGINAL_LANGUAGE_CODE)
        for field_name in translation_fields
    ]
    for objects in batch_qs(queryset, batch_size):
        results = asyncio.run(
            adetect_language_for_objects(objects, original_content_fields)
        )

        bulk_objects = []
        for obj, lang in results:
            if lang is not None:
                obj.content_original_lang = lang
                bulk_objects.append(obj)
        processed_count += model._default_manager.bulk_update(
            bulk_objects, ["content_original_lang"]
        )

    return processed_count


# Fields and objects translation utils
def is_translation_dirty(object):
    translation_fields = get_translation_fields_for_model(object.__class__)
    default_language = settings.ORIGINAL_LANGUAGE_CODE
    hashed_content = ""
    for field_name in translation_fields:
        hashed_content += (
            getattr(
                object,
                build_supported_localized_fieldname(field_name, default_language),
            )
            or ""
        )

    return (
        object.content_last_md5
        != hashlib.md5(hashed_content.encode("utf-8")).hexdigest()
    )


async def atranslate_field(
    obj,
    source_lang,
    target_lang,
    source_text,
    target_field,
):
    target_text = await agoogle_translate_text(source_lang, target_lang, source_text)
    return (
        obj,
        target_field,
        target_text,
    )


def translate_fields_for_object_coroutines(obj, field_names, languages):
    co_routines = []
    source_lang = obj.content_original_lang

    if not source_lang:
        return []

    for field_name in field_names:
        source_text_field_name = build_supported_localized_fieldname(
            field_name, settings.ORIGINAL_LANGUAGE_CODE
        )
        source_text = getattr(obj, source_text_field_name, None)
        if source_text is None or source_text == "":
            continue

        co_routines.extend(
            atranslate_field(
                obj=obj,
                source_lang=source_lang,
                target_lang=lang,  # target language
                source_text=source_text,  # source text
                target_field=build_localized_fieldname(field_name, lang),
            )
            for lang in languages
        )

    return co_routines


def translate_fields_for_objects(objects, translation_fields, languages):
    async def gather_all_translations(objects, translation_fields, languages):
        return await asyncio.gather(
            *[
                translate_coroutine
                for obj in objects
                for translate_coroutine in translate_fields_for_object_coroutines(
                    obj, translation_fields, languages
                )
            ],
        )

    results = asyncio.run(
        gather_all_translations(objects, translation_fields, languages)
    )

    grouped_results = {}

    for obj, field_name, field_val in results:
        obj_vals = grouped_results.get(obj, [])
        obj_vals.append((field_name, field_val))
        grouped_results[obj] = obj_vals
    return grouped_results


def prepare_bulk_translations_for_objects(objects, translation_fields, languages):
    results = translate_fields_for_objects(objects, translation_fields, languages)

    bulk_objects = []
    bulk_fields = set()
    for obj, translated_fields in results.items():
        source_field_lang = settings.ORIGINAL_LANGUAGE_CODE
        for field_name, field_val in translated_fields:
            bulk_fields.add(field_name)
            # set the translated field on the object
            setattr(obj, field_name, field_val)

        # update the hash for the original content
        # (the one the translation has been created from)
        all_original_content = "".join(
            [
                getattr(
                    obj,
                    build_supported_localized_fieldname(
                        original_lang_field, source_field_lang
                    ),
                )
                or ""
                for original_lang_field in translation_fields
            ]
        )
        obj.content_last_md5 = hashlib.md5(
            all_original_content.encode("utf-8")
        ).hexdigest()

        bulk_objects.append(obj)
    bulk_fields.add("content_last_md5")
    return list(bulk_fields)


def queryset_filter_outdated_translations(queryset):
    original_lang_code = settings.ORIGINAL_LANGUAGE_CODE
    model = queryset.model
    translation_fields = get_translation_fields_for_model(model)
    concat_fields = F(
        build_supported_localized_fieldname(translation_fields[0], original_lang_code)
    )

    for field in translation_fields[1:]:
        concat_fields = Concat(
            concat_fields,
            F(build_supported_localized_fieldname(field, original_lang_code)),
            output_field=TextField(),
        )

    queryset = (
        queryset.annotate(hashed_content=concat_fields)
        .annotate(content_md5=MD5(concat_fields))
        .exclude(hashed_content__isnull=True)
        .exclude(hashed_content__exact="")
        .filter(
            Q(content_last_md5__isnull=True) | ~Q(content_md5=F("content_last_md5"))
        )
    )

    queryset |= queryset.filter(content_original_lang__isnull=True)

    return queryset


def update_translations_for_model(
    queryset,
    batch_size,
):
    model = queryset.model
    translation_fields = get_translation_fields_for_model(model)
    initial_count = queryset.count()
    languages = [
        lang[0]
        for lang in settings.LANGUAGES
        if lang[0] != settings.ORIGINAL_LANGUAGE_CODE
    ]
    queryset = queryset_filter_outdated_translations(queryset)

    total_objects = queryset.count()

    logging.info(
        f"Found in total {total_objects} {model} objects which need translations update from the {initial_count} passed."
    )

    processed_count = 0
    for objects in batch_qs(queryset, batch_size):
        bulk_fields = prepare_bulk_translations_for_objects(
            objects, translation_fields, languages
        )
        processed_count += model._default_manager.bulk_update(objects, bulk_fields)

    logging.info(f"Updated translations for {total_objects} objects")

    return processed_count
