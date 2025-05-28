from modeltranslation.translator import TranslationOptions, translator
from .models import Question, GroupOfQuestions
from metaculus_web.settings import TRANSLATIONS_FALLBACK_UNDEFINED


class QuestionTranslationOptions(TranslationOptions):
    fields = ("description", "resolution_criteria", "fine_print", "label", "title")
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


class GroupOfQuestionsTranslationOptions(TranslationOptions):
    fields = ("description", "resolution_criteria", "fine_print")
    fallback_undefined = TRANSLATIONS_FALLBACK_UNDEFINED


translator.register(Question, QuestionTranslationOptions)
translator.register(GroupOfQuestions, GroupOfQuestionsTranslationOptions)
