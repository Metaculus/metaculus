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
from projects.models import Project, ProjectUserPermission, ProjectIndexQuestion
from questions.models import Question
from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard
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


class ProjectIndexQuestionsInline(admin.TabularInline):
    verbose_name = "Index: question weight"

    model = ProjectIndexQuestion
    extra = 1
    # TODO: try to pre-populate only questions related to the given Project
    autocomplete_fields = ("question",)


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

        if not project.close_date:
            return None

        return not any(
            q.scheduled_close_time > project.close_date
            for q in questions
        )

    closes_before.short_description = "Closes Before"
    closes_before.boolean = True

    def resolves_before(self, obj):
        project = self.get_project(obj)
        questions = self.get_post(obj).get_questions()

        if not project.close_date:
            return None

        return not any(
            q.scheduled_resolve_time > project.close_date
            for q in questions
        )

    resolves_before.short_description = "Resolves Before"
    resolves_before.boolean = True



class PostDefaultProjectInline(PostInlineBase):
    model = Post
    extra = 0
    fields = (
        "title_link",
        "curation_status",
        "published_at",
        "closes_before",
        "resolves_before",
    )
    readonly_fields = (
        "title_link",
        "published_at",
        "closes_before",
        "resolves_before",
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
        "resolves_before",
        "remove_from_project",
    )
    readonly_fields = (
        "title_link",
        "curation_status",
        "published_at",
        "default_project",
        "closes_before",
        "resolves_before",
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


@admin.register(Project)
class ProjectAdmin(CustomTranslationAdmin):
    form = ProjectAdminForm
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
    list_filter = [
        "type",
        "show_on_homepage",
        "visibility",
        ProjectDefaultPermissionFilter,
    ]
    search_fields = ["type", "name_original", "slug"]
    autocomplete_fields = ["created_by"]
    ordering = ["-created_at"]
    inlines = [
        ProjectIndexQuestionsInline,
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
    ]

    change_form_template = "admin/projects/project_change_form.html"

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def save_model(self, request, obj: Project, form, change):
        # Force visibility states for such project types
        if obj.type in (
            Project.ProjectTypes.CATEGORY,
            Project.ProjectTypes.TAG,
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
            Q(related_posts__post__default_project__in=queryset)
            | Q(related_posts__post__projects__in=queryset)
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
        response = HttpResponse(data, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="metaculus_data.zip"'

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
                Q(related_posts__post__default_project__in=queryset)
                | Q(related_posts__post__projects__in=queryset)
            )
            .distinct()
            .values_list("id", flat=True)
        )
        email_all_data_for_questions_task.send(
            email_address=request.user.email,
            question_ids=question_ids,
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
