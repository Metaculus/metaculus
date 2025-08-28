from modeltranslation.translator import TranslationOptions, translator
from .models import Project


class ProjectTranslationOptions(TranslationOptions):
    fields = ("name", "description", "subtitle")


translator.register(Project, ProjectTranslationOptions)
