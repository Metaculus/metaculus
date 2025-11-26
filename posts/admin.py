from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from posts.models import Post, Notebook
from posts.services.common import trigger_update_post_translations
from posts.services.hotness import explain_post_hotness
from questions.models import Question
from questions.services import build_question_forecasts
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
    readonly_fields = ["notebook", "hotness_explanation", "view_questions"]
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
        url = (
            reverse("admin:questions_question_changelist")
            + f"?related_posts__post={obj.id}"
        )
        return format_html('<a href="{}">View Questions</a>', url)

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

        questions = Question.objects.filter(related_posts__post__in=queryset).distinct()

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
            post.curation_status = Post.CurationStatus.DELETED
            post.save()
            updated += 1
        self.message_user(request, f"Marked {updated} post(s) as DELETED.")

    mark_as_deleted.short_description = "Mark as DELETED"

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        obj.update_pseudo_materialized_fields()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["view_questions"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields


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
        "markdown_summary",
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
