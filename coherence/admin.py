from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html

from coherence.models import (
    AggregateCoherenceLink,
    AggregateCoherenceLinkVote,
    CoherenceLink,
    CoherenceLinkSuggestion,
)


@admin.register(CoherenceLink)
class CoherenceLinkAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "question1_link",
        "question2_link",
        "type",
        "direction",
        "strength",
        "created_at",
    ]
    search_fields = [
        "id",
        "question1__id",
        "question2__id",
        "question1__title_original",
        "question2__title_original",
        "question1__post__id",
        "question2__post__id",
        "question1__post__title_original",
        "question2__post__title_original",
        "question1__post__default_project__name",
        "question2__post__default_project__name",
        "question1__post__projects__name",
        "question2__post__projects__name",
        "question1__post__default_project__slug",
        "question2__post__default_project__slug",
        "question1__post__projects__slug",
        "question2__post__projects__slug",
    ]
    list_filter = [
        "type",
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Upstream Question (question1)", "question1"),
        AutocompleteFilterFactory("Downstream Question (question2)", "question2"),
        AutocompleteFilterFactory(
            "Upstream Question's Project", "question1__post__default_project"
        ),
        AutocompleteFilterFactory(
            "Downstream Question's Project", "question2__post__default_project"
        ),
    ]
    autocomplete_fields = ["user", "question1", "question2"]
    list_select_related = [
        "user",
        "question1",
        "question2",
        "question1__post",
        "question2__post",
    ]
    ordering = ["-created_at"]

    def question1_link(self, obj):
        if not obj.question1_id:
            return "-"
        url = reverse("admin:questions_question_change", args=[obj.question1_id])
        return format_html('<a href="{}">{}</a>', url, obj.question1)

    question1_link.short_description = "Question 1"

    def question2_link(self, obj):
        if not obj.question2_id:
            return "-"
        url = reverse("admin:questions_question_change", args=[obj.question2_id])
        return format_html('<a href="{}">{}</a>', url, obj.question2)

    question2_link.short_description = "Question 2"


@admin.register(AggregateCoherenceLink)
class AggregateCoherenceLinkAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "question1_link",
        "question2_link",
        "type",
        "votes_count",
        "created_at",
    ]
    search_fields = [
        "id",
        "question1__id",
        "question2__id",
        "question1__title_original",
        "question2__title_original",
        "question1__post__id",
        "question2__post__id",
        "question1__post__title_original",
        "question2__post__title_original",
        "question1__post__default_project__name",
        "question2__post__default_project__name",
        "question1__post__projects__name",
        "question2__post__projects__name",
        "question1__post__default_project__slug",
        "question2__post__default_project__slug",
        "question1__post__projects__slug",
        "question2__post__projects__slug",
    ]
    list_filter = [
        "type",
        AutocompleteFilterFactory("Upstream Question (question1)", "question1"),
        AutocompleteFilterFactory("Downstream Question (question2)", "question2"),
        AutocompleteFilterFactory(
            "Upstream Question's Project", "question1__post__default_project"
        ),
        AutocompleteFilterFactory(
            "Downstream Question's Project", "question2__post__default_project"
        ),
    ]
    autocomplete_fields = ["question1", "question2"]
    list_select_related = [
        "question1",
        "question2",
        "question1__post",
        "question2__post",
    ]
    ordering = ["-created_at"]

    def question1_link(self, obj):
        if not obj.question1_id:
            return "-"
        url = reverse("admin:questions_question_change", args=[obj.question1_id])
        return format_html('<a href="{}">{}</a>', url, obj.question1)

    question1_link.short_description = "Question 1"

    def question2_link(self, obj):
        if not obj.question2_id:
            return "-"
        url = reverse("admin:questions_question_change", args=[obj.question2_id])
        return format_html('<a href="{}">{}</a>', url, obj.question2)

    question2_link.short_description = "Question 2"

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(votes_total=Count("votes"))

    def votes_count(self, obj):
        return obj.votes_total

    votes_count.short_description = "Votes"


@admin.register(CoherenceLinkSuggestion)
class CoherenceLinkSuggestionAdmin(admin.ModelAdmin):
    """One row per eligible target. Read-only: rows are written by the
    daily batch (coherence.jobs) and go stale/refresh on their own."""

    list_display = [
        "id",
        "target_question_link",
        "paid_run_status",
        "n_candidates",
        "methods_succeeded_str",
        "paid_run_cost_usd",
        "paid_run_started_at",
        "free_refreshed_at",
    ]
    list_filter = ["paid_run_status"]
    search_fields = [
        "id",
        "target_question__id",
        "target_question__title_original",
        "target_question__post__id",
        "target_question__post__title_original",
    ]
    list_select_related = ["target_question", "target_question__post"]
    ordering = ["-paid_run_started_at", "-free_refreshed_at"]
    readonly_fields = [
        "target_question",
        "methods_by_candidate",
        "paid_run_status",
        "paid_run_started_at",
        "paid_run_cost_usd",
        "paid_run_methods_attempted",
        "paid_run_methods_succeeded",
        "paid_run_pool_hash",
        "paid_run_pool_size",
        "paid_run_elapsed_s",
        "paid_run_error_message",
        "free_refreshed_at",
        "created_at",
        "edited_at",
    ]

    def has_add_permission(self, request):
        return False

    def target_question_link(self, obj):
        url = reverse("admin:questions_question_change", args=[obj.target_question_id])
        return format_html('<a href="{}">{}</a>', url, obj.target_question)

    target_question_link.short_description = "Target"

    def n_candidates(self, obj):
        return len(obj.methods_by_candidate or {})

    n_candidates.short_description = "# candidates"

    def methods_succeeded_str(self, obj):
        return ", ".join(obj.paid_run_methods_succeeded or [])

    methods_succeeded_str.short_description = "Methods succeeded"


@admin.register(AggregateCoherenceLinkVote)
class AggregateCoherenceLinkVoteAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "aggregation", "score", "created_at"]
    search_fields = [
        "id",
        "user__id",
        "user__username",
        "aggregation__id",
        "aggregation__question1__title_original",
        "aggregation__question2__title_original",
    ]
    list_filter = [
        "score",
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Aggregation", "aggregation"),
    ]
    autocomplete_fields = ["user", "aggregation"]
    list_select_related = ["user", "aggregation"]
    ordering = ["-created_at"]
