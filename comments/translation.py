from modeltranslation.translator import TranslationOptions, translator
from .models import Comment


class CommentTranslationOptions(TranslationOptions):
    fields = ("text",)


translator.register(Comment, CommentTranslationOptions)
