from comments.models import Comment, CommentVote
from migrator.utils import paginated_query
from posts.models import Post
from questions.models import Forecast
from django.utils import timezone


def create_comment_vote(vote_obj):
    return CommentVote(
        user_id=vote_obj["user_id"],
        comment_id=vote_obj["comment_id"],
        direction=vote_obj["value"],
        created_at=vote_obj["created_at"],
    )


def create_comment(comment_obj: dict) -> Comment:
    is_private = False
    if comment_obj["submit_type"] == "N":
        is_private = True

    forecast_id = None

    if (
        comment_obj["prediction_value"] is not None
        or comment_obj["latest_prediction"] is not None
    ):
        forecasts = Forecast.objects.filter(
            author_id=comment_obj["author_id"],
            question_id=comment_obj["question_id"],
            start_time__lte=comment_obj["created_time"],
        ).order_by("-start_time")
        forecast_id = forecasts.first()

    comment = Comment(
        id=comment_obj["id"],
        author_id=comment_obj["author_id"],
        parent_id=comment_obj["parent_id"],
        # Originally, metaculus had only 1 level of nesting
        root_id=comment_obj["parent_id"],
        created_at=comment_obj["created_time"],
        is_soft_deleted=comment_obj["deleted"],
        text=comment_obj["comment_text"],
        on_post_id=comment_obj["question_id"],
        included_forecast=forecast_id,
        is_private=is_private,
    )

    return comment


def migrate_comment_votes():
    comment_ids = Comment.objects.values_list("id", flat=True)
    vote_instances = []

    start = timezone.now()
    for i, obj in enumerate(
        paginated_query("SELECT * FROM metac_question_comment_likes"), 1
    ):
        print(
            f"\033[Kmigrating comment votes: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if obj["comment_id"] in comment_ids:
            vote_instances.append(create_comment_vote(obj))

    print(
        f"\033[Kmigrating comment votes: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
        "bulk creating...",
        end="\r",
    )
    CommentVote.objects.bulk_create(
        vote_instances, ignore_conflicts=True, batch_size=1_000
    )
    print(
        f"\033[Kmigrating comment votes: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
        "bulk creating... DONE",
    )


def migrate_comments():
    comments = []
    post_ids = Post.objects.values_list("id", flat=True)

    start = timezone.now()
    for i, comment in enumerate(
        paginated_query(
            """
        SELECT c.*
        FROM metac_question_comment c
        where c.author_id is not null
        and c.id is not null
        order by c.id
        ;"""
        ),
        1,
    ):
        print(
            f"\033[Kmigrating comments: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if comment["question_id"] in post_ids:
            comments.append(create_comment(comment))
    print(
        f"\033[Kmigrating comments: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
    )

    print("bulk creating...", end="\r")
    Comment.objects.bulk_create(comments)
    print("bulk creating... DONE")
