from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from utils.models import CustomTranslationAdmin
from .models import Comment, KeyFactor, KeyFactorDriver


class KeyFactorInline(admin.TabularInline):
    model = KeyFactor
    extra = 0
    fields = ["get_content", "votes_score", "is_active"]
    readonly_fields = ["get_content", "votes_score"]
    can_delete = True

    def get_content(self, obj: KeyFactor):
        if obj.driver_id:
            return obj.driver.text

        return "-"

    get_content.short_description = "Content"


@admin.register(Comment)
class CommentAdmin(CustomTranslationAdmin):
    list_display = [
        "__str__",
        "author",
        "created_at",
        "is_soft_deleted",
        "is_private",
    ]
    list_filter = [
        AutocompleteFilterFactory("Author", "author"),
        AutocompleteFilterFactory("Post", "on_post"),
        "is_soft_deleted",
        "is_private",
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
    search_fields = ["id", "text"]
    inlines = [KeyFactorInline]

    def should_update_translations(self, obj):
        return not obj.on_post.is_private()


@admin.register(KeyFactorDriver)
class KeyFactorDriverAdmin(CustomTranslationAdmin):
    search_fields = ["id"]


@admin.register(KeyFactor)
class KeyFactorAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("Comment", "comment"),
        AutocompleteFilterFactory("Post", "comment__on_post"),
    ]

    autocomplete_fields = ["comment", "question", "driver"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("comment__on_post")
