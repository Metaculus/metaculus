from admin_auto_filters.filters import AutocompleteFilterFactory
from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import Bulletin, SidebarItem, WhitelistUser


@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display = ["__str__", "bulletin_start", "bulletin_end"]
    search_fields = ["post", "project", "bulletin_start", "bulletin_end", "text"]
    list_filter = [
        AutocompleteFilterFactory("Post", "post"),
        AutocompleteFilterFactory("Project", "project"),
    ]
    autocomplete_fields = ["post", "project"]


class SidebarItemAdminForm(forms.ModelForm):
    class Meta:
        model = SidebarItem
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        url = cleaned_data.get("url")
        post = cleaned_data.get("post")
        project = cleaned_data.get("project")
        name = cleaned_data.get("name")

        # Ensure exactly one link target is set
        targets = [bool(url), bool(post), bool(project)]
        if sum(targets) != 1:
            raise ValidationError(
                "Please define exactly one of: URL, Post, or Project."
            )

        # If URL is used, name must be provided
        if url and not name:
            self.add_error("name", "Name is required when using a custom URL.")

        return cleaned_data


@admin.register(SidebarItem)
class SidebarItemAdmin(admin.ModelAdmin):
    form = SidebarItemAdminForm
    list_display = ("display_name", "section", "content_type")
    list_filter = ("section",)
    search_fields = ("name",)
    fieldsets = (
        (None, {"fields": ("name", "emoji", "section", "order")}),
        (
            "Link",
            {
                "fields": ("url", "post", "project"),
                "description": (
                    "Define exactly one link target. "
                    "If you choose a URL, a name is required."
                ),
            },
        ),
    )
    autocomplete_fields = [
        "post",
        "project",
    ]

    def content_type(self, obj: SidebarItem) -> str:
        if obj.url:
            return "URL"

        if obj.post_id:
            return "Post"

        if obj.project_id:
            return "Project"

        return ""


@admin.register(WhitelistUser)
class WhitelistUserAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "project", "post")
    search_fields = ("user__username", "user__email", "project__name", "post__title")
    autocomplete_fields = ("user", "project", "post")
