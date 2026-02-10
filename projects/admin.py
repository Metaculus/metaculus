import random

from admin_auto_filters.filters import AutocompleteFilterFactory
from django import forms
from django.contrib import admin
from django.db.models import QuerySet, Q
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join
from django_select2.forms import ModelSelect2MultipleWidget

from posts.models import Post
from projects.models import (
    Project,
    ProjectUserPermission,
    ProjectIndex,
    ProjectIndexPost,
)
from projects.permissions import ObjectPermission
from questions.models import Question
from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard
from users.models import User
from utils.csv_utils import export_all_data_for_questions
from utils.models import CustomTranslationAdmin
from utils.tasks import email_all_data_for_questions_task


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


class LeaderboardInline(admin.TabularInline):
    model = Leaderboard
    extra = 0
    fields = (
        "leaderboard_link",
        "score_type",
        "start_time",
        "end_time",
        "finalize_time",
        "finalized",
        "prize_pool",
        "is_primary",
    )
    readonly_fields = (
        "leaderboard_link",
        "is_primary",
    )
    can_delete = False
    verbose_name = "Leaderboard"
    verbose_name_plural = "Leaderboards"
    show_change_link = True

    def leaderboard_link(self, obj):
        if not obj.pk:
            return "-"
        url = reverse("admin:scoring_leaderboard_change", args=[obj.pk])
        label = obj.name or f"Leaderboard #{obj.pk} ({obj.score_type})"
        return format_html('<a href="{}">{}</a>', url, label)

    leaderboard_link.short_description = "Leaderboard"

    def is_primary(self, obj):
        if not obj.pk:
            return False
        return obj.primary_project.exists()

    is_primary.short_description = "Is Primary"
    is_primary.boolean = True

    def get_queryset(self, request):
        project_id = request.resolver_match.kwargs.get("object_id")
        qs = super().get_queryset(request)
        if project_id is None:
            return qs.none()
        return qs.filter(project_id=project_id)

    def has_add_permission(self, request, obj=None):
        return False


class ProjectUserPermissionInline(admin.TabularInline):
    model = ProjectUserPermission
    extra = 1
    autocomplete_fields = ("user",)

    def get_queryset(self, request):
        project_id = request.resolver_match.kwargs.get("object_id")
        qs = super().get_queryset(request)
        if project_id and qs.filter(project_id=project_id).count() > 100:
            return qs.none()
        return qs.filter(project_id=project_id)


class PostSelect2MultipleWidget(ModelSelect2MultipleWidget):
    model = Post
    search_fields = ["title__icontains"]  # Remove 'id__exact'

    def filter_queryset(self, request, term, queryset=None, **kwargs):
        if queryset is None:
            queryset = self.get_queryset()
        qs = queryset.none()
        if term:
            qs = queryset.filter(title_original__icontains=term)
        if term.isdigit():
            qs = qs | queryset.filter(id=int(term))
        return qs


class AddPostsToProjectForm(forms.Form):
    posts = forms.ModelMultipleChoiceField(
        queryset=Post.objects.all(),
        label="Select Posts to Add (id or title)",
        widget=PostSelect2MultipleWidget(),
        required=True,
    )


class PostInlineBase(admin.TabularInline):
    def get_project(self, obj) -> Project:
        raise NotImplementedError

    def get_post(self, obj) -> Post:
        return obj

    def closes_before(self, obj):
        project = self.get_project(obj)
        questions = self.get_post(obj).get_questions()

        finalize_time = (
            project.primary_leaderboard.finalize_time
            if project.primary_leaderboard
            else None
        )
        finalize_time = finalize_time or project.close_date
        if not finalize_time:
            return True

        return not any(
            q.scheduled_close_time > finalize_time
            for q in questions
            if q.scheduled_close_time
        )

    closes_before.short_description = format_html(
        "Closes Before<br>Leaderboard Finalizes"
    )
    closes_before.boolean = True

    def resolved_before(self, obj):
        project = self.get_project(obj)
        questions = self.get_post(obj).get_questions()

        finalize_time = (
            project.primary_leaderboard.finalize_time
            if project.primary_leaderboard
            else None
        )
        finalize_time = finalize_time or project.close_date
        if not finalize_time:
            return True

        return not any(
            (q.actual_resolve_time and q.actual_resolve_time > finalize_time)
            for q in questions
        )

    resolved_before.short_description = format_html(
        "Resolved Before<br>Leaderboard Finalizes<br>(or hasn't resolved yet)"
    )
    resolved_before.boolean = True


