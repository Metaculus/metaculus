from django_dynamic_fixture import G

from comments.models import Comment
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
    return G(
        Comment,
        **setdefaults_not_null(
            kwargs, author=author, on_post=on_post, is_soft_deleted=is_soft_deleted
        )
    )
