from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin, messages
from django.db.models import Count, F, Window
from django.db.models.functions import RowNumber

from projects.models import Project
from scoring.models import (
    Leaderboard,
    LeaderboardEntry,
    Score,
    MedalExclusionRecord,
    ArchivedScore,
    LeaderboardsRanksEntry,
)
from scoring.utils import update_project_leaderboard


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "user",
        "aggregation_method",
        "score_type",
        "score",
        "coverage",
        "question",
    ]
    search_fields = ["user__username", "user__id", "question__title"]
    autocomplete_fields = ["user", "question"]
    list_filter = [
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Question", "question"),
        "score_type",
    ]


@admin.register(ArchivedScore)
class ArchivedScoreAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "user",
        "aggregation_method",
        "score_type",
        "score",
        "coverage",
        "question",
    ]
    search_fields = ["user__username", "user__id", "question__title"]
    autocomplete_fields = ["user", "question"]
    list_filter = [
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Question", "question"),
        "score_type",
    ]


class LeaderboardEntryInline(admin.TabularInline):
    model = LeaderboardEntry
    extra = 1
    autocomplete_fields = ("user",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        leaderboard_id = request.resolver_match.kwargs.get("object_id")
        if leaderboard_id is None:
            return qs.none()
        return (
            qs.filter(leaderboard_id=leaderboard_id)
            .annotate(
                row_number=Window(
                    expression=RowNumber(),
                    order_by=[F("rank").asc(nulls_last=True), F("id").asc()],
                )
            )
            .filter(row_number__lte=50)  # Limit to top 50 entries
        ).order_by("rank", "id")


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    change_list_template = "admin/scoring/leaderboard_action_descriptions.html"
    search_fields = [
        "name",
        "score_type",
        "project__slug",
        "project__name_original",
    ]
    list_display = [
        "__str__",
        "project",
        "score_type",
        "finalized",
        "entries_count",
    ]
    autocomplete_fields = ["project", "user_list"]
    list_filter = [
        AutocompleteFilterFactory("Project", "project"),
        "score_type",
        "finalized",
    ]
    inlines = [LeaderboardEntryInline]
    actions = [
        "make_primary_leaderboard",
        "update_leaderboards",
        "force_update_leaderboards",
        "force_finalize_and_assign_medals_leaderboards",
    ]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(entries_count=Count("entries"))

    def entries_count(self, obj):
        return obj.entries_count

    entries_count.admin_order_field = "entries_count"
    entries_count.short_description = "Entries"

    def make_primary_leaderboard(self, request, queryset):
        for leaderboard in queryset:
            project: Project = leaderboard.project
            project.primary_leaderboard = leaderboard
            project.save()
            self.message_user(
                request,
                f"Successfully set {leaderboard} as the "
                f"primary leaderboard for {project}.",
                messages.SUCCESS,
            )

    make_primary_leaderboard.short_description = "Make Primary Leaderboard"

    def update_leaderboards(self, request, queryset):
        leaderboard: Leaderboard
        for leaderboard in queryset:
            update_project_leaderboard(
                leaderboard.project,
                leaderboard,
            )

    update_leaderboards.short_description = "Update Leaderboards"

    def force_update_leaderboards(self, request, queryset):
        leaderboard: Leaderboard
        for leaderboard in queryset:
            update_project_leaderboard(
                leaderboard.project,
                leaderboard,
                force_update=True,
            )

    force_update_leaderboards.short_description = "Force Update Leaderboards"

    def force_finalize_and_assign_medals_leaderboards(self, request, queryset):
        leaderboard: Leaderboard
        for leaderboard in queryset:
            update_project_leaderboard(
                leaderboard.project,
                leaderboard,
                force_update=True,
                force_finalize=True,
            )

    force_finalize_and_assign_medals_leaderboards.short_description = (
        "Force Update, Finalize, and Assign Medals/Prizes"
    )


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    search_fields = [
        "user__username",
        "leaderboard__name",
        "leaderboard__score_type",
        "leaderboard__project__slug",
        "leaderboard__project__name_original",
    ]
    list_display = ["__str__", "user", "rank", "score", "take", "exclusion_status"]
    autocomplete_fields = ["leaderboard", "user"]
    list_filter = [
        AutocompleteFilterFactory("Leaderboard", "leaderboard"),
        AutocompleteFilterFactory("User", "user"),
    ]


@admin.register(MedalExclusionRecord)
class MedalExclusionRecordAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "user",
        "start_time",
        "end_time",
        "exclusion_type",
        "project",
        "leaderboard",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "project__name",
        "leaderboard__name",
    ]
    autocomplete_fields = ["user", "project", "leaderboard"]
    list_filter = [
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Project", "project"),
        AutocompleteFilterFactory("Leaderboard", "leaderboard"),
    ]


@admin.register(LeaderboardsRanksEntry)
class LeaderboardsRanksEntryAdmin(admin.ModelAdmin):
    list_display = ["user", "rank", "rank_type"]
    search_fields = ["user__username"]
    autocomplete_fields = ["user"]