class PostDefaultProjectInline(PostInlineBase):
    model = Post
    extra = 0
    fields = (
        "title_link",
        "curation_status",
        "published_at",
        "closes_before",
        "resolved_before",
    )
    readonly_fields = (
        "title_link",
        "published_at",
        "closes_before",
        "resolved_before",
    )
    can_delete = False
    verbose_name = "Post with this as Default Project (determines permissions)"
    verbose_name_plural = "Posts with this as Default Project (determines permissions)"

    def title_link(self, obj):
        url = reverse("admin:posts_post_change", args=[obj.pk])
        return format_html('<a href="{}">{}</a>', url, obj.title)

    title_link.short_description = "Title"

    def get_queryset(self, request):
        project_id = request.resolver_match.kwargs.get("object_id")
        qs = super().get_queryset(request)
        if project_id and qs.filter(default_project_id=project_id).count() > 100:
            return qs.none()
        return qs.filter(default_project_id=project_id)

    def has_add_permission(self, request, obj=None):
        return False

    def get_project(self, obj) -> Project:
        return obj.default_project


class PostProjectInlineForm(forms.ModelForm):
    # this is a hack to rename the "delete" checkbox to "remove from project"
    remove_from_project = forms.BooleanField(
        required=False,
        label="Remove from Project",
        widget=forms.CheckboxInput(),
    )

    class Meta:
        model = Post.projects.through
        fields = ["remove_from_project"]

    def save(self, commit=True):
        # Handle deletion based on the `custom_delete` field
        if self.cleaned_data.get("remove_from_project"):
            if self.instance.pk:
                self.instance.delete()
            return

        return super().save(commit=commit)


class PostProjectInline(PostInlineBase):
    model = Post.projects.through
    form = PostProjectInlineForm
    extra = 0
    fields = (
        "title_link",
        "curation_status",
        "published_at",
        "default_project",
        "closes_before",
        "resolved_before",
        "remove_from_project",
    )
    readonly_fields = (
        "title_link",
        "curation_status",
        "published_at",
        "default_project",
        "closes_before",
        "resolved_before",
    )
    can_delete = False  # this is a hack to rename the "delete" checkbox
    verbose_name = "Post with this as a Secondary Project (no permission effects)"
    verbose_name_plural = (
        "Posts with this as a Secondary Project (no permission effects)"
    )

    def title_link(self, obj):
        url = reverse("admin:posts_post_change", args=[obj.post.pk])
        return format_html('<a href="{}">{}</a>', url, obj.post.title)

    title_link.short_description = "Title"

    def curation_status(self, obj):
        return obj.post.curation_status

    def published_at(self, obj):
        return obj.post.published_at

    def default_project(self, obj):
        return obj.default_project

    def get_queryset(self, request):
        project_id = request.resolver_match.kwargs.get("object_id")
        qs = super().get_queryset(request)
        if project_id and qs.filter(project=project_id).count() > 100:
            return qs.none()
        return qs.filter(project=project_id)

    def has_add_permission(self, request, obj=None):
        return False

    def get_project(self, obj) -> Project:
        return obj.project

    def get_post(self, obj) -> Post:
        return obj.post


class ProjectAdminForm(forms.ModelForm):
    visibility = forms.ChoiceField(
        choices=Project.Visibility.choices,
        required=True,
        initial=Project.Visibility.UNLISTED,
    )

    class Meta:
        model = Project
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["primary_leaderboard"].queryset = Leaderboard.objects.filter(
                project=self.instance
            )

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        forecasting_end_date = cleaned_data.get("forecasting_end_date")
        close_date = cleaned_data.get("close_date")

        if forecasting_end_date and close_date and forecasting_end_date > close_date:
            self.add_error(
                "forecasting_end_date",
                "Forecasting end date must be before the close date.",
            )

        if start_date and forecasting_end_date and start_date > forecasting_end_date:
            self.add_error(
                "start_date",
                "Start date must be before the forecasting end date.",
            )

        return cleaned_data


