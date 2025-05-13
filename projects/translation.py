from modeltranslation.translator import TranslationOptions, translator
from .models import Project
from metaculus_web.settings import TRANSLATIONS_FALLBACK_UNDEFINED


class ProjectTranslationOptions(TranslationOptions):
    fields = ("name", "description", "subtitle")
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


translator.register(Project, ProjectTranslationOptions)
