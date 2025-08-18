from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.urls import path
from datetime import date, datetime

from utils.models import CustomTranslationAdmin
from .models import Comment, KeyFactor
from .tasks import job_finalize_and_send_weekly_top_comments


class KeyFactorInline(admin.TabularInline):
    model = KeyFactor
    extra = 0
    fields = ["text", "votes_score", "is_active"]
    readonly_fields = ["votes_score"]
    can_delete = True


@admin.register(Comment)
class CommentAdmin(CustomTranslationAdmin):
    list_display = [
        "__str__",
        "author",
        "on_post",
    ]
    list_filter = [
        AutocompleteFilterFactory("Post", "on_post"),
        AutocompleteFilterFactory("Project", "on_project"),
        AutocompleteFilterFactory("Author", "author"),
        "is_soft_deleted",
    ]
    autocomplete_fields = [
        "author",
        "on_post",
    ]
    readonly_fields = ["included_forecast"]
    fields = [
        "author",
        "text",
        "on_post",
        "on_project",
        "is_soft_deleted",
        "included_forecast",
        "is_private",
    ]
    search_fields = ["id", "text"]
    inlines = [KeyFactorInline]

    def should_update_translations(self, obj):
        return not obj.on_post.is_private()

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "finalize-weekly-top-comments/",
                self.admin_site.admin_view(self.finalize_weekly_top_comments_view),
                name="comments_comment_finalize_weekly_top_comments",
            ),
        ]
        return custom_urls + urls

    def finalize_weekly_top_comments_view(self, request):
        if request.method == "POST":
            try:
                # Get the date from the form
                date_str = request.POST.get("week_date")
                if date_str:
                    week_date = date.fromisoformat(date_str)
                else:
                    week_date = datetime.now().date()

                # Call the job - convert date to string for JSON serialization
                job_finalize_and_send_weekly_top_comments.send(week_date.isoformat(), True)

                messages.success(
                    request,
                    f"Weekly top comments job has been queued for processing for date: {week_date}",
                )
            except ValueError:
                messages.error(
                    request, "Invalid date format. Please use YYYY-MM-DD format."
                )
            except Exception as e:
                messages.error(request, f"Error queuing job: {str(e)}")

            return HttpResponseRedirect("../")

        # Display a simple form
        from django.middleware.csrf import get_token

        csrf_token = get_token(request)
        html_content = f"""
        <div style="padding: 20px;">
            <h2>Finalize Weekly Top Comments</h2>
            <p>This will trigger the weekly top comments job for the specified date.</p>
            <form method="post">
                <input type="hidden" name="csrfmiddlewaretoken" value="{csrf_token}">
                <label for="week_date">Week Date (YYYY-MM-DD, optional - defaults to today):</label><br>
                <input type="date" id="week_date" name="week_date" style="margin: 10px 0;"><br>
                <input type="submit" value="Run Job" style="margin-top: 10px; padding: 5px 10px;">
            </form>
        </div>
        """

        from django.http import HttpResponse

        return HttpResponse(html_content)

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["show_finalize_button"] = "true"
        return super().changelist_view(request, extra_context)


@admin.register(KeyFactor)
class KeyFactorAdmin(CustomTranslationAdmin):
    list_filter = [
        AutocompleteFilterFactory("Comment", "comment"),
        AutocompleteFilterFactory("Post", "comment__on_post"),
    ]

    autocomplete_fields = [
        "comment",
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("comment__on_post")
