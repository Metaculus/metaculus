import logging
import re

from django.db.models import F, QuerySet
from django.db.models import OuterRef, Count, Subquery, IntegerField, Value
from django.db.models.aggregates import Max
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from comments.models import Comment
from posts.models import PostUserSnapshot, Post
from questions.models import Question

logger = logging.getLogger(__name__)


def sync_comment_counters(qs: QuerySet[PostUserSnapshot]):
    comments_subquery = (
        Comment.objects.filter(
            on_post_id=OuterRef("post_id"), created_at__lte=OuterRef("viewed_at")
        )
        .values("on_post_id")
        .annotate(count=Count("id"))
        .values("count")
    )

    qs.update(
        comments_count=Coalesce(
            Subquery(comments_subquery, output_field=IntegerField()), Value(0)
        )
    )


def normalize_comment_edition_date(comments_qs: QuerySet):
    comments_qs.update(
        edited_at=F("created_at"),
        text_edited_at=Coalesce(
            SubqueryAggregate("commentdiff__created_at", aggregate=Max), F("created_at")
        ),
    )


def sync_post_counters(qs: QuerySet[Post]):
    # Recalculate cache
    for post in qs:
        post.update_pseudo_materialized_fields()
        post.update_forecasts_count()
        post.update_forecasters_count()
        post.update_vote_score()
        post.update_comment_count()


def extract_last_first_level(s: str) -> str | None:
    """
    Return the content of the last top‐level parentheses pair in s.
    If there’s an unmatched '(', captures up to the end of the string.
    Returns None if no such capture contains at least one letter or digit.
    """
    level = 0
    groups = []
    start = None

    for i, ch in enumerate(s):
        if ch == "(":
            if level == 0:
                # potential start of a first‐level group
                start = i + 1
            level += 1
        elif ch == ")":
            if level == 1 and start is not None:
                # closing a first‐level group
                groups.append(s[start:i])
                start = None
            level = max(level - 1, 0)

    # if the last '(' was never closed, capture up to end
    if start is not None:
        groups.append(s[start:])

    # pick the last group that has at least one alphanumeric character
    for content in reversed(groups):
        if re.search(r"\w", content):
            return content

    return None


def extract_label_from_question(question: Question):
    return extract_last_first_level(question.title) or question.title
