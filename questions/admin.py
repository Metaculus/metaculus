from django.contrib import admin

from questions.models import Conditional, Question, GroupOfQuestions, Forecast


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    search_fields = ["title", "description"]

    autocomplete_fields = ["group"]


@admin.register(Conditional)
class ConditionalAdmin(admin.ModelAdmin):
    search_fields = ["id"]
    autocomplete_fields = [
        "condition",
        "condition_child",
        "question_yes",
        "question_no",
    ]


@admin.register(GroupOfQuestions)
class GroupOfQuestionsAdmin(admin.ModelAdmin):
    search_fields = ["id"]


@admin.register(Forecast)
class ForecastsAdmin(admin.ModelAdmin):
    autocomplete_fields = ["author", "question"]
