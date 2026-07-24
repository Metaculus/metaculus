import datetime
import logging
import math
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

# Only articles closer than this (cosine distance) contribute to news hotness.
# Deliberately tighter than misc.services.itn.MAX_RELEVANT_DISTANCE (0.5, the
# threshold for storing a match at all) so that the long tail of loosely related
# articles no longer props up broad, high-volume-topic questions.
NEWS_RELEVANCE_THRESHOLD = 0.42


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
        decay(10, question.open_time)
        if question.open_time and timezone.now() > question.open_time
        else 0
    )


def _compute_question_hotness_cp_reveal_time(question: Question) -> float:
    return (
        decay(20, question.cp_reveal_time)
        if question.cp_reveal_time and timezone.now() > question.cp_reveal_time
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
    ("CP Reveal Time Score", _compute_question_hotness_cp_reveal_time),
    ("Resolution Time Score", _compute_question_hotness_resolution_time),
]


def compute_question_hotness(question: Question) -> float:
    return _sum_components(question, QUESTION_HOTNESS_COMPONENTS)[0]


#
# Post hotness calculations
#
def _news_article_weight(distance: float, post_count: int) -> float:
    """Per-article contribution to news hotness, before time decay.

    Combines two signals:
    - Relevance: linearly rewards closeness, and is zero at/beyond
      NEWS_RELEVANCE_THRESHOLD so loose matches don't accumulate.
    - Breadth penalty (inverse document frequency): a generic article matched to
      many posts is discounted, so a question can't rank highly just by matching
      every article in a busy news topic.
    """
    relevance = max(0.0, NEWS_RELEVANCE_THRESHOLD - distance)
    if relevance <= 0:
        return 0.0

    return relevance / math.log(math.e + (post_count or 0))


def _compute_hotness_relevant_news(post: Post) -> float:
    # Notebooks should not have news hotness score
    if post.notebook_id:
        return 0.0

    # Diminishing returns for repeated coverage of the same story: keep only the
    # single strongest (time-decayed, breadth-penalized) contribution per
    # near-duplicate article cluster, then sum across clusters.
    best_by_cluster: dict[int, float] = {}
    for post_article in post.postarticle_set.all():
        article = post_article.article
        weight = _news_article_weight(post_article.distance, article.post_count)
        if weight <= 0:
            continue

        contribution = decay(weight, post_article.created_at)
        cluster = article.cluster_id or article.id
        best_by_cluster[cluster] = max(best_by_cluster.get(cluster, 0.0), contribution)

    return sum(best_by_cluster.values())


def explain_post_news_hotness(post: Post) -> dict:
    """Per-matched-article breakdown of a post's "In the news" hotness, for admin
    inspection.

    Mirrors ``_compute_hotness_relevant_news``: each matched article contributes
    ``max(0, NEWS_RELEVANCE_THRESHOLD - distance) / ln(e + post_count)``, time
    decayed by age, and near-duplicate articles (sharing a ``cluster_id``) collapse
    to their single strongest contribution. ``counts_towards_score`` flags the one
    article per cluster that actually feeds the total.
    """
    articles = []
    for post_article in post.postarticle_set.select_related("article").defer(
        "article__embedding_vector"
    ):
        article = post_article.article
        relevance = max(0.0, NEWS_RELEVANCE_THRESHOLD - post_article.distance)
        breadth_penalty = math.log(math.e + (article.post_count or 0))
        weight = relevance / breadth_penalty if relevance > 0 else 0.0
        contribution = decay(weight, post_article.created_at) if weight > 0 else 0.0
        articles.append(
            {
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "media_label": article.media_label,
                "created_at": post_article.created_at,
                "distance": post_article.distance,
                "post_count": article.post_count,
                "cluster_id": article.cluster_id or article.id,
                "relevance": relevance,
                "weight": weight,
                "contribution": contribution,
            }
        )

    # Strongest contribution first; within each cluster only the top one counts.
    articles.sort(key=lambda a: a["contribution"], reverse=True)
    counted_clusters: set[int] = set()
    for article in articles:
        counts = (
            article["contribution"] > 0
            and article["cluster_id"] not in counted_clusters
        )
        article["counts_towards_score"] = counts
        if counts:
            counted_clusters.add(article["cluster_id"])

    total = sum(a["contribution"] for a in articles if a["counts_towards_score"])

    return {"news_hotness": total, "articles": articles}


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
            queryset=PostArticle.objects.filter(created_at__gte=min_creation_date)
            .select_related("article")
            .only(
                "id",
                "distance",
                "created_at",
                "post_id",
                # Article fields needed for clustering / breadth penalty. Note we
                # intentionally avoid loading the large `embedding_vector`.
                "article__id",
                "article__cluster_id",
                "article__post_count",
            ),
        ),
    )
    total = qs.count()
    batch_size = 500

    logger.info(f"Start computing hotness for {total} posts")

    # Updating posts
    with ModelBatchUpdater(
        model_class=Post, fields=["hotness", "news_hotness"], batch_size=batch_size
    ) as updater:
        for idx, post in enumerate(qs.iterator(chunk_size=batch_size)):
            post.hotness = compute_post_hotness(post)
            post.news_hotness = _compute_hotness_relevant_news(post)
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
