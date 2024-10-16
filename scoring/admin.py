from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from scoring.models import (
    UserWeight,
    Leaderboard,
    LeaderboardEntry,
    Score,
    MedalExclusionRecord,
    ArchivedScore,
)


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


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    search_fields = ["name", "project", "score_type"]
    list_display = ["__str__", "project", "score_type"]
    autocomplete_fields = ["project"]
    list_filter = [
        AutocompleteFilterFactory("Project", "project"),
    ]


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
