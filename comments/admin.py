from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from utils.models import CustomTranslationAdmin
from .models import Comment, KeyFactor


class DriverInline(admin.TabularInline):
    model = KeyFactor
    extra = 0
    fields = ["text", "votes_score", "is_active"]
    readonly_fields = ["votes_score"]
    can_delete = True


@admin.register(Comment)
class CommentAdmin(CustomTranslationAdmin):
    list_display = [
        "__str__",
        "author",
        "on_post",
    ]
    list_filter = [
        AutocompleteFilterFactory("Post", "on_post"),
        AutocompleteFilterFactory("Project", "on_project"),
        AutocompleteFilterFactory("Author", "author"),
        "is_soft_deleted",
    ]
    autocomplete_fields = [
        "author",
        "on_post",
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
    search_fields = ["id", "text"]
    inlines = [DriverInline]

    def should_update_translations(self, obj):
        return not obj.on_post.is_private()


@admin.register(KeyFactor)
class DriverAdmin(CustomTranslationAdmin):
    list_filter = [
        AutocompleteFilterFactory("Comment", "comment"),
        AutocompleteFilterFactory("Post", "comment__on_post"),
    ]

    autocomplete_fields = [
        "comment",
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("comment__on_post")
