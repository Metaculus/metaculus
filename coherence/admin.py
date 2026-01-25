from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html

from coherence.models import (
    AggregateCoherenceLink,
    AggregateCoherenceLinkVote,
    CoherenceLink,
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
