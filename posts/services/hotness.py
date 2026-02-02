import datetime
import logging
import time
from typing import Sequence

from django.db.models import Prefetch
from django.urls import reverse
from django.utils import timezone

from comments.models import Comment
from misc.models import PostArticle
from posts.models import Post, Vote, PostActivityBoost
from questions.constants import QuestionStatus, UnsuccessfulResolutionType
from questions.models import Question
from users.models import User
from utils.models import ModelBatchUpdater

logger = logging.getLogger(__name__)


def decay(val: float, dt: datetime.datetime) -> float:
    delta = (timezone.now() - dt).days

    if delta <= 3.5:
        return val

    return val * ((delta / 3.5) ** -2)


def _sum_components(subject, components):
    total = 0.0
    results = []
    for label, fn in components:
        res = fn(subject)
        if isinstance(res, Sequence):
            score, children = res
            results.append({"label": label, "score": score, "children": children})
        else:
            score = float(res)
            results.append({"label": label, "score": score})

        total += score

    return total, results


def _compute_question_hotness_movement(question: Question) -> float:
    return (
        20 * (question.movement or 0) if question.status == QuestionStatus.OPEN else 0
    )


def _compute_question_hotness_open_time(question: Question) -> float:
    return (
        decay(20, question.open_time)
        if question.open_time and timezone.now() > question.open_time
        else 0
    )


def _compute_question_hotness_resolution_time(question: Question) -> float:
    if (
        question.resolution_set_time
        and question.resolution
        and question.resolution not in UnsuccessfulResolutionType
    ):
        return decay(20, question.resolution_set_time)

    return 0


QUESTION_HOTNESS_COMPONENTS = [
    ("Movement Score", _compute_question_hotness_movement),
    ("Open Time Score", _compute_question_hotness_open_time),
    ("Resolution Time Score", _compute_question_hotness_resolution_time),
]


def compute_question_hotness(question: Question) -> float:
    return _sum_components(question, QUESTION_HOTNESS_COMPONENTS)[0]


#
# Post hotness calculations
#
def _compute_hotness_approval_score(post: Post) -> float:
    now = timezone.now()
    return (
        decay(20, post.published_at)
        if post.published_at and now > post.published_at
        else 0
    )


def _compute_hotness_relevant_news(post: Post) -> float:
    # Notebooks should not have news hotness score
    if post.notebook_id:
        return 0.0

    # Use prefetched postarticle_set if available, otherwise query
    post_articles = post.postarticle_set.all()

    return sum(
        decay(max(0, 0.5 - related_article.distance), related_article.created_at)
        for related_article in post_articles
    )


def _compute_hotness_post_votes(post: Post) -> float:
    votes = post.votes.all()

    return sum([decay(1 * x.direction, x.created_at) for x in votes])


def _compute_hotness_comments(post: Post) -> float:
    comments = post.comments.all()

    return sum([decay(2, c.created_at) for c in comments if not c.is_private])


def _compute_hotness_questions(post: Post) -> tuple[float, list]:
    questions = list(post.questions.all())
    if not questions:
        return 0.0, []

    evaluated = [
        (q, *_sum_components(q, QUESTION_HOTNESS_COMPONENTS)) for q in questions
    ]
    q_best, best_score, best_components = max(evaluated, key=lambda t: t[1])

    return best_score, [
        {
            "label": (
                f'<a href="{reverse("admin:questions_question_change", args=[q_best.id])}" target="_blank">'
                f"{q_best.title}"
                f"</a>"
            ),
            "score": best_score,
            "children": best_components,
        }
    ]


def compute_hotness_total_boosts(post: Post) -> float:
    boosts = post.activity_boosts.all()

    return sum([decay(x.score, x.created_at) for x in boosts])


POST_HOTNESS_COMPONENTS = [
    ("Approval score", _compute_hotness_approval_score),
    ("Relevant ITN news", _compute_hotness_relevant_news),
    ("Net post votes score", _compute_hotness_post_votes),
    ("Posted comments score", _compute_hotness_comments),
    ("Max subquestions score", _compute_hotness_questions),
    ("Total Boosts Score", compute_hotness_total_boosts),
]


def compute_post_hotness(post: Post) -> float:
    return _sum_components(post, POST_HOTNESS_COMPONENTS)[0]


def explain_post_hotness(post: Post):
    total, components = _sum_components(post, POST_HOTNESS_COMPONENTS)
    return {"hotness": total, "components": components}


def compute_feed_hotness():
    tm = time.time()
    # Minimum creation date of related objects — records created before
    # have negligible impact on calculations (since 1 / (2**(dT)) becomes a very small number),
    # so we can safely ignore them for performance reasons
    min_creation_date = timezone.now() - datetime.timedelta(days=70)

    qs = Post.objects.filter_published().prefetch_related(
        "questions",
        Prefetch(
            "votes",
            queryset=Vote.objects.filter(created_at__gte=min_creation_date).only(
                "id", "direction", "created_at", "post_id"
            ),
        ),
        Prefetch(
            "comments",
            queryset=Comment.objects.filter(
                created_at__gte=min_creation_date, is_private=False
            ).only("id", "created_at", "is_private", "on_post_id"),
        ),
        Prefetch(
            "activity_boosts",
            queryset=PostActivityBoost.objects.filter(
                created_at__gte=min_creation_date
            ).only("id", "score", "created_at", "post_id"),
        ),
        Prefetch(
            "postarticle_set",
            queryset=PostArticle.objects.filter(
                created_at__gte=min_creation_date
            ).only("id", "distance", "created_at", "post_id"),
        ),
    )
    total = qs.count()
    batch_size = 500

    logger.info(f"Start computing hotness for {total} posts")

    # Updating posts
    with ModelBatchUpdater(
        model_class=Post, fields=["hotness"], batch_size=batch_size
    ) as updater:
        for idx, post in enumerate(qs.iterator(chunk_size=batch_size)):
            post.hotness = compute_post_hotness(post)
            updater.append(post)

            if idx % batch_size == 0:
                logger.info(f"Generated hotness for {idx}/{total} posts")

    logger.info(f"Finished computing hotness in {round(time.time() - tm, 3)} seconds.")


def handle_post_boost(user: User, post: Post, direction: Vote.VoteDirection):
    if direction == Vote.VoteDirection.UP:
        top_post = (
            Post.objects.filter_projects(post.default_project)
            .order_by("-hotness")
            .first()
        )
        score = (top_post.hotness or 0) / 4 + 20
    else:
        score = -(post.hotness or 0) / 2 - 20

    obj = PostActivityBoost.objects.create(user=user, post=post, score=score)

    # Recalculate hotness for the given post
    post.hotness = compute_post_hotness(post)
    post.save(update_fields=["hotness"])

    return obj
