from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from posts.models import Post

from .models import (
    AdTile,
    Bulletin,
    SidebarItem,
    UserDataAccess,
    default_ad_tile_placements,
)


class AdTileAdminForm(forms.ModelForm):
    placements = forms.MultipleChoiceField(
        choices=AdTile.Placements.choices,
        widget=forms.CheckboxSelectMultiple,
        initial=default_ad_tile_placements,
        help_text="Surfaces this tile may appear on.",
    )

    class Meta:
        model = AdTile
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        title = cleaned_data.get("title")
        url = cleaned_data.get("url")
        project = cleaned_data.get("project")
        publish_at = cleaned_data.get("publish_at")
        expires_at = cleaned_data.get("expires_at")
        target_post = cleaned_data.get("target_post")
        target_project = cleaned_data.get("target_project")
        placements = cleaned_data.get("placements") or []

        if target_post and target_project:
            raise ValidationError("Set at most one of Target post or Target project.")
        if (target_post or target_project) and placements != [
            AdTile.Placements.QUESTION_SIDEBAR.value
        ]:
            raise ValidationError(
                "Targeted tiles can only use the question sidebar placement."
            )
        # Targeting is filtered client-side, so every visitor receives targeted tiles.
        if target_post and (
            target_post.is_private()
            or target_post.curation_status != Post.CurationStatus.APPROVED
        ):
            self.add_error(
                "target_post", "Only public, published questions can be targeted."
            )
        if target_project and target_project.default_permission is None:
            self.add_error("target_project", "Only public projects can be targeted.")
        if not title and not project:
            raise ValidationError(
                "Title is required unless a Project is selected (its name is used)."
            )
        if not url and not project:
            raise ValidationError(
                "URL is required unless a Project is selected (the frontend links to it)."
            )
        if publish_at and expires_at and expires_at <= publish_at:
            raise ValidationError("Expiration must be after the publish date.")
        return cleaned_data


@admin.register(AdTile)
class AdTileAdmin(admin.ModelAdmin):
    form = AdTileAdminForm
    list_display = [
        "display_title",
        "is_active",
        "placements",
        "order",
        "exposure_rate",
        "publish_at",
        "expires_at",
        "project",
        "target_post",
        "target_project",
    ]
    list_filter = ["is_active"]
    search_fields = ["title", "url"]
    ordering = ["order"]
    autocomplete_fields = ["project", "target_post", "target_project"]

    @admin.display(description="Title")
    def display_title(self, obj):
        return obj.display_title


@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display = ["__str__", "bulletin_start", "bulletin_end"]
    search_fields = ["bulletin_start", "bulletin_end", "text"]


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


@admin.register(UserDataAccess)
class UserDataAccessAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "project", "post")
    search_fields = ("user__username", "user__email", "project__name", "post__title")
    autocomplete_fields = ("user", "project", "post")
