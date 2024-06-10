from comments.models import Comment, CommentType
from migrator.utils import paginated_query
from posts.models import Post


def create_comment(comment_obj: dict) -> Comment:
    if comment_obj["submit_type"] == "Q":
        comment_type = CommentType.FEEDBACK
    elif comment_obj["submit_type"] == "Z":
        comment_type = CommentType.RESOLUTION
    elif comment_obj["submit_type"] == "N":
        comment_type = CommentType.PRIVATE
    else:
        comment_type = CommentType.GENERAL

    comment = Comment(
        id=comment_obj["id"],
        author_id=comment_obj["author_id"],
        parent_id=comment_obj["parent_id"],
        created_at=comment_obj["created_time"],
        is_soft_deleted=comment_obj["deleted"],
        text=comment_obj["comment_text"],
        on_post_id=comment_obj["question_id"],
        type=comment_type,
        # migrating forecast data is going to be... hard
        # but can be skipped at the moment?
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
