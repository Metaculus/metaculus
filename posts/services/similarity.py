from django.db.models import QuerySet
from pgvector.django import CosineDistance

from posts.models import Post


def qs_filter_similar_posts(qs: QuerySet[Post], post: Post):
    # TODO: deprecate old ones
    # TODO: check similar_ids usage

    return (
        qs.annotate(rank=1 - CosineDistance("embedding_vector", post.embedding_vector))
        .filter(rank__isnull=False)
        .exclude(pk=post.pk)
    )
