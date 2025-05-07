import re
from datetime import timedelta

from django.utils import timezone

from questions.models import Question


def get_question_group_title(title: str) -> str:
    """
    Extracts name from question of group.

    E.g. Long Question Title? (Option A) -> Option A
    """

    matches = re.findall(r"\((?:[^()]*|\([^()]*\))*\)", title)
    return matches[-1][1:-1] if matches else title


def get_question_movement_period(question: Question):
    if timezone.now() - question.open_time < timedelta(hours=24):
        return timedelta(hours=1)

    if timezone.now() - question.open_time < timedelta(days=7):
        return timedelta(hours=24)

    return timedelta(days=7)
