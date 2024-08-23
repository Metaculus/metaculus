from django.db.models import Q

from questions.models import Question
from scoring.utils import score_question
from scoring.models import Score, ArchivedScore, Leaderboard
from migrator.utils import paginated_query


def migrate_archived_scores():
    rltst = Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT
    questions = (
        Question.objects.filter(
            Q(post__projects__primary_leaderboard__score_type=rltst)
            | Q(post__default_project__primary_leaderboard__score_type=rltst)
            | Q(group__post__projects__primary_leaderboard__score_type=rltst)
            | Q(group__post__default_project__primary_leaderboard__score_type=rltst),
            resolution__isnull=False,
        )
        .exclude(resolution__in=["ambiguous", "annulled"])
        .distinct()
    )
    question_dict = {q.id: q for q in questions}

    query_string = "SELECT * FROM metac_question_comboprediction"

    archived_scores = []
    for comboprediction in paginated_query(query_string):
        if (comboprediction["question_id"] not in question_dict) or (
            comboprediction["log_score"] is None
        ):
            continue
        question = question_dict[comboprediction["question_id"]]
        archived_scores.append(
            ArchivedScore(
                question_id=comboprediction["question_id"],
                user_id=comboprediction["user_id"],
                score=comboprediction["log_score"],
                coverage=comboprediction["coverage"],
                created_at=question.resolution_set_time,
                edited_at=question.resolution_set_time,
            )
        )
    ArchivedScore.objects.delete()
    ArchivedScore.objects.bulk_create(archived_scores)


def score_questions(qty: int | None = None):
    questions = Question.objects.filter(
        resolution__isnull=False,
    ).exclude(
        resolution__in=["ambiguous", "annulled"],
    )
    if qty:
        questions = questions.order_by("?")[:qty]
    c = len(questions)
    question: Question
    for i, question in enumerate(questions, 1):
        if question.resolution and not question.forecast_scoring_ends:
            print(
                question.forecast_scoring_ends,
                question.resolution,
                question.get_post().title,
                question.get_post().id,
            )
            print("Resolved q with no resolved time")
            exit()
        try:
            score_question(
                question,
                question.resolution,
                # TODO: add spot_forecast_time
                score_types=[
                    Score.ScoreTypes.PEER,
                    Score.ScoreTypes.BASELINE,
                    Score.ScoreTypes.RELATIVE_LEGACY,
                ],
            )
            print("scored question", i, "/", c, "ID:", question.id, end="\r")
        except Exception as e:
            if "ambiguous or annulled" in str(e):
                pass
            else:
                raise e
