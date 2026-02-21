from admin_auto_filters.filters import AutocompleteFilterFactory
from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.db.models import Count, F, Q, Window
from django.db.models.functions import RowNumber
from django.forms.models import BaseInlineFormSet
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join

from projects.models import Project
from scoring.constants import ExclusionStatuses
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


class MedalExclusionRecordInlineForm(forms.ModelForm):
    class Meta:
        model = MedalExclusionRecord
        exclude = ("leaderboard",)


class LeaderboardMedalExclusionRecordInlineFormSet(BaseInlineFormSet):
    """Allow editing exclusions scoped to this leaderboard or its project."""

    def __init__(
        self,
        data=None,
        files=None,
        instance=None,
        save_as_new=False,
        prefix=None,
        queryset=None,
        **kwargs,
    ):
        if instance is None:
            self.instance = self.fk.remote_field.model()
        else:
            self.instance = instance
        self.save_as_new = save_as_new
        if queryset is None:
            queryset = self.model._default_manager
        if self.instance.pk is not None:
            scope_filter = Q(leaderboard=self.instance)
            if self.instance.project_id:
                scope_filter |= Q(project_id=self.instance.project_id)
            entry_user_ids = LeaderboardEntry.objects.filter(
                leaderboard_id=self.instance.pk,
                user_id__isnull=False,
            ).values("user_id")
            scope_filter |= Q(
                leaderboard__isnull=True,
                project__isnull=True,
                user_id__in=entry_user_ids,
            )
            qs = queryset.filter(scope_filter)
        else:
            qs = queryset.none()
        self.unique_fields = {self.fk.name}
        super(BaseInlineFormSet, self).__init__(
            data,
            files,
            prefix=prefix,
            queryset=qs,
            **kwargs,
        )
        if self.form._meta.fields and self.fk.name not in self.form._meta.fields:
            if isinstance(self.form._meta.fields, tuple):
                self.form._meta.fields = list(self.form._meta.fields)
            self.form._meta.fields.append(self.fk.name)

    def _construct_form(self, i, **kwargs):
        form = super(BaseInlineFormSet, self)._construct_form(i, **kwargs)
        if self.save_as_new:
            mutable = getattr(form.data, "_mutable", None)
            if mutable is not None:
                form.data._mutable = True
            form.data[form.add_prefix(self._pk_field.name)] = None
            form.data[form.add_prefix(self.fk.name)] = None
            if mutable is not None:
                form.data._mutable = mutable

        # Keep original scope for existing project-level records.
        if i >= self.initial_form_count():
            fk_value = self.instance.pk
            if (
                self.fk.remote_field.field_name
                != self.fk.remote_field.model._meta.pk.name
            ):
                fk_value = getattr(self.instance, self.fk.remote_field.field_name)
                fk_value = getattr(fk_value, "pk", fk_value)
            setattr(form.instance, self.fk.attname, fk_value)
        return form


