from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin
from django.http import HttpResponse
from django.utils.html import format_html
from django.urls import reverse

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
    list_display = [
        "title",
        "type",
        "forecasts",
        "open_time",
        "author",
        "curation_status",
        "post_link",
    ]
    readonly_fields = ["post_link"]
    search_fields = ["title_original", "description_original"]
    actions = ["export_selected_questions_data"]
    list_filter = [
        "type",
        "related_posts__post__curation_status",
        AutocompleteFilterFactory("Author", "related_posts__post__author"),
        AutocompleteFilterFactory(
            "Default Project", "related_posts__post__default_project"
        ),
        AutocompleteFilterFactory("Project", "related_posts__post__projects"),
    ]

    autocomplete_fields = ["group"]

    def forecasts(self, obj):
        return obj.user_forecasts.count()

    def author(self, obj):
        return obj.related_posts.first().post.author

    author.admin_order_field = "related_posts__post__author"

    def curation_status(self, obj):
        return obj.related_posts.first().post.curation_status

    curation_status.admin_order_field = "related_posts__post__curation_status"

    def post_link(self, obj):
        post = obj.related_posts.first().post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")

    def should_update_translations(self, obj):
        is_private = (
            obj.related_posts.first().post.default_project.default_permission is None
        )
        return not is_private

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if "post_link" in fields:
            fields.remove("post_link")
        fields.insert(0, "post_link")
        return fields

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

    def should_update_translations(self, obj):
        is_private = obj.post.default_project.default_permission is None
        return not is_private

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

    def should_update_translations(self, obj):
        is_private = obj.post.default_project.default_permission is None
        return not is_private


@admin.register(Forecast)
class ForecastsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "author", "question", "start_time", "end_time"]
    autocomplete_fields = ["author", "question"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions
