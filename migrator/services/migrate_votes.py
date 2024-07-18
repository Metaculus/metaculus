from migrator.utils import paginated_query
from posts.models import Vote, Post


def create_vote(vote_obj, direction: int):
    return Vote(
        user_id=vote_obj["user_id"],
        post_id=vote_obj["question_id"],
        direction=direction,
        created_at=vote_obj["created_at"],
    )


def migrate_votes():
    post_ids = Post.objects.values_list("id", flat=True)
    vote_instances = []

    # Migrating Upvotes
    vote_instances += [
        create_vote(obj, 1)
        for obj in paginated_query(
            "SELECT * FROM metac_question_question_votes_up",
        )
        if obj["question_id"] in post_ids
    ]

    # Migrating Downvotes
    vote_instances += [
        create_vote(obj, -1)
        for obj in paginated_query(
            "SELECT * FROM metac_question_question_votes_down",
        )
        if obj["question_id"] in post_ids
    ]

    Vote.objects.bulk_create(vote_instances, ignore_conflicts=True)
