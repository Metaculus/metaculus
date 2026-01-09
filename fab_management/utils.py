import base64
import json
import logging
import re
import time
from collections.abc import Generator
from datetime import datetime

import gspread
import pytz
from django.conf import settings
from django.db import transaction

from posts.models import Post
from posts.services.common import (
    trigger_update_post_translations,
    update_questions_post_relation,
)
from posts.tasks import run_post_indexing
from projects.models import Project
from questions.models import Question
from users.models import User

logger = logging.getLogger(__name__)


scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

MAX_COLUMN = "U"
HEADER_ROW = 2


def convert_to_timestamp(date, hour, minute):
    est_tz = pytz.timezone("US/Eastern")
    utc_tz = pytz.UTC

    # Parse the date, set the time, and localize to EST
    aware_date_est = est_tz.localize(
        datetime.strptime(date, "%m/%d/%y").replace(hour=hour, minute=minute)
    )

    return aware_date_est.astimezone(utc_tz)


def get_number_or_none(row_values, field_name):
    value_str = row_values["range_max"]
    try:
        return float(value_str)
    except ValueError:
        return None


def get_string_value(row_value, field_name):
    return row_value[field_name]


def get_timestamp(row_values, field_name, default_time="00:00:00"):
    value_str = row_values.get(field_name, "")
    if not value_str:
        raise ValueError(f"Missing date in field '{field_name}'")

    if len(value_str.split()) == 1:
        value_str += f" {default_time}"

    formats = ["%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y"]
    naive_datetime = None

    for fmt in formats:
        try:
            naive_datetime = datetime.strptime(value_str, fmt)
            break
        except ValueError:
            continue

    if not naive_datetime:
        raise ValueError(f"Invalid date format for field '{field_name}': {value_str}")

    timezone = pytz.timezone("UTC")
    aware_datetime = timezone.localize(naive_datetime)
    return aware_datetime


def get_type(row_values):
    value_str = row_values["type"]
    if value_str not in [
        Question.QuestionType.BINARY,
        Question.QuestionType.MULTIPLE_CHOICE,
        Question.QuestionType.NUMERIC,
        Question.QuestionType.DISCRETE,
    ]:
        raise ValueError("Unknown value for the question type")
    return value_str


def get_question_weight(row_values):
    value_str = row_values["question_weight"]
    if not value_str:
        return 1.0
    value = float(value_str)
    if value <= 1 and value >= 0:
        return value
    raise ValueError("Invalid value for the question_weight field")


def get_range_max(row_values):
    value_str = row_values["range_max"]
    value = float(value_str)
    return value


def get_range_min(row_values):
    value_str = row_values["range_min"]
    value = float(value_str)
    return value


def get_zero_point(row_values) -> float | None:
    value_str = row_values["zero_point"]
    if not value_str:
        return None
    value = float(value_str)
    return value


def get_open_lower_bound(row_values):
    return row_values["open_lower_bound"].lower() == "true"


def get_open_upper_bound(row_values):
    return row_values["open_upper_bound"].lower() == "true"


def get_unit(row_values) -> str:
    value_str = row_values.get("unit", "")
    return value_str.strip()


def get_group_variable(row_values):
    return row_values["group_variable"]


def get_options(row_values):
    return row_values["options"].split("|")


def get_author(row_values):
    username = row_values["author"]
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        raise ValueError(f"Author username is not valud '{username}'")


common_fields = [
    ("title", lambda row_values: get_string_value(row_values, "title")),
    ("type", get_type),
    (
        "resolution_criteria",
        lambda row_values: get_string_value(row_values, "resolution_criteria"),
    ),
    ("fine_print", lambda row_values: get_string_value(row_values, "fine_print")),
    ("description", lambda row_values: get_string_value(row_values, "description")),
    ("question_weight", get_question_weight),
    ("open_time", lambda row_values: get_timestamp(row_values, "open_time")),
    (
        "scheduled_close_time",
        lambda row_values: get_timestamp(row_values, "scheduled_close_time"),
    ),
    (
        "scheduled_resolve_time",
        lambda row_values: get_timestamp(row_values, "scheduled_resolve_time"),
    ),
]

numeric_q_fields = [
    ("range_min", get_range_min),
    ("range_max", get_range_max),
    ("zero_point", get_zero_point),
    ("open_lower_bound", get_open_lower_bound),
    ("open_upper_bound", get_open_upper_bound),
    ("unit", get_unit),
]

multiple_choice_q_fields = [
    (
        "group_variable",
        lambda row_values: get_string_value(row_values, "group_variable"),
    ),
    ("options", get_options),
]

