from admin_auto_filters.filters import AutocompleteFilterFactory
from django import forms
from django.contrib import admin
from django.db.models import QuerySet, Q
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import path
from django.urls import reverse
from django.utils.html import format_html
from django_select2.forms import ModelSelect2MultipleWidget

from posts.models import Post
from projects.models import Project, ProjectUserPermission
from projects.services.common import update_with_add_posts_to_main_feed
from questions.models import Question
from scoring.utils import update_project_leaderboard
from utils.csv_utils import export_data_for_questions
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


class ProjectUserPermissionInline(admin.TabularInline):
    model = ProjectUserPermission
    extra = 0
    autocomplete_fields = ("user",)

    def get_queryset(self, request):
        project_id = request.resolver_match.kwargs.get("object_id")
        if ProjectUserPermission.objects.filter(project_id=project_id).count() > 100:
            return ProjectUserPermission.objects.none()
        return ProjectUserPermission.objects.filter(project_id=project_id)


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


class PostDefaultProjectInline(admin.TabularInline):
    model = Post
    extra = 0
    fields = (
        "title_link",
        "curation_status",
        "published_at",
    )
    readonly_fields = (
        "title_link",
        "published_at",
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
        if Post.objects.filter(default_project_id=project_id).count() > 100:
            return Post.objects.none()
        return Post.objects.filter(default_project_id=project_id)

    def has_add_permission(self, request, obj=None):
        return False


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


class PostProjectInline(admin.TabularInline):
    model = Post.projects.through
    form = PostProjectInlineForm
    extra = 0
    fields = (
        "title_link",
        "curation_status",
        "published_at",
        "default_project",
        "remove_from_project",
    )
    readonly_fields = (
        "title_link",
        "curation_status",
        "published_at",
        "default_project",
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
        if Post.projects.through.objects.filter(project=project_id).count() > 100:
            return Post.projects.through.objects.none()
        return Post.projects.through.objects.filter(project=project_id)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Project)
class ProjectAdmin(CustomTranslationAdmin):
    list_display = [
        "name",
        "type",
        "created_at",
        "default_permission",
        "add_posts_to_main_feed",
        "order",
        "view_default_posts_link",
        "view_posts_link",
    ]
    list_filter = [
        "type",
        "show_on_homepage",
        ProjectDefaultPermissionFilter,
    ]
    search_fields = ["type", "name_original", "slug"]
    autocomplete_fields = ["created_by", "primary_leaderboard"]
    ordering = ["-created_at"]
    inlines = [
        ProjectUserPermissionInline,
        PostDefaultProjectInline,
        PostProjectInline,
    ]
    actions = [
        "update_leaderboards",
        "export_questions_data_for_projects",
        "update_translations",
        "toggle_add_posts_to_main_feed",
    ]

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

    def toggle_add_posts_to_main_feed(self, request, queryset: QuerySet[Project]):
        for project in queryset:
            update_with_add_posts_to_main_feed(
                project, not project.add_posts_to_main_feed
            )

    toggle_add_posts_to_main_feed.short_description = "Toggle Add Posts to Main Feed"

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

    def save_formset(self, request, form, formset, change):
        formset.save(commit=False)

        for form_obj in formset.forms:
            instance = form_obj.instance
            if form_obj.cleaned_data.get("remove_from_project"):
                # Remove the instance from the project
                if isinstance(instance, Post.projects.through):
                    instance.delete()
            else:
                instance.save()
        formset.save_m2m()

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
