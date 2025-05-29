from modeltranslation.translator import TranslationOptions, translator
from .models import Post, Notebook
from metaculus_web.settings import TRANSLATIONS_FALLBACK_UNDEFINED


class PostTranslationOptions(TranslationOptions):
    fields = ("title", "short_title")
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


class NotebookTranslationOptions(TranslationOptions):
    fields = ("markdown",)
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


translator.register(Post, PostTranslationOptions)
translator.register(Notebook, NotebookTranslationOptions)