other_fields = [
    ("parent_url", lambda row_values: get_string_value(row_values, "parent_url")),
    ("author", lambda row_values: get_string_value(row_values, "author")),
]


all_fields = common_fields + numeric_q_fields + multiple_choice_q_fields + other_fields


def submit_questions(
    doc_id: str, sheet_name: str, tournament_id: int, dry_run: bool, rows_range: str
) -> list[tuple[str, str]]:
    worksheet = get_worksheet(doc_id, sheet_name)
    tournament = Project.objects.get(pk=tournament_id)
    messages: list[tuple[str, str]] = []
    field_name = None

    rollback = dry_run

    def log_error(msg: str):
        return messages.append(("error", msg))

    def log_info(msg: str):
        return messages.append(("info", msg))

    if not tournament:
        log_error("Tournament not found")
        return messages

    try:
        start_str, end_str = rows_range.split(":")
        start, end = int(start_str), int(end_str)
        if start > end:
            raise ValueError()
    except Exception:
        log_error(
            f"Invalid value for rows range: {rows_range}. Should be in the format start:end"
        )
        return messages

    log_info(
        f"Importing these questions to tournament [{tournament.id}/{tournament.name}], from sheet [{worksheet.title}]-> {rows_range}: "
    )
    top_columns = worksheet.get(f"A{HEADER_ROW}:{MAX_COLUMN}{HEADER_ROW}")[0]

    def get_raw_val(row, col_name):
        col_idx = top_columns.index(col_name)
        return row[col_idx]

    def get_values_dict(row):
        values_dict = {}
        for field_name, _ in all_fields:
            idx = top_columns.index(field_name)
            values_dict[field_name] = row[idx]
        return values_dict

    start_time = time.time()
    created_posts: list[Post] = []

    with transaction.atomic():
        for row, row_idx in rows_iterator(worksheet, rows_range):
            row_values = get_values_dict(row)
            question_data = {}
            try:
                parent_url = get_raw_val(row, "parent_url")
                parent_post = get_parent_post(parent_url) if parent_url else None

                question_type = get_type(row_values)
                question_fields = list(common_fields)
                author = get_author(row_values)

                if question_type in [
                    Question.QuestionType.NUMERIC,
                    Question.QuestionType.DISCRETE,
                ]:
                    question_fields += numeric_q_fields

                if question_type == Question.QuestionType.MULTIPLE_CHOICE:
                    question_fields += multiple_choice_q_fields

                for field_name, field_get_value_fn in question_fields:
                    val = get_raw_val(row, field_name)

                    if val == ".p":
                        # .p is used to indicate that the field of the parent post should be used
                        if parent_post is None:
                            log_error(
                                f"Error on row {row_idx}, col '{field_name}': question has no parent, but '.p' was used for field"
                            )
                            continue
                        val = getattr(
                            parent_post.question or parent_post.group_of_questions,
                            field_name,
                        )
                    elif callable(field_get_value_fn):
                        val = field_get_value_fn(row_values)

                    question_data[field_name] = val
            except Exception as e:
                log_error(
                    f"Error on row {row_idx}{', col ' + field_name if field_name else ''}: {str(e)}"
                )
                rollback = True
                break

            question = Question(**question_data)
            question.cp_reveal_time = question.scheduled_close_time
            question.include_bots_in_aggregates = True
            question.save()

            post = Post(
                title=question.title,
                author=author,
                published_at=question.open_time,
                open_time=question.open_time,
                created_at=question.created_at,
                default_project=tournament,
                question=question,
                curation_status=Post.CurationStatus.APPROVED,
                scheduled_close_time=question.scheduled_close_time,
                scheduled_resolve_time=question.scheduled_resolve_time,
            )
            post.save()
            update_questions_post_relation(post)
            created_posts.append(post)
            log_info(
                f"   - added Question/Post [{question.title}] to {tournament.name}"
            )

        if rollback:
            transaction.set_rollback(True)
            log_info("****UNDO all actions, nothing was saved to the DB****")
    transaction_end_time = time.time()
    log_info(
        f"Total transaction time taken: {transaction_end_time - start_time:.2f} seconds"
    )

    if not rollback:
        for post in created_posts:
            run_post_indexing.send(post.id)
            trigger_update_post_translations(post)
    final_end_time = time.time()
    log_info(f"Total final time taken: {final_end_time - start_time:.2f} seconds")

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
    while row < end:
        batch = min(batch, end - row)
        rows = worksheet.get(f"A{row}:{MAX_COLUMN}{row+batch-1}", maintain_size=True)
        # range will not yield the last element in the range, while worksheet.get will, hence the
        # mismatch between the two here
        yield from zip(rows, range(row, row + batch))
        row += batch
