from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin

from posts.models import Post
from posts.tasks import run_post_generate_history_snapshot
from questions.constants import UnsuccessfulResolutionType
from questions.models import (
    AggregateForecast,
    Conditional,
    Question,
    GroupOfQuestions,
    Forecast,
)
from questions.services.forecasts import build_question_forecasts
from questions.types import AggregationMethod
from utils.csv_utils import export_all_data_for_questions
from utils.models import CustomTranslationAdmin


@admin.register(Question)
class QuestionAdmin(CustomTranslationAdmin, DynamicArrayMixin):
    list_display = [
        "title",
        "type",
        "forecasts",
        "open_time",
        "author",
        "curation_status",
        "post_link",
    ]
    readonly_fields = ["post_link", "view_forecasts"]
    search_fields = [
        "id",
        "title_original",
        "description_original",
        "related_posts__post__id",
        "related_posts__post__title",
    ]
    actions = [
        "export_selected_questions_data",
        "export_selected_questions_data_anonymized",
        "rebuild_aggregation_history",
        "trigger_scoring",
        "trigger_scoring_with_all_aggregations",
        "mark_post_as_deleted",
    ]
    list_filter = [
        "type",
        "related_posts__post__curation_status",
        AutocompleteFilterFactory("Post", "related_posts__post"),
        AutocompleteFilterFactory("Author", "related_posts__post__author"),
        AutocompleteFilterFactory(
            "Default Project", "related_posts__post__default_project"
        ),
        AutocompleteFilterFactory("Project", "related_posts__post__projects"),
    ]

    autocomplete_fields = ["group"]

    def forecasts(self, obj):
        return obj.user_forecasts.count()

    def author(self, obj):
        return obj.related_posts.first().post.author

    author.admin_order_field = "related_posts__post__author"

    def curation_status(self, obj):
        return obj.related_posts.first().post.curation_status

    curation_status.admin_order_field = "related_posts__post__curation_status"

    def post_link(self, obj):
        post = obj.related_posts.first().post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")

    def view_forecasts(self, obj):
        url = reverse("admin:questions_forecast_changelist") + f"?question={obj.id}"
        return format_html('<a href="{}">View Forecasts</a>', url)

    def should_update_translations(self, obj):
        post = obj.get_post()
        is_private = post.default_project.default_permission is None
        is_approved = post.curation_status == Post.CurationStatus.APPROVED

        return not is_private and is_approved

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["post_link", "view_forecasts"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        post_id = obj.get_post_id()

        if post_id:
            run_post_generate_history_snapshot.send(post_id, request.user.id)

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def export_selected_questions_data(
        self, request, queryset: QuerySet[Question], **kwargs
    ):
        # generate a zip file with three csv files: question_data, forecast_data,
        # and comment_data

        data = export_all_data_for_questions(
            queryset,
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

    def export_selected_questions_data_anonymized(
        self, request, queryset: QuerySet[Question]
    ):
        return self.export_selected_questions_data(request, queryset, anonymized=True)

    def rebuild_aggregation_history(self, request, queryset: QuerySet[Question]):
        for question in queryset:
            build_question_forecasts(question)

    def trigger_scoring(self, request, queryset: QuerySet[Question]):
        from scoring.utils import score_question

        for question in queryset:
            if not question.resolution or question.resolution in (
                UnsuccessfulResolutionType.AMBIGUOUS,
                UnsuccessfulResolutionType.ANNULLED,
            ):
                continue
            score_question(
                question=question,
                resolution=question.resolution,
            )

    trigger_scoring.short_description = "Trigger Scoring (does nothing if not resolved)"

    def trigger_scoring_with_all_aggregations(
        self, request, queryset: QuerySet[Question]
    ):
        from scoring.utils import score_question

        for question in queryset:
            if not question.resolution or question.resolution in (
                UnsuccessfulResolutionType.AMBIGUOUS,
                UnsuccessfulResolutionType.ANNULLED,
            ):
                continue
            score_question(
                question=question,
                resolution=question.resolution,
                aggregation_methods=list(AggregationMethod._member_map_.values()),
            )

    trigger_scoring_with_all_aggregations.short_description = (
        "Trigger Scoring (Includes ALL Aggregations) (does nothing if not resolved)"
    )

    def mark_post_as_deleted(self, request, queryset: QuerySet[Question]):
        updated = 0
        for obj in queryset:
            post = obj.get_post()
            if post is not None:
                post.curation_status = Post.CurationStatus.DELETED
                post.save()
                updated += 1
        self.message_user(request, f"Marked {updated} post(s) as DELETED.")

    mark_post_as_deleted.short_description = "Mark post as DELETED"


@admin.register(Conditional)
class ConditionalAdmin(admin.ModelAdmin):
    list_display = ["__str__"]
    search_fields = ["id"]
    autocomplete_fields = ["condition", "condition_child"]
    readonly_fields = ["post_link"]

    def post_link(self, obj):
        post = obj.post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def should_update_translations(self, obj):
        post = obj.post
        is_private = post.default_project.default_permission is None
        is_approved = post.curation_status == Post.CurationStatus.APPROVED

        return not is_private and is_approved

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["post_link"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields


@admin.register(GroupOfQuestions)
class GroupOfQuestionsAdmin(CustomTranslationAdmin):
    search_fields = ["id"]
    readonly_fields = ["post_link", "view_questions"]

    def post_link(self, obj):
        post = obj.post
        url = reverse("admin:posts_post_change", args=[post.id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{post.id}")

    def view_questions(self, obj):
        url = reverse("admin:questions_question_changelist") + f"?group={obj.id}"
        return format_html('<a href="{}">View Questions</a>', url)

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def should_update_translations(self, obj):
        post = obj.post
        is_private = post.default_project.default_permission is None
        is_approved = post.curation_status == Post.CurationStatus.APPROVED

        return not is_private and is_approved

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["post_link", "view_questions"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields

    def save_model(self, request, obj: GroupOfQuestions, form, change):
        super().save_model(request, obj, form, change)

        if obj.post_id:
            run_post_generate_history_snapshot.send(obj.post_id, request.user.id)


@admin.register(Forecast)
class ForecastAdmin(admin.ModelAdmin):
    list_display = ["__str__", "author", "question", "start_time", "end_time"]
    autocomplete_fields = ["author", "question"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions


@admin.register(AggregateForecast)
class AggregateForecastAdmin(admin.ModelAdmin):
    list_display = ["__str__", "method", "question", "start_time", "end_time"]
    autocomplete_fields = ["question"]
    search_fields = ["question__title_original"]
    list_filter = ["method"]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions
