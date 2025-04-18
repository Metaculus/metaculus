import datetime
import logging
import time

from django.db.models import Prefetch
from django.utils import timezone

from comments.models import Comment
from posts.models import Post, Vote, PostActivityBoost
from questions.constants import QuestionStatus
from questions.models import Question
from users.models import User
from utils.models import ModelBatchUpdater

logger = logging.getLogger(__name__)


def decay(val: float, dt: datetime.datetime) -> float:
    return val / 2 ** ((timezone.now() - dt).days / 7)


def compute_question_hotness(question: Question) -> float:
    """
    Compute the hotness of post subquestion.
    """

    now = timezone.now()
    hotness = 0

    # Movement calculation for open questions
    hotness += (
        20 * (question.movement or 0) if question.status == QuestionStatus.OPEN else 0
    )

    # Open time
    hotness += (
        decay(20, question.open_time)
        if question.open_time and now > question.open_time
        else 0
    )

    # Resolution time
    hotness += (
        decay(20, question.resolution_set_time)
        if question.resolution_set_time and now > question.resolution_set_time
        else 0
    )

    return hotness


def _compute_hotness_approval_score(post: Post) -> float:
    now = timezone.now()
    return decay(20, post.published_at) if now > post.published_at else 0


def _compute_hotness_relevant_news(post: Post) -> float:
    # TODO: implement this
    return 0


def _compute_hotness_post_votes(post: Post) -> float:
    votes = post.votes.all()

    return sum([decay(1 * x.direction, x.created_at) for x in votes])


def _compute_hotness_comments(post: Post) -> float:
    comments = post.comments.all()

    return sum([decay(2, c.created_at) for c in comments if not c.is_private])


def _compute_hotness_questions(post: Post) -> float:
    return max([compute_question_hotness(q) for q in post.get_questions()], default=0)


def compute_hotness_total_boosts(post: Post) -> float:
    boosts = post.activity_boosts.all()

    return sum([decay(x.score, x.created_at) for x in boosts])


HOTNESS_COMPONENTS = [
    ("Approval score", _compute_hotness_approval_score),
    ("Relevant ITN news", _compute_hotness_relevant_news),
    ("Net post votes score", _compute_hotness_post_votes),
    ("Posted comments score", _compute_hotness_comments),
    ("Max subquestions score", _compute_hotness_questions),
    ("Total Boosts Score", compute_hotness_total_boosts),
]


def compute_post_hotness(post: Post) -> float:
    return sum([f(post) for _, f in HOTNESS_COMPONENTS])


def explain_post_hotness(post: Post):
    return {
        "hotness": compute_post_hotness(post),
        "components": [
            {"label": label, "score": f(post)} for label, f in HOTNESS_COMPONENTS
        ],
    }


def compute_feed_hotness():
    tm = time.time()
    # Minimum creation date of related objects — records created before
    # have negligible impact on calculations (since 1 / (2**(dT)) becomes a very small number),
    # so we can safely ignore them for performance reasons
    min_creation_date = timezone.now() - datetime.timedelta(days=70)

    qs = (
        Post.objects.filter_published()
        .prefetch_questions()
        .prefetch_related(
            Prefetch(
                "votes",
                queryset=Vote.objects.filter(created_at__gte=min_creation_date).only(
                    "id", "direction", "created_at"
                ),
            ),
            Prefetch(
                "comments",
                queryset=Comment.objects.filter(
                    created_at__gte=min_creation_date, is_private=False
                ).only("id", "created_at"),
            ),
        )
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
