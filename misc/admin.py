from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import (
    AdTile,
    Bulletin,
    SidebarItem,
    UserApiAccess,
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
    ]
    list_filter = ["is_active"]
    search_fields = ["title", "url"]
    ordering = ["order"]
    autocomplete_fields = ["project"]

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
    list_display = (
        "user",
        "created_at",
        "project",
        "post",
        "view_user_data",
        "view_deanonymized_data",
    )
    list_filter = ("view_user_data", "view_deanonymized_data")
    list_select_related = ("user", "project", "post")
    search_fields = ("user__username", "user__email", "project__name", "post__title")
    autocomplete_fields = ("user", "project", "post")
    fieldsets = (
        (
            None,
            {
                "description": (
                    "<p>Whitelists a user to read <strong>user-level</strong> data they "
                    "could not otherwise see - that is, who forecast what, rather than "
                    "the aggregate. Entries are purely additive: an entry only widens "
                    "what its user can read, and a user with no entry gets the default "
                    "aggregated, anonymized data.</p>"
                    "<p>This does <strong>not</strong> set a user's API access level. "
                    "That lives in <em>User api accesses</em>, and the two are "
                    "independent: a level there decides which fields and endpoints are "
                    "exposed, while an entry here decides whether the rows behind them "
                    "name real forecasters.</p>"
                ),
                "fields": (
                    "user",
                    "project",
                    "post",
                    "view_user_data",
                    "view_deanonymized_data",
                    "notes",
                ),
            },
        ),
    )


@admin.register(UserApiAccess)
class UserApiAccessAdmin(admin.ModelAdmin):
    list_display = ("user", "access_level", "scope", "created_at")
    list_filter = ("access_level",)
    list_select_related = ("user", "project")
    search_fields = ("user__username", "user__email", "project__name")
    autocomplete_fields = ("user", "project")
    fieldsets = (
        (
            None,
            {
                "description": (
                    "<p>Raises the API access level granted to a user by the "
                    "<strong>external API gateway</strong> that Metaculus runs in front "
                    "of this backend. Nothing in this application reads these entries "
                    "to make an access decision - they are serialized to the gateway, "
                    "and the gateway decides what a request may read. A deployment "
                    "without such a gateway can ignore this model entirely; adding "
                    "entries there changes nothing.</p>"
                    "<p><strong>How a level is resolved</strong></p>"
                    "<ul>"
                    "<li>A user with <em>no entry</em> is <code>restricted</code>, the "
                    "default. There is deliberately no stored <code>restricted</code> "
                    "level, because a grant conferring it would mean nothing - to "
                    "restrict a user, delete their entry.</li>"
                    "<li>An entry with <em>no project</em> is global: it applies to "
                    "every request that user makes.</li>"
                    "<li>An entry <em>with</em> a project applies only to data "
                    "belonging to that project.</li>"
                    "<li>The most permissive applicable level wins, so a project entry "
                    "can only ever widen a global one. A user who is globally "
                    "<code>benchmarking</code> and <code>unrestricted</code> on one "
                    "project is <code>unrestricted</code> there and "
                    "<code>benchmarking</code> everywhere else.</li>"
                    "<li>Staff are treated as <code>unrestricted</code> by the gateway "
                    "regardless of what is recorded here.</li>"
                    "</ul>"
                    "<p><strong>What the levels mean</strong> is defined by the "
                    "gateway, not here. Today <code>benchmarking</code> additionally "
                    "exposes community predictions and question text for the project it "
                    "is scoped to, plus that project's data exports, while "
                    "<code>unrestricted</code> lifts the gateway's restrictions "
                    "altogether. Read access to user-level data is a separate axis, "
                    "granted under <em>User data accesses</em>; a level here never "
                    "reveals another forecaster's identity.</p>"
                ),
                "fields": ("user", "project", "access_level", "notes"),
            },
        ),
    )

    @admin.display(description="Scope", ordering="project")
    def scope(self, obj: UserApiAccess) -> str:
        return obj.project.name if obj.project_id else "Global"
