from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet, Q
from django.http import HttpResponse

from projects.models import Project, ProjectUserPermission
from questions.models import Question
from utils.csv_utils import export_data_for_questions
from scoring.utils import update_project_leaderboard
from utils.models import CustomTranslationAdmin


class ProjectUserPermissionVisibilityFilter(admin.SimpleListFilter):
    title = "Project Visibility"  # Display title in the admin
    parameter_name = "project__default_permission"  # Query parameter

    def lookups(self, request, model_admin):
        return (
            ("private", "Private"),
            ("public", "Public"),
        )

    def queryset(self, request, queryset):
        if self.value() == "private":
            return queryset.filter(project__default_permission__isnull=True)
        if self.value() == "public":
            return queryset.filter(project__default_permission__isnull=False)
        return queryset


@admin.register(ProjectUserPermission)
class ProjectUserPermissionAdmin(admin.ModelAdmin):
    list_display = ["user", "permission", "project"]
    list_filter = [
        AutocompleteFilterFactory("Project", "project"),
        AutocompleteFilterFactory("User", "user"),
        "permission",
        ProjectUserPermissionVisibilityFilter,
    ]
    autocomplete_fields = ["user", "project"]


class ProjectUserPermissionInline(admin.TabularInline):
    model = ProjectUserPermission
    extra = 1
    autocomplete_fields = ("user",)

    def get_queryset(self, request):
        return super().get_queryset(request).none()


class ProjectDefaultPermissionFilter(admin.SimpleListFilter):
    title = "Visibility"  # Display title in the admin
    parameter_name = "default_permission"  # Query parameter

    def lookups(self, request, model_admin):
        return (
            ("private", "Private"),
            ("public", "Public"),
        )

    def queryset(self, request, queryset):
        if self.value() == "private":
            return queryset.filter(default_permission__isnull=True)
        if self.value() == "public":
            return queryset.filter(default_permission__isnull=False)
        return queryset


@admin.register(Project)
class ProjectAdmin(CustomTranslationAdmin):
    list_display = ["name", "type", "created_at", "default_permission"]
    list_filter = ["type", "show_on_homepage", ProjectDefaultPermissionFilter]
    search_fields = ["type", "name__original", "slug"]
    autocomplete_fields = ["created_by", "primary_leaderboard"]
    exclude = ["add_posts_to_main_feed"]
    ordering = ["-created_at"]
    inlines = [ProjectUserPermissionInline]
    actions = ["update_leaderboards", "export_questions_data_for_projects", "update_translations"]

    change_form_template = "admin/projects/project_change_form.html"

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        type_filters = request.GET.getlist("type__exact")
        if not type_filters and "/change" not in request.path:
            qs = qs.exclude(type=Project.ProjectTypes.PERSONAL_PROJECT)

        return qs

    def update_leaderboards(self, request, queryset):
        project: Project
        for project in queryset:
            leaderboards = project.leaderboards.all()
            for leaderboard in leaderboards:
                update_project_leaderboard(project, leaderboard)

    update_leaderboards.short_description = (
        "Update All Leaderboards on Selected Projects"
    )

    def export_questions_data_for_projects(self, request, queryset: QuerySet[Project]):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        questions = Question.objects.filter(
            Q(related_posts__post__default_project__in=queryset)
            | Q(related_posts__post__projects__in=queryset)
        ).distinct()

        data = export_data_for_questions(questions)
        if data is None:
            self.message_user(request, "No questions selected.")
            return

        # return the zip file as a response
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="metaculus_data.zip"'

        return response

    export_questions_data_for_projects.short_description = (
        "Download Question Data for Selected Projects"
    )
