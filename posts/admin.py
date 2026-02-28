from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin, messages
from django.db.models import QuerySet
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import reverse, path
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from posts.models import Post, Notebook
from posts.services.common import soft_delete_post, trigger_update_post_translations
from posts.services.hotness import explain_post_hotness
from posts.tasks import run_post_generate_history_snapshot
from projects.models import Project
from projects.services.subscriptions import notify_post_added_to_project
from questions.models import Question
from questions.services.forecasts import build_question_forecasts
from utils.csv_utils import export_all_data_for_questions
from utils.models import CustomTranslationAdmin


@admin.register(Post)
class PostAdmin(CustomTranslationAdmin):
    list_display = [
        "title",
        "author",
        "curation_status",
        "published_at",
        "default_project",
        "other_project_count",
    ]
    list_filter = [
        "curation_status",
        "resolved",
        AutocompleteFilterFactory("Author", "author"),
        "show_on_homepage",
        AutocompleteFilterFactory("Default Project", "default_project"),
        AutocompleteFilterFactory("Project", "projects"),
    ]
    autocomplete_fields = [
        "author",
        "default_project",
        "curated_last_by",
        "question",
        "projects",
        "conditional",
        "group_of_questions",
        "coauthors",
    ]
    search_fields = ["id", "title_original"]
    readonly_fields = [
        "notebook",
        "hotness_explanation",
        "view_questions",
        "update_pseudo_materialized_fields_button",
    ]
    actions = [
        "export_selected_posts_data",
        "export_selected_posts_data_anonymized",
        "update_translations",
        "rebuild_aggregation_history",
        "mark_as_deleted",
    ]

    def hotness_explanation(self, obj):
        explanation = explain_post_hotness(obj)

        def render_components(items):
            html = ["<ul style='margin-left: 0;'>"]
            for comp in items or []:
                score = comp.get("score", None)
                html.append("<li style='list-style: disc;'>")

                if isinstance(score, (int, float)):
                    html.append(
                        f"<strong>{comp.get('label', '')}</strong>: {score:.2f}"
                    )
                else:
                    html.append(f"<strong>{comp.get('label', '')}</strong>")

                # NEW: prefer 'children' (new schema), fallback to 'components' (old)
                children = comp.get("children") or comp.get("components")
                if children:
                    html.append(render_components(children))

                html.append("</li>")
            html.append("</ul>")
            return "".join(html)

        components_html = render_components(explanation.get("components", []))

        full_html = f"""
            <p><strong>Total Hotness:</strong> {explanation.get('hotness', 0):.2f}</p>
            <p><strong>Components:</strong></p>
            {components_html}
        """
        return mark_safe(full_html)

    hotness_explanation.short_description = "Hotness Explanation"

    def view_questions(self, obj):
        url = reverse("admin:questions_question_changelist") + f"?post={obj.id}"
        return format_html('<a href="{}">View Questions</a>', url)

    def update_pseudo_materialized_fields_button(self, obj):
        if not obj:
            return ""
        url = reverse(
            "admin:posts_post_update_pseudo_materialized_fields", args=[obj.pk]
        )
        return format_html(
            '<a class="button" href="{}">{}</a>',
            url,
            (
                "Update Cached Fields (e.g. open time, scheduled close time, "
                "forecasters_count, etc.)"
            ),
        )

    update_pseudo_materialized_fields_button.short_description = "Update Cached Fields"

    def other_project_count(self, obj):
        return obj.projects.count()

    def should_update_translations(self, obj):
        is_private = obj.default_project.default_permission is None
        is_approved = obj.curation_status == Post.CurationStatus.APPROVED

        return not is_private and is_approved

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def has_delete_permission(self, request, obj=None):
        # Hide the delete button on the object edit page
        if obj is not None:
            return False
        return super().has_delete_permission(request, obj)

    def export_selected_posts_data(self, request, queryset: QuerySet[Post], **kwargs):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        questions = Question.objects.filter(post__in=queryset)

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

    def export_selected_posts_data_anonymized(self, request, queryset: QuerySet[Post]):
        return self.export_selected_posts_data(request, queryset, anonymized=True)

    def update_translations(self, request, posts_qs):
        for post in posts_qs:
            trigger_update_post_translations(post, with_comments=True, force=True)

    def rebuild_aggregation_history(self, request, queryset: QuerySet[Post]):
        for post in queryset:
            for question in post.get_questions():
                build_question_forecasts(question)

    def mark_as_deleted(self, request, queryset: QuerySet[Post]):
        updated = 0
        for post in queryset:
            soft_delete_post(post)
            updated += 1
        self.message_user(request, f"Marked {updated} post(s) as DELETED.")

    mark_as_deleted.short_description = "Mark as DELETED"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:post_id>/update-pseudo-materialized-fields/",
                self.admin_site.admin_view(
                    self.process_update_pseudo_materialized_fields_request
                ),
                name="posts_post_update_pseudo_materialized_fields",
            ),
        ]
        return custom_urls + urls

    def process_update_pseudo_materialized_fields_request(
        self, request, post_id, *args, **kwargs
    ):
        post = self.get_object(request, post_id)
        if not post:
            messages.error(request, "Post not found.")
            return redirect("admin:posts_post_changelist")
        post.update_pseudo_materialized_fields()
        post.update_cached_fields()
        messages.success(request, "Updated Cached Fields")
        return redirect(reverse("admin:posts_post_change", args=[post.pk]))

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["view_questions", "update_pseudo_materialized_fields_button"]:
            if field in fields:
                fields.remove(field)
        fields = ["view_questions", "update_pseudo_materialized_fields_button"] + fields
        return fields

    def save_model(self, request, obj: Post, form, change):
        old_default_project_id = None
        if change and "default_project" in form.changed_data:
            old_default_project_id = form.initial.get("default_project")

        super().save_model(request, obj, form, change)

        if (
            old_default_project_id is not None
            and obj.default_project_id != old_default_project_id
        ):
            notify_post_added_to_project(obj, obj.default_project)

        run_post_generate_history_snapshot.send(obj.id, request.user.id)

    def save_related(self, request, form, formsets, change):
        old_project_ids = set()
        if change:
            old_project_ids = set(form.instance.projects.values_list("id", flat=True))

        super().save_related(request, form, formsets, change)

        if change:
            new_project_ids = set(form.instance.projects.values_list("id", flat=True))
            added_ids = new_project_ids - old_project_ids
            if added_ids:
                for project in Project.objects.filter(id__in=added_ids):
                    notify_post_added_to_project(form.instance, project)


@admin.register(Notebook)
class NotebookAdmin(CustomTranslationAdmin):
    list_display = [
        "title",
        "author",
        "curation_status",
        "published_at",
        "comments",
        "votes",
        "post_link",
        "feed_tile_summary",
    ]
    readonly_fields = ["post_link"]
    search_fields = ["post__title_original"]
    list_filter = [
        AutocompleteFilterFactory("Default Project", "post__default_project"),
        AutocompleteFilterFactory("Project", "post__projects"),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).distinct()

    def title(self, obj):
        return obj.post.title

    def author(self, obj):
        return obj.post.author

    author.admin_order_field = "post__author"

    def curation_status(self, obj):
        return obj.post.curation_status

    def published_at(self, obj):
        return obj.post.published_at

    published_at.admin_order_field = "post__published_at"

    def comments(self, obj):
        return obj.post.comments.count()

    def votes(self, obj):
        return obj.post.votes.count()

    votes.admin_order_field = "post__votes"

    def post_link(self, obj):
        post = obj.post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")