class MedalExclusionRecordInline(admin.TabularInline):
    model = MedalExclusionRecord
    form = MedalExclusionRecordInlineForm
    formset = LeaderboardMedalExclusionRecordInlineFormSet
    extra = 0
    can_delete = False
    autocomplete_fields = ("user", "project")
    fields = (
        "record_link",
        "user",
        "exclusion_type",
        "exclusion_status",
        "scope",
    )
    readonly_fields = ("scope", "record_link")

    def scope(self, obj):
        if not obj:
            return "-"
        if obj.leaderboard_id:
            return "Leaderboard"
        if obj.project_id:
            return "Project"
        return "Global"

    scope.short_description = "Scope"

    def record_link(self, obj):
        if not obj or not obj.pk:
            return "-"
        url = reverse("admin:scoring_medalexclusionrecord_change", args=[obj.pk])
        return format_html("<a href='{}'>{}</a>", url, obj.id or "Open")

    record_link.short_description = "ID"


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
    inlines = [MedalExclusionRecordInline]
    readonly_fields = [
        "entries_list_link",
        "leaderboard_action_buttons",
        "entries_preview",
    ]
    actions = [
        "make_primary_leaderboard",
        "update_leaderboards",
        "force_update_leaderboards",
        "force_finalize_and_assign_medals_leaderboards",
    ]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:leaderboard_id>/run-update/",
                self.admin_site.admin_view(self.run_update_view),
                name="scoring_leaderboard_run_update",
            ),
            path(
                "<int:leaderboard_id>/run-force-update/",
                self.admin_site.admin_view(self.run_force_update_view),
                name="scoring_leaderboard_run_force_update",
            ),
            path(
                "<int:leaderboard_id>/run-force-finalize/",
                self.admin_site.admin_view(self.run_force_finalize_view),
                name="scoring_leaderboard_run_force_finalize",
            ),
        ]
        return custom_urls + urls

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        for field_name in ["leaderboard_action_buttons", "entries_list_link"]:
            if field_name in fields:
                fields.remove(field_name)
            fields.insert(0, field_name)
        return fields

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(entries_count=Count("entries"))

    def entries_count(self, obj):
        return obj.entries_count

    entries_count.admin_order_field = "entries_count"
    entries_count.short_description = "Entries"

    def entries_list_link(self, obj):
        if not obj:
            return "Save the leaderboard to view entries."
        url = (
            reverse("admin:scoring_leaderboardentry_changelist")
            + "?"
            + f"leaderboard__id__exact={obj.id}"
        )
        return format_html(
            '<a class="button" href="{}">View Leaderboard Entries</a>', url
        )

    entries_list_link.short_description = "Entries"

    def leaderboard_action_buttons(self, obj):
        if not obj:
            return "Save the leaderboard to run actions."
        update_url = reverse("admin:scoring_leaderboard_run_update", args=[obj.id])
        force_update_url = reverse(
            "admin:scoring_leaderboard_run_force_update", args=[obj.id]
        )
        force_finalize_url = reverse(
            "admin:scoring_leaderboard_run_force_finalize", args=[obj.id]
        )
        return format_html(
            '<a class="button" href="{}">Update Leaderboard</a>&nbsp;'
            '<a class="button" href="{}">Force Update Leaderboard</a>&nbsp;'
            '<a class="button" href="{}">Force Update, Finalize, and Assign Medals/Prizes</a>',
            update_url,
            force_update_url,
            force_finalize_url,
        )

    leaderboard_action_buttons.short_description = "Actions"

    def _run_single_action(self, request, leaderboard_id, action_name):
        leaderboard = get_object_or_404(Leaderboard, pk=leaderboard_id)
        if not self.has_change_permission(request, leaderboard):
            raise PermissionDenied
        action = getattr(self, action_name)
        action(request, Leaderboard.objects.filter(pk=leaderboard_id))
        return HttpResponseRedirect(
            reverse("admin:scoring_leaderboard_change", args=[leaderboard_id])
        )

    def run_update_view(self, request, leaderboard_id):
        return self._run_single_action(request, leaderboard_id, "update_leaderboards")

    def run_force_update_view(self, request, leaderboard_id):
        return self._run_single_action(
            request, leaderboard_id, "force_update_leaderboards"
        )

    def run_force_finalize_view(self, request, leaderboard_id):
        return self._run_single_action(
            request, leaderboard_id, "force_finalize_and_assign_medals_leaderboards"
        )

    def entries_preview(self, obj):
        if not obj or not obj.pk:
            return "Save and continue editing to preview leaderboard entries."

        entries = (
            LeaderboardEntry.objects.filter(leaderboard=obj)
            .select_related("user")
            .annotate(
                row_number=Window(
                    expression=RowNumber(),
                    order_by=[F("rank").asc(nulls_last=True), F("id").asc()],
                )
            )
            .filter(row_number__lte=100)
            .order_by("rank", "id")
        )
        if not entries:
            return "No entries."

        rows = []
        for entry in entries:
            display_user = (
                entry.user.username if entry.user else entry.aggregation_method
            )
            change_url = reverse(
                "admin:scoring_leaderboardentry_change",
                args=[entry.pk],
            )
            try:
                if entry.exclusion_status == ExclusionStatuses.INCLUDE:
                    exclusion_status = ExclusionStatuses(
                        entry.exclusion_status
                    ).name.lower()
                else:
                    exclusion_status = ExclusionStatuses(entry.exclusion_status).name
            except ValueError:
                exclusion_status = str(entry.exclusion_status)
            rows.append(
                (
                    entry.rank if entry.rank is not None else "-",
                    display_user or "-",
                    entry.score,
                    entry.take if entry.take is not None else "-",
                    entry.medal or "-",
                    entry.percent_prize if entry.percent_prize is not None else "-",
                    entry.prize if entry.prize is not None else "-",
                    entry.coverage if entry.coverage is not None else "-",
                    entry.contribution_count,
                    exclusion_status,
                    change_url,
                )
            )

        header = (
            "<thead><tr>"
            "<th>Rank</th><th>User</th><th>Score</th><th>Take</th>"
            "<th>Medal</th><th>Percent Prize</th><th>Prize</th><th>Coverage</th>"
            "<th>Contribution Count</th><th>Exclusion Status</th><th>Entry</th>"
            "</tr></thead>"
        )
        body = format_html_join(
            "",
            (
                "<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td>"
                "<td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td>"
                "<td><a href='{}'>Open</a></td></tr>"
            ),
            rows,
        )
        return format_html(
            "<div><p>Top 100 entries (read-only on this page).</p>"
            "<table>{}<tbody>{}</tbody></table></div>",
            format_html(header),
            body,
        )

    entries_preview.short_description = "Leaderboard Entries"

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
        "exclusion_status",
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
