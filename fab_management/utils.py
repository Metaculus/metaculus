import json
import base64
import logging
import re
from collections.abc import Generator
from datetime import datetime

import gspread
import pytz
from django.conf import settings
from django.db import transaction

# from metac_account.models.user import User
# from metac_project.model_utils.permissions import QuestionPermissions
# from metac_project.models.project import Project, ProjectScoreType
# from metac_question.models.question import Question
from users.models import User
from projects.models import Project
from questions.models import Question
from posts.models import Post

logger = logging.getLogger(__name__)


def get_fab_tournament() -> Project | None:
    project = Project.objects.filter(pk=32506).last()
    return project


scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

MAX_COL = "T"


def convert_to_timestamp(date, hour, minute):
    est_tz = pytz.timezone("US/Eastern")
    utc_tz = pytz.UTC

    # Parse the date, set the time, and localize to EST
    aware_date_est = est_tz.localize(
        datetime.strptime(date, "%m/%d/%y").replace(hour=hour, minute=minute)
    )

    # Convert the EST datetime to UTC
    return aware_date_est.astimezone(utc_tz)


question_columns = [
    # touples with: column header, question field name, type/conversion function
    ("title", "title", "string"),
    ("description", "description", "string"),
    ("resolution_criteria", "resolution_criteria", "string"),
    ("fine_print", "fine_print", "string"),
    ("publish_time", "open_time", lambda val: convert_to_timestamp(val, 10, 30)),
    (
        "close_time",
        "scheduled_close_time",
        lambda val: convert_to_timestamp(val, 10, 30),
    ),
    (
        "resolve_time",
        "scheduled_resolve_time",
        lambda val: convert_to_timestamp(val, 10, 30),
    ),
]

# post_columsn = [
#     ("publish_time", "published_at", lambda val: convert_to_timestamp(val, 10, 30)),
#     ("author", "author", lambda username: User.objects.get(username=username)),
# ]


def submit_questions(
    doc_id: str, sheet_name: str, tournament_id: int, dry_run: bool, rows_range: str
) -> list[tuple[str, str]]:
    worksheet = get_worksheet(doc_id, sheet_name)
    tournament = Project.objects.get(pk=tournament_id)
    messages: list[tuple[str, str]] = []

    def log_error(msg: str):
        return messages.append(("error", msg))

    def log_info(msg: str):
        return messages.append(("info", msg))

    log_info(
        f"Importing these questions to tournament [{tournament.id}/{tournament.name}], from sheet [{worksheet.title}]-> {rows_range}: "
    )
    top_columns = worksheet.get("A1:T1")[0]

    def get_val(row, col_name):
        col_idx = top_columns.index(col_name)
        # row = worksheet.get(f"A{row_idx}:T{row_idx}", maintain_size=True)[0]
        val = row[col_idx]
        return val

    col_name = None
    with transaction.atomic():
        for row, row_idx in rows_iterator(worksheet, rows_range):
            question_data = {"type": "binary"}
            try:
                parent_url = get_val(row, "parent_url")
                parent_post = get_parent_post(parent_url) if parent_url else None

                col_name = None
                for col_name, question_field, format_fn in question_columns:
                    val = get_val(row, col_name)

                    if val == ".p":
                        if parent_post is None:
                            log_error(
                                f"Error on row {row_idx}, col '{col_name}': question has no parent, but '.p' was used for field"
                            )
                            continue
                        val = getattr(parent_post.question, question_field)
                    elif callable(format_fn):
                        val = format_fn(val)
                    question_data[question_field] = val
            except Exception as e:
                log_error(
                    f"Error on row {row_idx}{', col ' + col_name if col_name else ''}: {str(e)}"
                )
                continue
            question = Question(**question_data)

            question.cp_reveal_time = question.scheduled_close_time
            question.include_bots_in_aggregates = True
            question.save()
            post = Post(
                title=question.title,
                author=User.objects.get(username=get_val(row, "author")),
                published_at=question.open_time,
                created_at=question.created_at,
                default_project=tournament,
                question=question,
                curation_status=Post.CurationStatus.APPROVED,
                scheduled_close_time=question.scheduled_close_time,
                scheduled_resolve_time=question.scheduled_resolve_time,
            )
            post.save()
            log_info(f"   - added question [{question.title}] to {tournament.name}")
        if dry_run:
            transaction.set_rollback(True)
            log_info("****UNDO all actions, dry-run mode was ON****")
    return messages


def get_worksheet(sheet_id, sheet_name):
    credentials = json.loads(
        base64.b64decode(settings.GOOGLE_CREDEBTIALS_FAB_SHEET_B64)
    )

    gc = gspread.service_account_from_dict(credentials)

    sh = gc.open_by_key(sheet_id)
    worksheet = sh.worksheet(sheet_name)
    return worksheet


def get_parent_post(url: str) -> Post | None:
    match = re.search(r"/questions/(\d+)/", url)
    # we want to fail, if there's no match, so typeignore for the None branch
    try:
        id = int(match.group(1))  # type: ignore
    except Exception:
        raise Exception("Invalid parent question URL")
    return Post.objects.filter(pk=id).first()


def rows_iterator(worksheet, rows_range: str) -> Generator[tuple[str, int], None, None]:
    batch = 5
    [start, end] = [int(a) for a in rows_range.split(":")]
    row = start
    batch = min(batch, end - start)
    while row < end:
        rows = worksheet.get(f"A{row}:T{row+batch-1}", maintain_size=True)
        # range will not yield the last element in the range, while worksheet.get will, hence the
        # mismatch between the two here
        yield from zip(rows, range(row, row + batch))
        row += batch
