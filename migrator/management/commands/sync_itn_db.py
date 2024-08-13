from django.core.management.base import BaseCommand

from misc.services.itn import (
    generate_post_article_relations,
)
from posts.models import Post


class Command(BaseCommand):
    help = "Fetch the latest text for each aid from the articletext table"

    def handle(self, *args, **kwargs):
        # sync_itn_news()
        # generate_embedding_vectors()
        generate_post_article_relations(Post.objects.all())
