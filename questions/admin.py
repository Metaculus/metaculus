from admin_auto_filters.filters import AutocompleteFilterFactory
from datetime import datetime, timedelta

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html
from django_better_admin_arrayfield.admin.mixins import DynamicArrayMixin
from rest_framework.exceptions import ValidationError as DRFValidationError

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
from questions.services.multiple_choice_handlers import (
    MultipleChoiceOptionsUpdateSerializer,
    get_all_options_from_history,
    multiple_choice_add_options,
    multiple_choice_change_grace_period_end,
    multiple_choice_delete_options,
    multiple_choice_rename_option,
    multiple_choice_reorder_options,
)
from utils.csv_utils import export_all_data_for_questions
from utils.models import CustomTranslationAdmin


def get_latest_options_history_datetime(options_history):
    if not options_history:
        return None
    raw_timestamp = options_history[-1][0]
    try:
        if isinstance(raw_timestamp, datetime):
            parsed_timestamp = raw_timestamp
        elif isinstance(raw_timestamp, str):
            parsed_timestamp = datetime.fromisoformat(raw_timestamp)
        else:
            return None
    except ValueError:
        return None
    if timezone.is_naive(parsed_timestamp):
        parsed_timestamp = timezone.make_aware(parsed_timestamp)
    return parsed_timestamp


def has_active_grace_period(options_history, reference_time=None):
    reference_time = reference_time or timezone.now()
    latest_timestamp = get_latest_options_history_datetime(options_history)
    return bool(latest_timestamp and latest_timestamp > reference_time)


