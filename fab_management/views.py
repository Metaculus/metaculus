from django.shortcuts import render

import traceback
from datetime import timedelta

from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import PermissionDenied
from django.db.models import Case, Count, F, Q, When
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

# from metac_account.models.user import User
from .utils import (
    get_fab_tournament,
    submit_questions,
)


from projects.models import Project, ProjectUserPermission
from users.models import User
from projects.permissions import ObjectPermission
from comments.models import Comment


@staff_member_required
def fab_management_view(request):
    if request.method == "POST":
        submit_messages = []
        try:
            tournament_id = request.POST["tournament_id"]
            action_name = request.POST.get("action_name")

            saved_context = {"tournament_id": tournament_id}
            match action_name:
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
                        on_post__projects=tournament,
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
