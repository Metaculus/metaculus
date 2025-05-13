from modeltranslation.translator import TranslationOptions, translator

from metaculus_web.settings import TRANSLATIONS_FALLBACK_UNDEFINED

from .models import Comment, KeyFactor


class CommentTranslationOptions(TranslationOptions):
    fields = ("text",)
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


class KeyFactorTranslationOptions(TranslationOptions):
    fields = ("text",)
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


translator.register(Comment, CommentTranslationOptions)
translator.register(KeyFactor, KeyFactorTranslationOptions)
