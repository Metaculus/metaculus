import logging
from collections.abc import Iterable

from django.conf import settings
from django.contrib import admin
from django.contrib import messages
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F, QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _, activate, get_language
from rest_framework.generics import get_object_or_404

from utils.tasks import update_translations_task
from utils.translation import (
    get_translation_fields_for_model,
    build_supported_localized_fieldname,
    is_translation_dirty,
)
from utils.types import DjangoModelType

logger = logging.getLogger(__name__)


def uniques_ordered_list(ordered_list):
    return list(dict.fromkeys(ordered_list))


class CustomTranslationAdmin(admin.ModelAdmin):
    actions = ["update_translations"]

    def get_form(self, request, obj=None, **kwargs):
        activate(settings.ORIGINAL_LANGUAGE_CODE)
        return super().get_form(request, obj, **kwargs)

    def should_update_translations(self, obj):
        return True

    def save_model(self, request, obj: "TranslatedModel", form, change):
        super().save_model(request, obj, form, change)

        if self.should_update_translations(obj) and obj.is_automatically_translated:
            obj.update_and_maybe_translate()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if obj and not obj.is_automatically_translated:
            return fields

        model_class = self.model
        all_translation_fields = get_translation_fields_for_model(model_class)
        specified_translation_fields = list(set(fields) & set(all_translation_fields))
        extra_fields = []
        for field_name in specified_translation_fields:
            localized_field_names = [
                build_supported_localized_fieldname(field_name, lang[0])
                for lang in settings.LANGUAGES
            ]
            extra_fields += localized_field_names
        return uniques_ordered_list(fields + extra_fields)

    def get_readonly_fields(self, request, obj=None):
        model_class = self.model
        translation_fields = get_translation_fields_for_model(model_class)
        ro_fields = list(super().get_readonly_fields(request, obj))

        if obj and not obj.is_automatically_translated:
            return uniques_ordered_list(ro_fields + translation_fields)

        # We are showing the language specific fields as read only
        extra_ro_fields = []
        for field_name in translation_fields:
            localized_field_names = [
                build_supported_localized_fieldname(field_name, lang[0])
                for lang in settings.LANGUAGES
            ]
            extra_ro_fields += localized_field_names

        extra_ro_fields.append("content_last_md5")

        return uniques_ordered_list(ro_fields + extra_ro_fields)

    @admin.action(description="Update translations")
    def update_translations(self, request, queryset):
        for obj in queryset:
            obj.update_and_maybe_translate()
        messages.success(request, "Translations update triggered")


