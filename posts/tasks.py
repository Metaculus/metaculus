import dramatiq

from posts.models import Post, PostUserSnapshot
from posts.services import compute_divergence


@dramatiq.actor
def run_compute_divergence(post_id):
    """
    TODO: ensure tasks of this group are executed consequent and keep the FIFO order
        and implement a cancellation of previous task with the same type
    """

    post = Post.objects.get(pk=post_id)

    divergence = compute_divergence(post)

    snapshots = PostUserSnapshot.objects.filter(
        post=post, user_id__in=divergence.keys()
    )

    bulk_update = []

    for user_snapshot in snapshots:
        div = divergence.get(user_snapshot.user_id)

        if div is not None:
            user_snapshot.divergence = div
            bulk_update.append(user_snapshot)

    PostUserSnapshot.objects.bulk_update(bulk_update, fields=["divergence"])
