from migrator.utils import paginated_query
from questions.models import Question, Vote


def create_vote(vote_obj, direction: int):
    return Vote(
        user_id=vote_obj["user_id"],
        question_id=vote_obj["question_id"],
        direction=direction,
    )


def migrate_votes():
    question_ids = Question.objects.values_list("id", flat=True)
    vote_instances = []

    # Migrating Upvotes
    vote_instances += [
        create_vote(obj, 1)
        for obj in paginated_query(
            "SELECT * FROM metac_question_question_votes_up",
        )
        if obj["question_id"] in question_ids
    ]

    # Migrating Downvotes
    vote_instances += [
        create_vote(obj, -1)
        for obj in paginated_query(
            "SELECT * FROM metac_question_question_votes_down",
        )
        if obj["question_id"] in question_ids
    ]

    Vote.objects.bulk_create(vote_instances, ignore_conflicts=True)
