from django.core.management.base import BaseCommand

from misc.services.itn import sync_itn_news, sync_itn_news___tmp


class Command(BaseCommand):
    help = "Fetch the latest text for each aid from the articletext table"

    def handle(self, *args, **kwargs):
        sync_itn_news___tmp()
        # generate_embedding_vectors()
        # generate_post_article_relations(Post.objects.all())