@admin.register(Project)
class ProjectAdmin(CustomTranslationAdmin):
    form = ProjectAdminForm
    exclude = ("index",)
    list_display = [
        "name",
        "type",
        "created_at",
        "default_permission",
        "visibility",
        "order",
        "view_default_posts_link",
        "view_posts_link",
    ]
    readonly_fields = [
        "posts_summary",
        "questions_summary",
        "latest_resolving_time",
        "primary_leaderboard_finalize_time",
        "index_configuration",
    ]
    list_filter = [
        "type",
        "show_on_homepage",
        "visibility",
        ProjectDefaultPermissionFilter,
    ]
    search_fields = ["type", "name_original", "slug"]
    autocomplete_fields = ["created_by", "primary_leaderboard"]
    ordering = ["-created_at"]
    inlines = [
        LeaderboardInline,
        ProjectUserPermissionInline,
        PostDefaultProjectInline,
        PostProjectInline,
    ]
    actions = [
        "update_leaderboards",
        "export_questions_data_for_projects",
        "export_questions_data_for_projects_anonymized",
        "email_me_questions_data_for_projects",
        "email_me_questions_data_for_projects_anonymized",
        "update_translations",
        "generate_50_users_password_simple",
        "generate_50_users_password_complex",
    ]

    change_form_template = "admin/projects/project_change_form.html"

    def index_configuration(self, obj: Project):
        if not obj or obj.type != Project.ProjectTypes.INDEX or not obj.index_id:
            return ""
        url = reverse("admin:projects_projectindex_change", args=[obj.index_id])
        return format_html('<a class="button" href="{}">Configure Index</a>', url)

    index_configuration.short_description = "Index"

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def save_model(self, request, obj: Project, form, change):
        # Force visibility states for such project types
        if obj.type in (
            Project.ProjectTypes.CATEGORY,
            Project.ProjectTypes.LEADERBOARD_TAG,
            Project.ProjectTypes.TOPIC,
            Project.ProjectTypes.PERSONAL_PROJECT,
        ):
            obj.visibility = Project.Visibility.NOT_IN_MAIN_FEED

        return super().save_model(request, obj, form, change)

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

    def export_questions_data_for_projects(
        self, request, queryset: QuerySet[Project], **kwargs
    ):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        questions = Question.objects.filter(
            Q(post__default_project__in=queryset) | Q(post__projects__in=queryset)
        ).distinct()

        data = export_all_data_for_questions(
            questions,
            include_comments=True,
            include_scores=True,
            **kwargs,
        )
        if data is None:
            self.message_user(request, "No questions selected.")
            return

        # return the zip file as a response
        if queryset.count() == 1:
            project = queryset.first()
            if project.slug:
                filename = f"{project.slug}_metaculus_data"
            else:
                name = project.name
                name = name.replace("\n", "").replace("\r", "")
                for char in [" ", "-", "/", ":", ",", "."]:
                    name = name.replace(char, "_")
                filename = f"{name}_metaculus_data"
        else:
            filename = "project_metaculus_data"
        if kwargs.get("anonymized", False):
            filename += "_anonymized"
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = f"attachment; filename={filename}.zip"

        return response

    export_questions_data_for_projects.short_description = (
        "Download Question Data for Selected Projects"
    )

    def export_questions_data_for_projects_anonymized(
        self, request, queryset: QuerySet[Project]
    ):
        return self.export_questions_data_for_projects(
            request, queryset, anonymized=True
        )

    export_questions_data_for_projects_anonymized.short_description = (
        "Download Question Data for Selected Projects Anonymized"
    )

    def email_me_questions_data_for_projects(
        self, request, queryset: QuerySet[Project], **kwargs
    ):
        question_ids = list(
            Question.objects.filter(
                Q(post__default_project__in=queryset) | Q(post__projects__in=queryset)
            )
            .distinct()
            .values_list("id", flat=True)
        )
        if queryset.count() == 1:
            project = queryset.first()
            if project.slug:
                filename = f"{project.slug}_metaculus_data"
            else:
                name = project.name
                name = name.replace("\n", "").replace("\r", "")
                for char in [" ", "-", "/", ":", ",", "."]:
                    name = name.replace(char, "_")
                filename = f"{name}_metaculus_data"
        else:
            filename = "project_metaculus_data"
        if kwargs.get("anonymized", False):
            filename += "_anonymized"
        email_all_data_for_questions_task.send(
            email_address=request.user.email,
            question_ids=question_ids,
            filename=filename + ".zip",
            include_comments=True,
            include_scores=True,
            **kwargs,
        )

        self.message_user(request, "Email will be sent when data is processed.")
        return

    email_me_questions_data_for_projects.short_description = (
        "Email Me Question Data for Selected Projects"
    )

    def email_me_questions_data_for_projects_anonymized(
        self, request, queryset: QuerySet[Project]
    ):
        return self.email_me_questions_data_for_projects(
            request, queryset, anonymized=True
        )

    email_me_questions_data_for_projects_anonymized.short_description = (
        "Email Me Question Data for Selected Projects Anonymized"
    )

    def generate_50_users_password_simple(self, request, queryset: QuerySet[Project]):
        adjectives = (
            "Brave_Calm_Clever_Curious_Daring_Eager_Fancy_Gentle_Happy_Jolly_Kind_Lively"
            "_Lucky_Mighty_Nimble_Patient_Proud_Quick_Quiet_Rapid_Shiny_Silly_Smart_Swift_"
            "Witty_Zany_Bright_Bold_Charming_Cheerful_Cool_Dashing_Fearless_Glorious_"
            "Graceful_Helpful_Inventive_Joyful_Loyal_Playful_Powerful_Radiant_Resourceful_"
            "Sincere_Spirited_Steady_Sturdy_Thoughtful_Valiant_Vivid".split("_")
        )
        nouns = (
            "Ant_Badger_Bear_Beetle_Bison_Cat_Cougar_Crane_Crow_Deer_Dog_Dolphin_Dragon_"
            "Eagle_Falcon_Ferret_Fox_Frog_Giraffe_Goat_Goose_Hawk_Heron_Horse_Hound_Jaguar"
            "_Jay_Koala_Leopard_Lion_Lynx_Moose_Otter_Owl_Panther_Panda_Penguin_Puma_"
            "Rabbit_Raven_Salmon_Seal_Shark_Sparrow_Swan_Tiger_Toad_Turtle_Viper_Wolf_Wren"
            "_Yak_Zebra".split("_")
        )
        data = ""
        for _ in range(50):
            username = (
                f"{random.choice(adjectives)}"
                f"{random.choice(nouns)}"
                f"{random.randint(1000, 9999)}"
            )

            user = User.objects.create(
                username=username,
                is_active=True,
                newsletter_optin=False,
                check_for_spam=False,
                is_onboarding_complete=True,
            )
            user.set_password(username)
            user.save()
            data += f"{user.username}\n"
            for project in queryset:
                ProjectUserPermission.objects.create(
                    user=user,
                    project=project,
                    permission=ObjectPermission.FORECASTER,
                )

        # return csv file as a response
        filename = "new_users-password_same_as_username.csv"

        response = HttpResponse(data, content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename={filename}"

        return response

    generate_50_users_password_simple.short_description = (
        "Generate 50 users with username == password & download their data as a CSV"
    )

    def generate_50_users_password_complex(self, request, queryset: QuerySet[Project]):
        adjectives = (
            "Brave_Calm_Clever_Curious_Daring_Eager_Fancy_Gentle_Happy_Jolly_Kind_Lively"
            "_Lucky_Mighty_Nimble_Patient_Proud_Quick_Quiet_Rapid_Shiny_Silly_Smart_Swift_"
            "Witty_Zany_Bright_Bold_Charming_Cheerful_Cool_Dashing_Fearless_Glorious_"
            "Graceful_Helpful_Inventive_Joyful_Loyal_Playful_Powerful_Radiant_Resourceful_"
            "Sincere_Spirited_Steady_Sturdy_Thoughtful_Valiant_Vivid".split("_")
        )
        nouns = (
            "Ant_Badger_Bear_Beetle_Bison_Cat_Cougar_Crane_Crow_Deer_Dog_Dolphin_Dragon_"
            "Eagle_Falcon_Ferret_Fox_Frog_Giraffe_Goat_Goose_Hawk_Heron_Horse_Hound_Jaguar"
            "_Jay_Koala_Leopard_Lion_Lynx_Moose_Otter_Owl_Panther_Panda_Penguin_Puma_"
            "Rabbit_Raven_Salmon_Seal_Shark_Sparrow_Swan_Tiger_Toad_Turtle_Viper_Wolf_Wren"
            "_Yak_Zebra".split("_")
        )
        data = ""
        for _ in range(50):
            username = (
                f"{random.choice(adjectives)}"
                f"{random.choice(nouns)}"
                f"{random.randint(1000, 9999)}"
            )
            password = (
                f"{random.choice(adjectives)}"
                f"{random.choice(nouns)}"
                f"{random.randint(1000, 9999)}"
            )

            user = User.objects.create(
                username=username,
                is_active=True,
                newsletter_optin=False,
                check_for_spam=False,
                is_onboarding_complete=True,
            )
            user.set_password(password)
            user.save()
            data += f"{user.username},{password}\n"
            for project in queryset:
                ProjectUserPermission.objects.create(
                    user=user,
                    project=project,
                    permission=ObjectPermission.FORECASTER,
                )

        # return csv file as a response
        filename = "new_users-columns-are-username-password.csv"

        response = HttpResponse(data, content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename={filename}"

        return response

    generate_50_users_password_complex.short_description = (
        "Generate 50 users with random passwords and download their data as a CSV"
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:project_id>/add-default-posts/",
                self.admin_site.admin_view(self.add_default_posts_view),
                name="add-default-posts-to-project",
            ),
            path(
                "<int:project_id>/add-posts/",
                self.admin_site.admin_view(self.add_posts_view),
                name="add-posts-to-project",
            ),
        ]
        return custom_urls + urls

    def add_default_posts_view(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        if request.method == "POST":
            form = AddPostsToProjectForm(request.POST)
            if form.is_valid():
                posts = form.cleaned_data["posts"]
                for post in posts:
                    post.default_project = project
                    post.save()
                self.message_user(
                    request,
                    f"Added {posts.count()} posts to project '{project.name}' as default project.",
                )
                return redirect("admin:projects_project_change", project_id)
        else:
            form = AddPostsToProjectForm()

        context = {
            **self.admin_site.each_context(request),
            "form": form,
            "project": project,
            "opts": self.model._meta,
            "title": f"Add Default Posts to {project.name} (will overwrite current default_project)",
        }
        return render(request, "admin/projects/add_posts_to_project.html", context)

    def add_posts_view(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        if request.method == "POST":
            form = AddPostsToProjectForm(request.POST)
            if form.is_valid():
                posts = form.cleaned_data["posts"]
                for post in posts:
                    post.projects.add(project)
                self.message_user(
                    request,
                    f"Added {posts.count()} posts to project '{project.name}' as default project.",
                )
                return redirect("admin:projects_project_change", project_id)
        else:
            form = AddPostsToProjectForm()

        context = {
            **self.admin_site.each_context(request),
            "form": form,
            "project": project,
            "opts": self.model._meta,
            "title": f"Add Posts to {project.name}",
        }
        return render(request, "admin/projects/add_posts_to_project.html", context)

    def view_default_posts_link(self, obj):
        count = Post.objects.filter(default_project=obj).distinct().count()
        url = (
            reverse("admin:posts_post_changelist")
            + "?"
            + f"default_project__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} Posts</a>', url, count)

    view_default_posts_link.short_description = "Default Posts"

    def view_posts_link(self, obj):
        count = Post.objects.filter(projects=obj).distinct().count()
        url = (
            reverse("admin:posts_post_changelist")
            + "?"
            + f"projects__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} Posts</a>', url, count)

    view_posts_link.short_description = "Posts"

    def posts_summary(self, obj):
        if obj.type == Project.ProjectTypes.SITE_MAIN:
            return None
        all_posts = Post.objects.filter(
            Q(default_project=obj) | Q(projects=obj)
        ).distinct("id")
        all_ids = list(all_posts.values_list("id", flat=True))
        all_count = len(all_ids)

        default_posts = Post.objects.filter(default_project=obj)
        default_posts_ids = list(default_posts.values_list("id", flat=True))
        default_posts_count = len(default_posts_ids)

        posts = Post.objects.filter(projects=obj).distinct("id")
        posts_ids = list(posts.values_list("id", flat=True))
        posts_count = len(posts_ids)

        def make_link(ids, label):
            query_string = f"id__in={','.join(map(str, ids)) or '0'}"
            url = reverse("admin:posts_post_changelist") + "?" + query_string
            return format_html('<a href="{}">{}</a>', url, label)

        default_posts_count = Post.objects.filter(default_project=obj).count()
        posts_count = Post.objects.filter(projects=obj).count()
        return format_html_join(
            format_html("<br>"),
            "{}",
            [
                (make_link(all_ids, f"{all_count} Posts in Project"),),
                (
                    make_link(
                        default_posts_ids,
                        f"{default_posts_count} Default Posts (Determines Permissions)",
                    ),
                ),
                (
                    make_link(
                        posts_ids,
                        f"{posts_count} Secondary Posts",
                    ),
                ),
            ],
        )

    posts_summary.short_description = "Post Summary"

    def questions_summary(self, obj):
        if obj.type == Project.ProjectTypes.SITE_MAIN:
            return None
        leaderboard = obj.primary_leaderboard
        if not leaderboard:
            return None

        all_questions = leaderboard.get_questions().filter(question_weight__gt=0)
        all_ids = list(all_questions.values_list("id", flat=True))
        all_count = len(all_ids)

        finalize_time = leaderboard.finalize_time or obj.close_date
        if finalize_time:
            in_leaderboard_qs = all_questions.filter(
                Q(resolution_set_time__isnull=True)
                | Q(resolution_set_time__lte=finalize_time),
                scheduled_close_time__lte=finalize_time,
            )
        else:
            in_leaderboard_qs = all_questions

        in_leaderboard_ids = list(in_leaderboard_qs.values_list("id", flat=True))
        in_leaderboard_count = len(in_leaderboard_ids)

        not_in_leaderboard_ids = list(set(all_ids) - set(in_leaderboard_ids))
        not_in_leaderboard_count = len(not_in_leaderboard_ids)

        def make_link(ids, label):
            query_string = f"id__in={','.join(map(str, ids)) or '0'}"
            url = reverse("admin:questions_question_changelist") + "?" + query_string
            return format_html('<a href="{}">{}</a>', url, label)

        return format_html_join(
            format_html("<br>"),
            "{}",
            [
                (make_link(all_ids, f"{all_count} Questions in Project"),),
                (
                    make_link(
                        in_leaderboard_ids,
                        f"{in_leaderboard_count} Questions in Primary Leaderboard",
                    ),
                ),
                (
                    make_link(
                        not_in_leaderboard_ids,
                        f"{not_in_leaderboard_count} Questions NOT in Primary Leaderboard",
                    ),
                ),
            ],
        )

    questions_summary.short_description = format_html(
        "Question Summary<br>(Only Questions with Weight > 0)"
    )

    def latest_resolving_time(self, obj):
        if obj.type == Project.ProjectTypes.SITE_MAIN:
            return None
        questions = Question.objects.filter(
            Q(post__projects=obj) | Q(post__default_project=obj),
        ).distinct()
        latest_resolving_time = None
        for question in questions:
            if question.actual_resolve_time:
                latest_resolving_time = (
                    max(latest_resolving_time, question.actual_resolve_time)
                    if latest_resolving_time
                    else question.actual_resolve_time
                )
            elif question.scheduled_resolve_time:
                latest_resolving_time = (
                    max(latest_resolving_time, question.scheduled_resolve_time)
                    if latest_resolving_time
                    else question.scheduled_resolve_time
                )
            else:
                continue
        return latest_resolving_time

    latest_resolving_time.short_description = "Latest Resolving Time (Expected)"

    def primary_leaderboard_finalize_time(self, obj):
        if obj.type == Project.ProjectTypes.SITE_MAIN:
            return None
        leaderboard = obj.primary_leaderboard
        if leaderboard:
            return leaderboard.finalize_time or (obj.close_date if obj else None)

    primary_leaderboard_finalize_time.short_description = (
        "Time when Primary Leaderboard is Finalized"
    )

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in [
            "primary_leaderboard_finalize_time",
            "latest_resolving_time",
            "questions_summary",
            "posts_summary",
            "index_configuration",
        ]:
            if field in fields:
                fields.remove(field)

            if field == "index_configuration" and (
                not obj or obj.type != Project.ProjectTypes.INDEX
            ):
                continue

            fields.insert(0, field)
        return fields


class ProjectIndexPostInline(admin.TabularInline):
    model = ProjectIndexPost
    extra = 0
    autocomplete_fields = ["post"]
    fields = ("post", "weight", "order")

    class Form(forms.ModelForm):
        class Meta:
            model = ProjectIndexPost
            fields = "__all__"

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            if getattr(self.instance, "pk", None):
                self.fields["post"].disabled = True

    form = Form


@admin.register(ProjectIndex)
class ProjectIndexAdmin(admin.ModelAdmin):
    list_display = ["id", "type", "increasing_is_good"]
    fields = ("type", "min", "min_label", "max", "max_label", "increasing_is_good")
    inlines = [ProjectIndexPostInline]

    def get_model_perms(self, request):
        # Hide from the admin homepage
        return {}
