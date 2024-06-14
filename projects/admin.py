from django.contrib import admin

from projects.models import Project, ProjectUserPermission


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    search_fields = ["type", "name"]
    autocomplete_fields = ["created_by"]


@admin.register(ProjectUserPermission)
class ProjectUserPermissionAdmin(admin.ModelAdmin):
    autocomplete_fields = ["user"]
