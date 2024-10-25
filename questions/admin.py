from django.contrib import admin
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin

from questions.models import Conditional, Question, GroupOfQuestions, Forecast


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin, DynamicArrayMixin):
    search_fields = ["title", "description"]

    autocomplete_fields = ["group"]


@admin.register(Conditional)
class ConditionalAdmin(admin.ModelAdmin):
    list_display = ["__str__"]
    search_fields = ["id"]
    autocomplete_fields = ["condition", "condition_child"]


@admin.register(GroupOfQuestions)
class GroupOfQuestionsAdmin(admin.ModelAdmin):
    search_fields = ["id"]


@admin.register(Forecast)
class ForecastsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "author", "question", "start_time", "end_time"]
    autocomplete_fields = ["author", "question"]
