import csv
import traceback

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone

from comments.models import Comment
from projects.models import Project

# from metac_account.models.user import User
from .utils import get_fab_tournament, submit_questions


@staff_member_required
def fab_management_view(request):
    if request.method == "POST":
        submit_messages = []
        try:
            tournament_id = request.POST["tournament_id"]
            action_name = request.POST.get("action_name")

            saved_context = {"tournament_id": tournament_id}
            match action_name:
                case "auto_schedule":
                    response = HttpResponse(content_type='text/csv')
                    response['Content-Disposition'] = 'attachment; filename="auto_schedule.csv"'

                    writer = csv.writer(response)
                    writer.writerow(['Question ID', 'Title', 'Scheduled Date', 'Notes'])

                    # Add Content-Length header to ensure proper download handling
                    response['Content-Length'] = len(response.content)

                    # Return the response with the saved context to keep the page state
                    return response

                case "submit_dry":
                    doc_id = request.POST["doc_id"]
                    sheet_name = request.POST["sheet_name"]
                    rows_range = request.POST["rows_range"]
                    submit_messages = submit_questions(
                        doc_id,
                        sheet_name,
                        tournament_id,
                        True,
                        rows_range,
                    )
                    saved_context = {
                        **saved_context,
                        **{
                            k: request.POST[k]
                            for k in [
                                "doc_id",
                                "sheet_name",
                                "rows_range",
                                "tournament_id",
                            ]
                        },
                    }
                case "submit":
                    doc_id = request.POST["doc_id"]
                    sheet_name = request.POST["sheet_name"]
                    rows_range = request.POST["rows_range"]
                    submit_messages = submit_questions(
                        doc_id,
                        sheet_name,
                        tournament_id,
                        False,
                        rows_range,
                    )
                case "publish_comments":
                    tournament = Project.objects.get(pk=tournament_id)
                    now = timezone.now()
                    count = Comment.objects.filter(
                        on_post__default_project=tournament,
                        author__is_bot=True,
                        on_post__question__cp_reveal_time__lt=now,
                        is_private=True,
                    ).update(is_private=False)
                    messages.info(
                        request,
                        f"Published {count} bot (🤖) private notes from questions with CP visible",
                    )

        except Exception as e:
            error_message = str(e)
            exception_type = type(e).__name__
            traceback_details = traceback.format_exc()
            messages.error(
                request,
                f" Exception thrown: {error_message} : {exception_type}: {traceback_details}",
            )

        for msg_type, msg in submit_messages:
            if msg_type == "info":
                messages.info(request, msg)
            else:
                messages.error(request, msg)

        return render(request, "fab_management.html", context=saved_context)

    fab_tournament = get_fab_tournament()
    page_context = {"tournament_id": fab_tournament.id if fab_tournament else None}
    return render(request, "fab_management.html", context=page_context)
