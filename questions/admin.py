from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin

from questions.models import (
    AggregateForecast,
    Conditional,
    Question,
    GroupOfQuestions,
    Forecast,
    BinaryQuestionLink,
    CausalLink,
)
from questions.services import build_question_forecasts
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
        is_private = (
            obj.related_posts.first().post.default_project.default_permission is None
        )
        return not is_private

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["post_link", "view_forecasts"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields

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
            if question.resolution in ["", None, "ambiguous", "annulled"]:
                continue
            score_question(
                question=question,
                resolution=question.resolution,
            )

    trigger_scoring.short_description = "Trigger Scoring (does nothing if not resolved)"


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
        is_private = obj.post.default_project.default_permission is None
        return not is_private

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
        is_private = obj.post.default_project.default_permission is None
        return not is_private

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        for field in ["post_link", "view_questions"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        return fields


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

# Question Link MVP Additions
@admin.register(BinaryQuestionLink)
class BinaryQuestionLinkAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'source_question_title', 'target_question_title', 
        'link_type', 'status', 'created_at'
    )
    list_filter = ('link_type', 'status', 'bidirectional', 'created_at')
    search_fields = (
        'user__username', 'source_question__title', 'target_question__title'
    )
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'source_question', 'target_question')
    
    def source_question_title(self, obj):
        return obj.source_question.title[:50] + "..." if len(obj.source_question.title) > 50 else obj.source_question.title
    source_question_title.short_description = "Source Question"
    
    def target_question_title(self, obj):
        return obj.target_question.title[:50] + "..." if len(obj.target_question.title) > 50 else obj.target_question.title
    target_question_title.short_description = "Target Question"


@admin.register(CausalLink)
class CausalLinkAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'source_question_title', 'direction_symbol', 
        'target_question_title', 'strength', 'status', 'created_at'
    )
    list_filter = ('direction', 'strength', 'status', 'created_at')
    search_fields = (
        'user__username', 'source_question__title', 'target_question__title'
    )
    readonly_fields = ('created_at', 'updated_at', 'link_type', 'bidirectional')
    raw_id_fields = ('user', 'source_question', 'target_question')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'source_question', 'target_question')
        }),
        ('Causal Properties', {
            'fields': ('direction', 'strength', 'reasoning')
        }),
        ('Status', {
            'fields': ('status', 'resolution_status', 'forecast_status')
        }),
        ('Metadata', {
            'fields': ('link_type', 'bidirectional', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def source_question_title(self, obj):
        return obj.source_question.title[:50] + "..." if len(obj.source_question.title) > 50 else obj.source_question.title
    source_question_title.short_description = "Source Question"
    
    def target_question_title(self, obj):
        return obj.target_question.title[:50] + "..." if len(obj.target_question.title) > 50 else obj.target_question.title
    target_question_title.short_description = "Target Question"
    
    def direction_symbol(self, obj):
        return "→+" if obj.direction == obj.Direction.POSITIVE else "→-"
    direction_symbol.short_description = "Direction"