class MultipleChoiceOptionsAdminForm(forms.Form):
    ACTION_RENAME = "rename_options"
    ACTION_DELETE = "delete_options"
    ACTION_ADD = "add_options"
    ACTION_CHANGE_GRACE = "change_grace_period_end"
    ACTION_REORDER = "reorder_options"
    ACTION_CHOICES = (
        (ACTION_RENAME, "Rename options"),
        (ACTION_DELETE, "Delete options"),
        (ACTION_ADD, "Add options"),
        # (ACTION_CHANGE_GRACE, "Change grace period end"),  # not ready yet
        (ACTION_REORDER, "Reorder options"),
    )

    action = forms.ChoiceField(choices=ACTION_CHOICES, required=True)
    old_option = forms.ChoiceField(required=False)
    new_option = forms.CharField(
        required=False, label="New option text", strip=True, max_length=200
    )
    options_to_delete = forms.MultipleChoiceField(
        required=False, widget=forms.CheckboxSelectMultiple
    )
    new_options = forms.CharField(
        required=False,
        help_text="Comma-separated options to add before the catch-all option.",
    )
    grace_period_end = forms.DateTimeField(
        required=False,
        help_text=(
            "Default value is 3 days from now. "
            "Required when adding options; must be in the future. "
            "Format: YYYY-MM-DD or YYYY-MM-DD HH:MM (time optional)."
        ),
        input_formats=["%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%d"],
    )
    delete_comment = forms.CharField(
        required=False,
        label="Delete options comment",
        widget=forms.Textarea(attrs={"rows": 3}),
        help_text="Placeholders will auto-fill; edit as needed."
        " {removed_options} becomes a quoted list, {timestep} is formatted UTC, "
        "and {catch_all_option} is the catch-all option.",
    )
    add_comment = forms.CharField(
        required=False,
        label="Add options comment",
        widget=forms.Textarea(attrs={"rows": 4}),
        help_text="Placeholders will auto-fill; edit as needed."
        " {added_options} becomes a quoted list, {timestep} is formatted UTC, "
        "and {grace_period_end} is the grace deadline.",
    )

    def __init__(self, question: Question, *args, **kwargs):
        self.question = question
        super().__init__(*args, **kwargs)

        options_history = question.options_history or []
        latest_options_history = get_latest_options_history_datetime(options_history)
        self.options_grace_period_end = (
            latest_options_history
            if latest_options_history and latest_options_history > timezone.now()
            else None
        )
        default_delete_comment = (
            "Options {removed_options} were removed on {timestep}. "
            'Their probability was folded into the "{catch_all_option}" option.'
        )
        default_add_comment = (
            "Options {added_options} were added on {timestep}. "
            "Please update forecasts before {grace_period_end}; "
            "forecasts that are not updated will auto-withdraw then."
        )

        active_grace = has_active_grace_period(options_history)
        action_choices = list(self.ACTION_CHOICES)
        if active_grace:
            action_choices = [
                choice
                for choice in action_choices
                if choice[0] in (self.ACTION_RENAME, self.ACTION_CHANGE_GRACE)
            ]
        else:
            action_choices = [
                choice
                for choice in action_choices
                if choice[0] != self.ACTION_CHANGE_GRACE
            ]
        if len(options_history) > 1:
            action_choices = [
                choice for choice in action_choices if choice[0] != self.ACTION_REORDER
            ]
        action = forms.ChoiceField(
            choices=[("", "Select action")] + action_choices,
            required=True,
            initial="",
        )
        self.fields["action"] = action
        all_options = (
            get_all_options_from_history(options_history) if options_history else []
        )
        self.fields["old_option"].choices = [(opt, opt) for opt in all_options]

        current_options = question.options or []
        self.fields["options_to_delete"].choices = [
            (opt, opt) for opt in current_options
        ]
        self.reorder_field_names: list[tuple[str, str]] = []
        for index, option in enumerate(current_options):
            field_name = f"reorder_position_{index}"
            self.reorder_field_names.append((option, field_name))
            self.fields[field_name] = forms.IntegerField(
                required=False,
                min_value=1,
                label=f"Order for '{option}'",
                help_text="Use integers; options will be ordered ascending.",
            )
        if current_options:
            self.fields["options_to_delete"].widget.attrs["data-catch-all"] = (
                current_options[-1]
            )
        self.fields["options_to_delete"].help_text = (
            "Warning: do not remove all options. The question should have at least "
            "2 options: the last option you can't delete, and one other."
        )
        grace_field = self.fields["grace_period_end"]
        grace_field.widget = forms.DateTimeInput(
            attrs={"type": "datetime-local"},
            format="%Y-%m-%dT%H:%M",
        )
        grace_initial = self.options_grace_period_end or (
            timezone.now() + timedelta(days=3)
        )
        if grace_initial and timezone.is_naive(grace_initial):
            grace_initial = timezone.make_aware(grace_initial)
        grace_field.initial = timezone.localtime(grace_initial)
        if self.options_grace_period_end:
            grace_field.help_text = "Time selection is in UTC."
        self.fields["grace_period_end"].initial = grace_field.initial
        self.fields["delete_comment"].initial = default_delete_comment
        self.fields["add_comment"].initial = default_add_comment

    def is_in_grace_period(self, reference_time=None):
        reference_time = reference_time or timezone.now()
        return bool(
            self.options_grace_period_end
            and self.options_grace_period_end > reference_time
        )

    def clean(self):
        cleaned_data = super().clean()
        question = self.question
        action = cleaned_data.get("action")
        current_options = question.options or []
        options_history = question.options_history or []
        now = timezone.now()

        if not question.options or not question.options_history:
            raise forms.ValidationError(
                "This question needs options and an options history to update."
            )

        if not action:
            return cleaned_data

        if action == self.ACTION_RENAME:
            old_option = cleaned_data.get("old_option")
            new_option = cleaned_data.get("new_option", "")

            if not old_option:
                self.add_error("old_option", "Select an option to rename.")
            if not new_option or not new_option.strip():
                self.add_error("new_option", "Enter the new option text.")
            new_option = (new_option or "").strip()

            if self.errors:
                return cleaned_data

            if old_option not in current_options:
                self.add_error(
                    "old_option", "Selected option is not part of the current choices."
                )
                return cleaned_data

            new_options = [
                new_option if opt == old_option else opt for opt in current_options
            ]
            if len(set(new_options)) != len(new_options):
                self.add_error(
                    "new_option", "New option duplicates an existing option."
                )
                return cleaned_data

            cleaned_data["target_option"] = old_option
            cleaned_data["parsed_new_option"] = new_option
            return cleaned_data

        if action == self.ACTION_DELETE:
            options_to_delete = cleaned_data.get("options_to_delete") or []
            catch_all_option = current_options[-1] if current_options else None
            if not options_to_delete:
                self.add_error(
                    "options_to_delete", "Select at least one option to delete."
                )
                return cleaned_data
            if catch_all_option and catch_all_option in options_to_delete:
                self.add_error(
                    "options_to_delete", "The final catch-all option cannot be deleted."
                )

            new_options = [
                opt for opt in current_options if opt not in options_to_delete
            ]
            if len(new_options) < 2:
                self.add_error(
                    "options_to_delete",
                    "At least one option in addition to the catch-all must remain.",
                )
            if self.is_in_grace_period(now):
                self.add_error(
                    "options_to_delete",
                    "Options cannot change during an active grace period.",
                )

            if self.errors:
                return cleaned_data

            serializer = MultipleChoiceOptionsUpdateSerializer(
                context={"question": question}
            )
            try:
                serializer.validate_new_options(new_options, options_history, None)
            except DRFValidationError as exc:
                raise forms.ValidationError(exc.detail or exc.args)

            cleaned_data["options_to_delete"] = options_to_delete
            cleaned_data["delete_comment"] = cleaned_data.get("delete_comment", "")
            return cleaned_data

        if action == self.ACTION_ADD:
            new_options_raw = cleaned_data.get("new_options") or ""
            grace_period_end = cleaned_data.get("grace_period_end")
            if grace_period_end and timezone.is_naive(grace_period_end):
                grace_period_end = timezone.make_aware(grace_period_end)
                cleaned_data["grace_period_end"] = grace_period_end
            new_options_list = [
                opt.strip() for opt in new_options_raw.split(",") if opt.strip()
            ]
            if not new_options_list:
                self.add_error("new_options", "Enter at least one option to add.")
            if len(new_options_list) != len(set(new_options_list)):
                self.add_error("new_options", "New options list includes duplicates.")

            duplicate_existing = set(current_options).intersection(new_options_list)
            if duplicate_existing:
                self.add_error(
                    "new_options",
                    f"Options already exist: {', '.join(sorted(duplicate_existing))}",
                )

            if not grace_period_end:
                self.add_error(
                    "grace_period_end", "Grace period end is required when adding."
                )
            elif grace_period_end <= now:
                self.add_error(
                    "grace_period_end", "Grace period end must be in the future."
                )
            if self.is_in_grace_period(now):
                self.add_error(
                    "grace_period_end",
                    "Options cannot change during an active grace period.",
                )

            if self.errors:
                return cleaned_data

            serializer = MultipleChoiceOptionsUpdateSerializer(
                context={"question": question}
            )
            new_options = current_options[:-1] + new_options_list + current_options[-1:]
            try:
                serializer.validate_new_options(
                    new_options, options_history, grace_period_end
                )
            except DRFValidationError as exc:
                raise forms.ValidationError(exc.detail or exc.args)

            cleaned_data["new_options_list"] = new_options_list
            cleaned_data["grace_period_end"] = grace_period_end
            cleaned_data["add_comment"] = cleaned_data.get("add_comment", "")
            return cleaned_data

        if action == self.ACTION_CHANGE_GRACE:
            new_grace_end = cleaned_data.get("grace_period_end")
            if new_grace_end and timezone.is_naive(new_grace_end):
                new_grace_end = timezone.make_aware(new_grace_end)
                cleaned_data["grace_period_end"] = new_grace_end

            if not new_grace_end:
                self.add_error(
                    "grace_period_end", "New grace period end is required to change it."
                )
            elif new_grace_end <= now:
                self.add_error(
                    "grace_period_end", "Grace period end must be in the future."
                )

            if not self.is_in_grace_period(now):
                self.add_error(
                    "grace_period_end",
                    "There is no active grace period to change.",
                )

            if self.errors:
                return cleaned_data

            cleaned_data["new_grace_period_end"] = new_grace_end
            return cleaned_data

        if action == self.ACTION_REORDER:
            if len(options_history) > 1:
                self.add_error(
                    "action",
                    "Options can only be reordered when there is a single options history entry.",
                )
                return cleaned_data

            positions: dict[str, int] = {}
            seen_values: set[int] = set()

            for option, field_name in getattr(self, "reorder_field_names", []):
                value = cleaned_data.get(field_name)
                if value is None:
                    self.add_error(field_name, "Enter an order value.")
                    continue
                if value in seen_values:
                    self.add_error(
                        field_name,
                        "Order value must be unique.",
                    )
                    continue
                seen_values.add(value)
                positions[option] = value

            if self.errors:
                return cleaned_data

            if len(positions) != len(current_options):
                raise forms.ValidationError("Provide an order value for every option.")

            desired_order = [
                option
                for option, _ in sorted(positions.items(), key=lambda item: item[1])
            ]
            cleaned_data["new_order"] = desired_order
            return cleaned_data

        raise forms.ValidationError("Invalid action selected.")


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
    readonly_fields = [
        "post_link",
        "view_forecasts",
        "options",
        "options_history",
        "update_mc_options",
    ]
    search_fields = [
        "id",
        "title_original",
        "description_original",
        "post_id",
        "post__title",
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
        "post__curation_status",
        AutocompleteFilterFactory("Post", "post"),
        AutocompleteFilterFactory("Author", "post__author"),
        AutocompleteFilterFactory("Default Project", "post__default_project"),
        AutocompleteFilterFactory("Project", "post__projects"),
    ]

    autocomplete_fields = ["group"]

    def forecasts(self, obj):
        return obj.user_forecasts.count()

    def author(self, obj):
        return obj.post.author if obj.post else None

    author.admin_order_field = "post__author"

    def curation_status(self, obj):
        return obj.post.curation_status if obj.post else None

    curation_status.admin_order_field = "post__curation_status"

    def post_link(self, obj):
        if not obj.post_id:
            return None
        url = reverse("admin:posts_post_change", args=[obj.post_id])
        return format_html('<a href="{}">{}</a>', url, f"Post-{obj.post_id}")

    def view_forecasts(self, obj):
        url = reverse("admin:questions_forecast_changelist") + f"?question={obj.id}"
        return format_html('<a href="{}">View Forecasts</a>', url)

    def update_mc_options(self, obj):
        if not obj:
            return "Save the question to manage options."
        if obj.type != Question.QuestionType.MULTIPLE_CHOICE:
            return "Option updates are available for multiple choice questions only."
        if not obj.options_history or not obj.options:
            return "Options and options history are required to update choices."
        url = reverse("admin:questions_question_update_options", args=[obj.id])
        return format_html(
            '<a class="button" href="{}">Update multiple choice options</a>'
            '<p class="help">Rename, delete, or add options while keeping history.</p>',
            url,
        )

    update_mc_options.short_description = "Multiple choice options"

    def should_update_translations(self, obj):
        post = obj.get_post()
        is_private = post.default_project.default_permission is None
        is_approved = post.curation_status == Post.CurationStatus.APPROVED

        return not is_private and is_approved

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:question_id>/update-options/",
                self.admin_site.admin_view(self.update_options_view),
                name="questions_question_update_options",
            ),
        ]
        return custom_urls + urls

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)

        def insert_after(target_field: str, new_field: str):
            if new_field in fields:
                fields.remove(new_field)
            if target_field in fields:
                fields.insert(fields.index(target_field) + 1, new_field)
            else:
                fields.append(new_field)

        for field in ["post_link", "view_forecasts"]:
            if field in fields:
                fields.remove(field)
            fields.insert(0, field)
        if obj:
            insert_after("options_history", "update_mc_options")
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

    def update_options_view(self, request, question_id: int):
        question = Question.objects.filter(pk=question_id).first()
        if not question:
            raise Http404("Question not found.")
        if not self.has_change_permission(request, question):
            raise PermissionDenied

        change_url = reverse("admin:questions_question_change", args=[question.id])
        if question.type != Question.QuestionType.MULTIPLE_CHOICE:
            messages.error(
                request, "Option updates are available for multiple choice questions."
            )
            return HttpResponseRedirect(change_url)
        if not question.options or not question.options_history:
            messages.error(
                request,
                "Options and options history are required before updating choices.",
            )
            return HttpResponseRedirect(change_url)

        form = MultipleChoiceOptionsAdminForm(
            question, data=request.POST or None, prefix="options"
        )
        if request.method == "POST" and form.is_valid():
            action = form.cleaned_data["action"]
            if action == form.ACTION_RENAME:
                old_option = form.cleaned_data["target_option"]
                new_option = form.cleaned_data["parsed_new_option"]
                multiple_choice_rename_option(question, old_option, new_option)
                question.save(update_fields=["options", "options_history"])
                self.message_user(
                    request, f"Renamed option '{old_option}' to '{new_option}'."
                )
            elif action == form.ACTION_REORDER:
                new_order = form.cleaned_data["new_order"]
                multiple_choice_reorder_options(question, new_order)
                question.save(update_fields=["options", "options_history"])
                self.message_user(
                    request,
                    "Reordered options.",
                )
            elif action == form.ACTION_DELETE:
                options_to_delete = form.cleaned_data["options_to_delete"]
                delete_comment = form.cleaned_data.get("delete_comment", "")
                multiple_choice_delete_options(
                    question,
                    options_to_delete,
                    comment_author=request.user,
                    timestep=timezone.now(),
                    comment_text=delete_comment,
                )
                question.save(update_fields=["options", "options_history"])
                self.message_user(
                    request,
                    f"Deleted {len(options_to_delete)} option"
                    f"{'' if len(options_to_delete) == 1 else 's'}.",
                )
            elif action == form.ACTION_ADD:
                new_options = form.cleaned_data["new_options_list"]
                grace_period_end = form.cleaned_data["grace_period_end"]
                add_comment = form.cleaned_data.get("add_comment", "")
                if timezone.is_naive(grace_period_end):
                    grace_period_end = timezone.make_aware(grace_period_end)
                multiple_choice_add_options(
                    question,
                    new_options,
                    grace_period_end=grace_period_end,
                    comment_author=request.user,
                    timestep=timezone.now(),
                    comment_text=add_comment,
                )
                question.save(update_fields=["options", "options_history"])
                self.message_user(
                    request,
                    f"Added {len(new_options)} option"
                    f"{'' if len(new_options) == 1 else 's'}.",
                )
            elif action == form.ACTION_CHANGE_GRACE:
                new_grace_period_end = form.cleaned_data["new_grace_period_end"]
                if timezone.is_naive(new_grace_period_end):
                    new_grace_period_end = timezone.make_aware(new_grace_period_end)
                multiple_choice_change_grace_period_end(
                    question,
                    new_grace_period_end,
                    comment_author=request.user,
                    timestep=timezone.now(),
                )
                question.save(update_fields=["options_history"])
                self.message_user(
                    request,
                    f"Grace period end updated to {timezone.localtime(new_grace_period_end)}.",
                )
            return HttpResponseRedirect(change_url)

        grace_period_end = form.options_grace_period_end
        in_grace_period = form.is_in_grace_period()

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "original": question,
            "question": question,
            "title": f"Update options for {question}",
            "form": form,
            "media": self.media + form.media,
            "change_url": change_url,
            "current_options": question.options or [],
            "all_history_options": get_all_options_from_history(
                question.options_history
            ),
            "grace_period_end": grace_period_end,
            "in_grace_period": in_grace_period,
        }
        return TemplateResponse(request, "admin/questions/update_options.html", context)

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
