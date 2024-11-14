from modeltranslation.translator import TranslationOptions, translator
from .models import Question, GroupOfQuestions


class QuestionTranslationOptions(TranslationOptions):
    fields = ("description", "resolution_criteria", "fine_print", "label", "title")


class GroupOfQuestionsTranslationOptions(TranslationOptions):
    fields = ("description", "resolution_criteria", "fine_print")


translator.register(Question, QuestionTranslationOptions)
translator.register(GroupOfQuestions, GroupOfQuestionsTranslationOptions)
