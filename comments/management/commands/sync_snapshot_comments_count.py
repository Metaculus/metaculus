from django.core.management.base import BaseCommand
from django.db.models import Count, Subquery, OuterRef
from django.db.models.functions import Coalesce

from comments.models import Comment
from posts.models import PostUserSnapshot


BATCH_SIZE = 5000


class Command(BaseCommand):
    help = "Sync PostUserSnapshot.comments_count to match actual comment counts at viewed_at"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only report mismatches without updating",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        correct_count = Coalesce(
            Subquery(
                Comment.objects.filter(
                    on_post_id=OuterRef("post_id"),
                    is_private=False,
                    is_soft_deleted=False,
                    created_at__lte=OuterRef("viewed_at"),
                )
                .order_by()
                .values("on_post_id")
                .annotate(cnt=Count("id"))
                .values("cnt")
            ),
            0,
        )

        total = PostUserSnapshot.objects.count()
        processed = 0
        updated = 0
        batch = []

        for pk in PostUserSnapshot.objects.values_list("pk", flat=True).iterator(
            chunk_size=BATCH_SIZE
        ):
            batch.append(pk)
            if len(batch) >= BATCH_SIZE:
                if not dry_run:
                    updated += PostUserSnapshot.objects.filter(
                        pk__in=batch
                    ).update(comments_count=correct_count)
                processed += len(batch)
                batch = []
                if processed % 50000 == 0:
                    self.stdout.write(f"  processed {processed}/{total}...")

        if batch:
            if not dry_run:
                updated += PostUserSnapshot.objects.filter(pk__in=batch).update(
                    comments_count=correct_count
                )
            processed += len(batch)

        self.stdout.write(
            f"\nDone. Total: {total}, processed: {processed}, "
            f"updated: {updated}{' (dry-run)' if dry_run else ''}"
        )
