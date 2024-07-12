from django.core.management import call_command
from django.db.models import Q

from posts.models import Post
from posts.tasks import run_compute_sorting_divergence


def post_migrate_calculate_divergence():
    print("Running calculate_divergence")

    posts = (
        Post.objects.filter_active()
        .filter(
            Q(question__isnull=False)
            | Q(group_of_questions__isnull=False)
            | Q(conditional__isnull=False)
        )
        .prefetch_questions()
    )
    posts_total = posts.count()

    for idx, post in enumerate(posts.iterator(chunk_size=100)):
        run_compute_sorting_divergence(post.id)

        if not idx % 250:
            print(f"Processed {idx + 1}/{posts_total} posts")

    print("Finished calculate_divergence")


def post_migrate_movements():
    print("Running compute_movement")

    call_command("compute_movement")

    print("Finished compute_movement")
