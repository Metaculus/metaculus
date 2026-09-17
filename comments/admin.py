from admin_auto_filters.filters import AutocompleteFilterFactory
from django.conf import settings
from django.contrib import admin
from django.contrib.postgres.search import SearchQuery
from django.utils.html import format_html

from comments.services.text_archive import get_full_text
from utils.models import CustomTranslationAdmin, uniques_ordered_list
from utils.translation import build_supported_localized_fieldname
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
        "is_text_archived",
    ]
    list_filter = [
        AutocompleteFilterFactory("Author", "author"),
        AutocompleteFilterFactory("Post", "on_post"),
        "is_soft_deleted",
        "is_private",
        "is_text_archived",
        AutocompleteFilterFactory("Project", "on_project"),
    ]
    autocomplete_fields = [
        "author",
        "on_post",
        "on_project",
    ]
    readonly_fields = ["included_forecast", "is_text_archived"]
    fields = [
        "author",
        "text",
        "on_post",
        "on_project",
        "is_soft_deleted",
        "included_forecast",
        "is_private",
        "is_text_archived",
    ]
    # `search_fields` must be non-empty for Django admin to render the search box
    # and dispatch to `get_search_results`, but its contents are unused because we
    # fully override the search below.
    search_fields = ["id"]
    inlines = [KeyFactorInline]

    def should_update_translations(self, obj):
        return not obj.on_post.is_private()

    @admin.display(description="Archived text (read-only, fetched from S3)")
    def archived_text(self, obj):
        """
        The full text of an archived comment, read back from the archive.

        The admin is where staff investigate a comment, and the row itself
        now holds nothing but a 200-character stub. Reading this costs an S3
        round trip per change-page load, which is why `get_fields` only adds
        it for rows that are actually archived.
        """

        text = get_full_text(obj)

        if text is None:
            return format_html(
                "<em>{}</em>",
                "The archived text could not be retrieved from S3. "
                "Only the stub above remains in the database.",
            )

        return format_html(
            '<pre style="white-space: pre-wrap; max-width: 60em; '
            'max-height: 30em; overflow: auto;">{}</pre>',
            text,
        )

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))

        if obj and obj.is_text_archived:
            fields.append("archived_text")

        return uniques_ordered_list(fields)

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))

        if obj and obj.is_text_archived:
            # Only a stub of the text is left in the db, so editing it here
            # would bypass the `update_comment` guard and leave the row out of
            # sync with the archived original. `archived_text` is not a model
            # field at all, so it has to be declared read-only to appear.
            readonly_fields += ["text", "archived_text"] + [
                build_supported_localized_fieldname("text", lang)
                for lang, _label in settings.LANGUAGES
            ]

        return uniques_ordered_list(readonly_fields)

    def get_search_results(self, request, queryset, search_term):
        search_term = search_term.strip()
        if not search_term:
            return queryset, False
        if search_term.isdigit():
            return queryset.filter(pk=int(search_term)), False

        # Uses the partial GIN index on `text_original_search_vector`
        # (comment_text_search_vector_idx), which is conditional on
        # is_private=False AND is_soft_deleted=False — so those predicates
        # are required for the planner to pick the index.
        query = SearchQuery(search_term, search_type="websearch")
        return (
            queryset.filter(
                is_private=False,
                is_soft_deleted=False,
                text_original_search_vector=query,
            ),
            False,
        )


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
