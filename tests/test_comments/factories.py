from django_dynamic_fixture import G

from comments.models import Comment
from posts.models import Post
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_comment(*, author: User = None, on_post: Post = None, **kwargs):
    return G(
        Comment,
        **setdefaults_not_null(
            kwargs,
            author=author,
            on_post=on_post,
        )
    )
