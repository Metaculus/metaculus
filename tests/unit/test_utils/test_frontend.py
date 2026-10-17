from posts.models import Post
from utils.frontend import build_post_comment_url


def test_build_post_comment_url(settings):
    settings.PUBLIC_APP_URL = "https://example.com"

    assert (
        build_post_comment_url(Post(id=1, title="Will it rain?"), 42)
        == "https://example.com/questions/1/will-it-rain/#comment-42"
    )
    assert (
        build_post_comment_url(Post(id=2, title="Notes", notebook_id=5), 7)
        == "https://example.com/notebooks/2/notes/#comment-7"
    )
