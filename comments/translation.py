from modeltranslation.translator import TranslationOptions, translator

from .models import Comment, KeyFactor


class CommentTranslationOptions(TranslationOptions):
    fields = ("text",)


class KeyFactorTranslationOptions(TranslationOptions):
    fields = ("text",)


translator.register(Comment, CommentTranslationOptions)
translator.register(KeyFactor, KeyFactorTranslationOptions)
