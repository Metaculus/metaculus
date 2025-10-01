from modeltranslation.translator import TranslationOptions, translator

from .models import Comment, Driver


class CommentTranslationOptions(TranslationOptions):
    fields = ("text",)


class DriverTranslationOptions(TranslationOptions):
    fields = ("text",)


translator.register(Comment, CommentTranslationOptions)
translator.register(Driver, DriverTranslationOptions)
