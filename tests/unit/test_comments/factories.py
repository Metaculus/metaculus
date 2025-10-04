from django_dynamic_fixture import G

from comments.models import Comment, KeyFactor, KeyFactorVote
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
    *,
    comment: Comment = None,
    votes: dict[User, int] = None,
    vote_type: KeyFactorVote.VoteType = None,
    **kwargs
) -> KeyFactor:
    votes = votes or {}
    cf = G(KeyFactor, **setdefaults_not_null(kwargs, comment=comment))

    for user, score in votes.items():
        KeyFactorVote.objects.create(
            key_factor=cf, score=score, user=user, vote_type=vote_type
        )

    return cf
