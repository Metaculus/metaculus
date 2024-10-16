from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "author",
        "on_post",
        "on_project",
    ]
    list_filter = [
        AutocompleteFilterFactory("Post", "on_post"),
        AutocompleteFilterFactory("Project", "on_project"),
    ]
    autocomplete_fields = [
        "author",
        "on_post",
        "on_project",
    ]
    readonly_fields = ["included_forecast"]
    fields = [
        "author",
        "text",
        "on_post",
        "on_project",
        "is_soft_deleted",
        "included_forecast",
        "is_private",
    ]
