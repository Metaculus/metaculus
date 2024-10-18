from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin, messages


from projects.models import Project

from scoring.models import (
    UserWeight,
    Leaderboard,
    LeaderboardEntry,
    Score,
    MedalExclusionRecord,
    ArchivedScore,
)
from scoring.utils import update_project_leaderboard, update_leaderboard_from_csv_data


@admin.register(UserWeight)
class UserWeightAdmin(admin.ModelAdmin):
    search_fields = ["user"]


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "user",
        "aggregation_method",
        "score_type",
        "question",
        "score",
        "coverage",
    ]
    search_fields = ["user", "for_question"]
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
        "question",
        "score",
        "coverage",
    ]
    search_fields = ["user", "for_question"]
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
        return super().get_queryset(request)


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    search_fields = ["name", "project", "score_type"]
    list_display = ["__str__", "project", "score_type"]
    autocomplete_fields = ["project"]
    list_filter = [
        AutocompleteFilterFactory("Project", "project"),
    ]
    inlines = [LeaderboardEntryInline]
    actions = ["make_primary_leaderboard", "update_leaderboards"]

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

    make_primary_leaderboard.short_description = (
        "Make selected leaderboards their project's primary_leaderboard"
    )

    def update_leaderboards(self, request, queryset):
        leaderboard: Leaderboard
        for leaderboard in queryset:
            update_project_leaderboard(leaderboard.project, leaderboard)

    update_leaderboards.short_description = "Update selected Leaderboards"


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    search_fields = ["user", "leaderboard", "leaderboard.project"]
    list_display = ["__str__", "leaderboard", "user", "rank", "take", "excluded"]
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
    ]
    search_fields = ["user"]
    autocomplete_fields = ["user", "project"]
    list_filter = [
        AutocompleteFilterFactory("User", "user"),
        AutocompleteFilterFactory("Project", "project"),
    ]
