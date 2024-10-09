from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from projects.models import Project, ProjectUserPermission


@admin.register(ProjectUserPermission)
class ProjectUserPermissionAdmin(admin.ModelAdmin):
    list_display = ["user", "permission", "project"]
    list_filter = [
        AutocompleteFilterFactory("Project", "project"),
        AutocompleteFilterFactory("User", "user"),
        "permission",
    ]
    autocomplete_fields = ["user", "project"]


class ProjectUserPermissionInline(admin.TabularInline):
    model = ProjectUserPermission
    extra = 1
    autocomplete_fields = ("user",)

    def get_queryset(self, request):
        return super().get_queryset(request).none()


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_filter = ["type", "show_on_homepage"]
    search_fields = ["type", "name", "slug"]
    autocomplete_fields = ["created_by"]
    exclude = ["add_posts_to_main_feed"]
    list_display = ["name", "created_at"]
    ordering = ["-created_at"]
    inlines = [ProjectUserPermissionInline]

    change_form_template = "admin/projects/project_change_form.html"

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        type_filters = request.GET.getlist("type__exact")
        if not type_filters:
            qs = qs.exclude(type=Project.ProjectTypes.PERSONAL_PROJECT)

        return qs