class TranslatedModel(models.Model):
    """
    An abstract base class model that provides two fields used for
    keeping translations updated. Ideally this part would be handled by
    the django-modeltranslations package too, but it is not.
    The two fields it adds are used for:
    - the md5 field stores the hash of the content being translated at
      the time when it was last translated. It's being used to check
      which objects have changed the content so we update the translations
      too.
    - the original language of the content, as created by the users. It's
      needed to know when not to call the translation service
    """

    content_last_md5 = models.CharField(max_length=32, null=True, blank=True)
    content_original_lang = models.CharField(max_length=16, null=True, blank=True)
    is_automatically_translated = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def is_current_content_translated(self, current_language=None):
        if current_language is None:
            current_language = get_language()

        if (
            current_language == settings.ORIGINAL_LANGUAGE_CODE
            or self.content_original_lang is None
            or not self.is_automatically_translated
        ):
            return False

        model = self.__class__
        translation_fields = get_translation_fields_for_model(model)
        current_lang_translated_field_vals = [
            # all values for fields translated to current_labnguage
            getattr(
                self, build_supported_localized_fieldname(field_name, current_language)
            )
            for field_name in translation_fields
        ]

        current_lang_translated_field_vals = [
            v for v in current_lang_translated_field_vals if v
        ]

        return (
            current_language != self.content_original_lang
            and len(current_lang_translated_field_vals) > 0
        )

    def update_fields_with_original_content(self, initial_update_fields=None):
        # Depending on the initial_update_fields, it sets the fields corresponding
        # to the original content on this object to the value set taken from te field
        # without the language prefix, which is what the django-modeltranslations
        # sets.
        model = self.__class__
        translation_fields = get_translation_fields_for_model(model)
        default_language = settings.ORIGINAL_LANGUAGE_CODE

        if initial_update_fields is None:
            # if update_fields not set (e.g. admin forms, or new objects),
            # make sure the all translation fields with original content
            # are updated
            all_update_fields = translation_fields
        else:
            # existing object and only certain fields need to be updated,
            # then update their correspondent original content ones
            # (use sets intersection)
            all_update_fields = list(
                set(initial_update_fields) & set(translation_fields)
            )

        all_update_fields_localised = []
        for field_name in all_update_fields:
            # Using getattr(self, field_name) will return you the content not from field_name,
            # but from the field_name of the current language selected.
            # The proper way of getting "original" field value is through the __dict__
            val = self.__dict__[field_name]
            if val is not None:
                default_field_name = build_supported_localized_fieldname(
                    field_name, default_language
                )

                setattr(self, default_field_name, val)
                all_update_fields_localised.append(default_field_name)
        return all_update_fields, all_update_fields_localised

    def reset_localised_fields(self, translation_fields_to_update):
        default_language = settings.ORIGINAL_LANGUAGE_CODE
        ret_fields = ["content_last_md5"]
        self.content_last_md5 = None
        for field_name in translation_fields_to_update:
            for remaining_localised_field in [
                build_supported_localized_fieldname(field_name, lang[0])
                for lang in settings.LANGUAGES
                if lang[0] != default_language
            ]:
                setattr(self, remaining_localised_field, None)
                ret_fields.append(remaining_localised_field)
        return ret_fields

    def update_and_maybe_translate(self, should_translate_if_dirty=True):
        model = self.__class__
        # This function is called whenever the object is saved (either on creation or on edit).
        # The source of truth for the content is in the field name without the language suffix.
        # The function does the following:
        # 1. Copies the truth content from the field mentioned above to the field
        #    with the _original suffix (corresponding to the Untranslated option)
        # 2. Resets the value to None for all the other language specific fields, because:
        #    - if the content is not supposed to be translated None is fine (it will default to the _original field)
        #    - if the content is supposed to be translated, it will be translated and set by the translation task
        # 3. If the content is dirty and the content is supposed to be translated (not private, not bot)
        #    it triggers the translation service

        # 1. Update the _original fields
        all_update_fields, all_update_fields_localised = (
            self.update_fields_with_original_content()
        )

        # 2. Reset the other language specific fields
        reset_fields = self.reset_localised_fields(all_update_fields)

        update_fields = list(set(all_update_fields_localised + reset_fields))

        self.save(update_fields=update_fields)

        # 3. If the content is dirty and the content is supposed to be translated
        if should_translate_if_dirty and is_translation_dirty(self):
            app_label, model_name = model._meta.app_label, model._meta.model_name
            update_translations_task.send(app_label, model_name, self.pk)


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_on`` and ``modified_on`` fields.
    """

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    edited_at = models.DateTimeField(editable=False, null=True)

    class Meta:
        abstract = True

    def save(self, *args, update_fields: list[str] = None, **kwargs):
        # Ensure created_at and edited_at are equal upon creation
        self.edited_at = timezone.now() if self.edited_at else self.created_at

        # Ensure we include edited_at field
        # If `update_fields` specified
        if update_fields is not None:
            update_fields = list(update_fields) + ["edited_at"]

        return super().save(*args, update_fields=update_fields, **kwargs)


validate_alpha_slug = RegexValidator(
    r"^[-a-zA-Z0-9_]*[a-zA-Z][-a-zA-Z0-9_]*\Z",
    _(
        "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens. "
        "Must contain at least one letter."
    ),
    "invalid",
)


def build_order_by(value: str, is_desc: bool):
    """
    Builds order_by argument for django orm
    """

    q = F(value)

    return q.desc(nulls_last=True) if is_desc else q.asc(nulls_last=True)


class ArrayLength(models.Func):
    function = "CARDINALITY"


def model_update(
    *,
    instance: DjangoModelType,
    data: dict[str, any],
    fields: Iterable[str] = None,
) -> tuple[DjangoModelType, bool]:
    """
    Taken from https://github.com/HackSoftware/Django-Styleguide-Example
    Generic update service meant to be reused in local update services.
    """
    has_updated = False
    m2m_data = {}
    update_fields = []
    fields = fields or list(data.keys())

    model_fields = {field.name: field for field in instance._meta.get_fields()}

    for field in fields:
        # Skip if a field is not present in the actual data
        if field not in data:
            continue

        # If field is not an actual model field, raise an error
        model_field = model_fields.get(field)

        assert (
            model_field is not None
        ), f"{field} is not part of {instance.__class__.__name__} fields."

        # If we have m2m field, handle differently
        if isinstance(model_field, models.ManyToManyField):
            m2m_data[field] = data[field]
            continue

        if getattr(instance, field) != data[field]:
            has_updated = True
            update_fields.append(field)
            setattr(instance, field, data[field])

    # Perform an update only if any of the fields were actually changed
    if has_updated:
        instance.full_clean()
        # Update only the fields that are meant to be updated.
        instance.save(update_fields=update_fields)

    for field_name, value in m2m_data.items():
        related_manager = getattr(instance, field_name)
        related_manager.set(value)

        # Still not sure about this.
        # What if we only update m2m relations & nothing on the model? Is this still considered as updated?
        has_updated = True

    return instance, has_updated


class ModelBatchUpdater:
    """
    Performs a chunked bulk update of model instances.

    Ideal for memory-efficient updates where each object requires custom logic before saving—
    e.g. computing a derived field on large querysets. Works well with `.iterator()` to avoid
    loading everything into memory. Errors during processing are caught and logged.

     Example:
        ```python
        with ModelBatchUpdater(
            model_class=Post, fields=["movement"], batch_size=100
        ) as updater:
            for post in Post.objects.iterator(chunk_size=100):
                post.movement = compute_post_movement(post)
                updater.append(post)
        ```
    """

    def __init__(
        self,
        model_class: type[DjangoModelType],
        fields: list[str],
        batch_size: int = 100,
    ):
        self.model_class = model_class
        self.fields = fields
        self.batch_size = batch_size

        self._batch: list[DjangoModelType] = []

    def append(self, obj: DjangoModelType) -> None:
        self._batch.append(obj)

        if len(self._batch) >= self.batch_size:
            self.flush()

    def flush(self) -> None:
        if self._batch:
            self.model_class.objects.bulk_update(self._batch, fields=self.fields)
            self._batch.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.flush()


def get_by_pk_or_slug(
    queryset: QuerySet, slug_or_pk: str | int, slug_field: str = "slug"
):
    """
    Tries to retrieve an object by primary key if possible,
    otherwise by slug field
    """
    try:
        return get_object_or_404(queryset, pk=int(slug_or_pk))
    except (ValueError, TypeError):
        return get_object_or_404(queryset, **{slug_field: slug_or_pk})
