from comments.models import Comment
from questions.models import Forecast
from migrator.utils import paginated_query
from posts.models import Post


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
        # created_at is failing, all comments are being given the time the migration is ran
        created_at=comment_obj["created_time"],
        is_soft_deleted=comment_obj["deleted"],
        text=comment_obj["comment_text"],
        on_post_id=comment_obj["question_id"],
        included_forecast=forecast_id,
        is_private=is_private,
    )

    return comment


def migrate_comments():
    comments = []
    for comment in paginated_query(
        """
        SELECT c.*
        FROM metac_question_comment c
        where c.author_id is not null
        and c.id is not null
        order by c.id
        ;"""
    ):
        # probably would be faster in sql but ran into issues
        if Post.objects.filter(id=comment["question_id"]).exists():
            comments.append(create_comment(comment))

    Comment.objects.bulk_create(comments)
