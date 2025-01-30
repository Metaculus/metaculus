from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse
from django.utils.html import format_html
from django.urls import reverse

from posts.models import Post, Notebook
from posts.services.common import trigger_update_post_translations
from questions.models import Question
from questions.services import build_question_forecasts
from utils.csv_utils import export_data_for_questions

from utils.models import CustomTranslationAdmin


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
        "curation_status",
        "resolved",
        AutocompleteFilterFactory("Author", "author"),
        "show_on_homepage",
        AutocompleteFilterFactory("Default Project", "default_project"),
        AutocompleteFilterFactory("Project", "projects"),
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
    search_fields = ["id", "title_original"]
    readonly_fields = ["notebook"]
    actions = [
        "export_selected_posts_data",
        "update_translations",
        "rebuild_aggregation_history",
    ]

    def other_project_count(self, obj):
        return obj.projects.count()

    def should_update_translations(self, obj):
        is_private = obj.default_project.default_permission is None
        return not is_private

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def export_selected_posts_data(self, request, queryset: QuerySet[Post]):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        questions = Question.objects.filter(related_posts__post__in=queryset).distinct()

        data = export_data_for_questions(questions, True, True, True)
        if data is None:
            self.message_user(request, "No questions selected.")
            return

        # return the zip file as a response
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="metaculus_data.zip"'

        return response

    def update_translations(self, request, posts_qs):
        for post in posts_qs:
            trigger_update_post_translations(post, with_comments=True, force=True)

    def rebuild_aggregation_history(self, request, queryset: QuerySet[Post]):
        for post in queryset:
            for question in post.get_questions():
                build_question_forecasts(question)


@admin.register(Notebook)
class NotebookAdmin(CustomTranslationAdmin):
    list_display = [
        "title",
        "type",
        "author",
        "curation_status",
        "published_at",
        "comments",
        "votes",
        "post_link",
    ]
    readonly_fields = ["post_link"]
    search_fields = ["post__title_original"]
    list_filter = [
        AutocompleteFilterFactory("Default Project", "post__default_project"),
        AutocompleteFilterFactory("Project", "post__projects"),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).distinct()

    def title(self, obj):
        return obj.post.title

    def author(self, obj):
        return obj.post.author

    author.admin_order_field = "post__author"

    def curation_status(self, obj):
        return obj.post.curation_status

    def published_at(self, obj):
        return obj.post.published_at

    published_at.admin_order_field = "post__published_at"

    def comments(self, obj):
        return obj.post.comments.count()

    def votes(self, obj):
        return obj.post.votes.count()

    votes.admin_order_field = "post__votes"

    def post_link(self, obj):
        post = obj.post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")
