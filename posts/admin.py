from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from posts.models import Post, Notebook


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "author",
        "curation_status",
        "published_at",
        "show_on_homepage",
    ]
    list_filter = [AutocompleteFilterFactory("Author", "author"), "show_on_homepage"]
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


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ["__str__", "post"]
