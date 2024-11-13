from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse

from posts.models import Post, Notebook
from questions.models import Question
from utils.csv_utils import export_data_for_questions


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "author",
        "curation_status",
        "published_at",
        "default_project",
    ]
    list_filter = [
        AutocompleteFilterFactory("Author", "author"),
        "show_on_homepage",
        AutocompleteFilterFactory("Project", "projects"),
        AutocompleteFilterFactory("Default Project", "default_project"),
    ]
    autocomplete_fields = [
        "author",
        "default_project",
        "curated_last_by",
        "question",
        "projects",
        "conditional",
        "group_of_questions",
        "coauthors",
    ]
    search_fields = ["title"]
    readonly_fields = ["notebook"]
    actions = ["export_selected_posts_data"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def export_selected_posts_data(self, request, queryset: QuerySet[Post]):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        questions = Question.objects.filter(related_posts__post__in=queryset).distinct()

        data = export_data_for_questions(questions)
        if data is None:
            self.message_user(request, "No questions selected.")
            return

        # return the zip file as a response
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="metaculus_data.zip"'

        return response


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ["__str__", "post"]
