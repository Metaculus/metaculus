from modeltranslation.translator import TranslationOptions, translator
from .models import Post, Notebook


class PostTranslationOptions(TranslationOptions):
    fields = ("title", "short_title")


class NotebookTranslationOptions(TranslationOptions):
    fields = ("markdown",)


translator.register(Post, PostTranslationOptions)
translator.register(Notebook, NotebookTranslationOptions)
