from django.contrib import admin
from django.db.models import QuerySet
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin
from django.http import HttpResponse

from questions.models import (
    Conditional,
    Question,
    GroupOfQuestions,
    Forecast,
)
from utils.csv_utils import export_data_for_questions
from utils.models import CustomTranslationAdmin


@admin.register(Question)
class QuestionAdmin(CustomTranslationAdmin, DynamicArrayMixin):
    list_display = ["title", "id", "type"]
    search_fields = ["title_original", "description_original"]
    actions = ["export_selected_questions_data"]

    autocomplete_fields = ["group"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def export_selected_questions_data(self, request, queryset: QuerySet[Question]):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        data = export_data_for_questions(queryset)
        if data is None:
            self.message_user(request, "No questions selected.")
            return

        # return the zip file as a response
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="metaculus_data.zip"'

        return response


@admin.register(Conditional)
class ConditionalAdmin(admin.ModelAdmin):
    list_display = ["__str__"]
    search_fields = ["id"]
    autocomplete_fields = ["condition", "condition_child"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions


@admin.register(GroupOfQuestions)
class GroupOfQuestionsAdmin(CustomTranslationAdmin):
    search_fields = ["id"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions


@admin.register(Forecast)
class ForecastsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "author", "question", "start_time", "end_time"]
    autocomplete_fields = ["author", "question"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions
