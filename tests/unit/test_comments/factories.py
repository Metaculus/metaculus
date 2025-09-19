from django_dynamic_fixture import G

from comments.models import Comment, Driver, DriverVote
from posts.models import Post
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_comment(
    *,
    author: User = None,
    on_post: Post = None,
    is_soft_deleted: bool = False,
    **kwargs
):
    c = G(
        Comment,
        **setdefaults_not_null(
            kwargs, author=author, on_post=on_post, is_soft_deleted=is_soft_deleted
        )
    )

    if on_post:
        on_post.update_comment_count()

    return c


def factory_key_factor(
    *, comment: Comment = None, votes: dict[User, int] = None, vote_type: DriverVote.VoteType = None, **kwargs
) -> Driver:
    votes = votes or {}
    cf = G(Driver, **setdefaults_not_null(kwargs, comment=comment))

    for user, score in votes.items():
        DriverVote.objects.create(key_factor=cf, score=score, user=user, vote_type=vote_type)

    return cf
