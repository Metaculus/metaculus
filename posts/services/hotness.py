import datetime
import logging
import time

from django.db.models import Sum, Max, Count, Prefetch
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
    hotness += decay(20, question.open_time) if now > question.open_time else 0

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

    return sum([decay(2 * x.direction, x.created_at) for x in votes])

    # TODO: could be replaced with prefetched votes
    stats = post.votes.aggregate(
        net_votes=Sum("direction"), last_vote_date=Max("created_at")
    )
    net_votes = stats["net_votes"] or 0
    last_vote_date = stats["last_vote_date"]

    return decay(net_votes, last_vote_date) if net_votes else 0


def _compute_hotness_comments(post: Post) -> float:
    # TODO: could be replaced with prefetched votes
    comments = post.comments.all()

    return sum([decay(2, c.created_at) for c in comments])

    stats = post.comments.aggregate(
        comments_count=Count("id"), last_comment_created_at=Max("created_at")
    )
    comments_count = stats["comments_count"] or 0
    last_comment_created_at = stats["last_comment_created_at"]

    return decay(2 * comments_count, last_comment_created_at) if comments_count else 0


def _compute_hotness_questions(post: Post) -> float:
    return max([compute_question_hotness(q) for q in post.get_questions()], default=0)


def compute_hotness_total_boosts(post: Post) -> float:
    # TODO: clear old hotness values!
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
    qs = (
        Post.objects.filter_published()
        .prefetch_questions()
        .prefetch_related(
            "votes",
            Prefetch("comments", queryset=Comment.objects.only("id", "created_at")),
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
