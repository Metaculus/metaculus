from migrator.utils import paginated_query
from posts.models import Vote, Post
from django.utils import timezone


def create_vote(vote_obj, direction: int):
    return Vote(
        user_id=vote_obj["user_id"],
        post_id=vote_obj["question_id"],
        direction=direction,
    )


def migrate_votes():
    post_ids = Post.objects.values_list("id", flat=True)
    start = timezone.now()
    vote_instances = []

    # Migrating Upvotes
    for i, obj in enumerate(
        paginated_query("SELECT * FROM metac_question_question_votes_up"), 1
    ):
        print(
            f"\033[Kmigrating upvotes: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if obj["question_id"] in post_ids:
            vote_instances.append(create_vote(obj, 1))
    print(
        f"\033[Kmigrating upvotes: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
    )

    # Migrating Downvotes
    for i, obj in enumerate(
        paginated_query("SELECT * FROM metac_question_question_votes_down"), 1
    ):
        print(
            f"\033[Kmigrating downvotes: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if obj["question_id"] in post_ids:
            vote_instances.append(create_vote(obj, -1))
    print(
        f"\033[Kmigrating downvotes: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
    )

    print("bulk creating...", end="\r")
    Vote.objects.bulk_create(vote_instances, ignore_conflicts=True)
    print("bulk creating... DONE")
