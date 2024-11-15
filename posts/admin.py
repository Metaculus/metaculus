from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse

from posts.models import Post, Notebook
from questions.models import Question
from utils.csv_utils import export_data_for_questions

from utils.models import CustomTranslationAdmin

from utils.translation import (
    update_translations_for_model,
    queryset_filter_outdated_translations,
    detect_and_update_content_language,
)
from comments.services.feed import get_comments_feed
from comments.models import Comment


@admin.register(Post)
class PostAdmin(CustomTranslationAdmin):
    list_display = [
        "title",
        "author",
        "curation_status",
        "published_at",
        "default_project",
        "other_project_count",
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
    search_fields = ["title_original"]
    readonly_fields = ["notebook"]
    actions = ["export_selected_posts_data", "update_translations"]

    def other_project_count(self, obj):
        return obj.projects.count()

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

    def update_translations(self, request, comments_qs):
        # TODO: properly extract this in a service method and do it in a scalable way
        for post in comments_qs:
            post.trigger_translation_if_dirty()
            if post.question is not None:
                post.question.trigger_translation_if_dirty()
            if post.notebook is not None:
                post.notebook.trigger_translation_if_dirty()
            if post.group_of_questions is not None:
                post.group_of_questions.trigger_translation_if_dirty()
            if post.conditional is not None:
                post.conditional.condition.trigger_translation_if_dirty()
                if hasattr(post.conditional.condition, "post"):
                    post.conditional.condition.post.trigger_translation_if_dirty()

                post.conditional.condition_child.trigger_translation_if_dirty()
                if hasattr(post.conditional.condition_child, "post"):
                    post.conditional.condition_child.post.trigger_translation_if_dirty()

                post.conditional.question_yes.trigger_translation_if_dirty()
                post.conditional.question_no.trigger_translation_if_dirty()

            batch_size = 10
            comments_qs = get_comments_feed(qs=Comment.objects.filter(), post=post)

            comments_qs = queryset_filter_outdated_translations(comments_qs)
            detect_and_update_content_language(comments_qs, batch_size)
            update_translations_for_model(comments_qs, batch_size)


@admin.register(Notebook)
class NotebookAdmin(CustomTranslationAdmin):
    list_display = ["__str__", "post"]
