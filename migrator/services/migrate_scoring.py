import dramatiq
import numpy as np

from django.db.models import Q
from django.utils import timezone

from migrator.services.migrate_leaderboards import populate_project_leaderboards
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
            | Q(group__post__default_project__primary_leaderboard__score_type=rltst)
            | Q(conditional_yes__post__projects__primary_leaderboard__score_type=rltst)
            | Q(
                conditional_yes__post__default_project__primary_leaderboard__score_type=rltst
            )
            | Q(conditional_no__post__projects__primary_leaderboard__score_type=rltst)
            | Q(
                conditional_no__post__default_project__primary_leaderboard__score_type=rltst
            ),
            resolution__isnull=False,
        )
        .exclude(resolution__in=["ambiguous", "annulled"])
        .distinct()
    )
    question_dict = {q.id: q for q in questions}

    query_string = "SELECT * FROM metac_question_comboprediction"

    archived_scores = []
    start = timezone.now()
    for i, comboprediction in enumerate(paginated_query(query_string), 1):
        print(
            f"\033[Kmigrating archived scores: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if (comboprediction["question_id"] not in question_dict) or (
            comboprediction["log_score"] is None
        ):
            continue
        question = question_dict[comboprediction["question_id"]]
        score = np.log(2 ** comboprediction["log_score"])

        archived_scores.append(
            ArchivedScore(
                question_id=comboprediction["question_id"],
                user_id=comboprediction["user_id"],
                score=score,
                coverage=comboprediction["coverage"],
                created_at=question.resolution_set_time,
                edited_at=question.resolution_set_time,
                score_type=Score.ScoreTypes.RELATIVE_LEGACY,
            )
        )
    print(
        f"\033[Kmigrating archived scores: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating...",
        end="\r",
    )
    ArchivedScore.objects.all().delete()
    ArchivedScore.objects.bulk_create(archived_scores)
    print(
        f"\033[Kmigrating archived scores: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating... DONE",
    )


def score_questions(qty: int | None = None, start_id: int = 0):
    questions = (
        Question.objects.filter(
            resolution__isnull=False,
            id__gte=start_id,
        )
        .exclude(
            resolution__in=["ambiguous", "annulled"],
        )
        .order_by("id")
    )
    if qty:
        questions = questions.order_by("?")[:qty]
    c = len(questions)
    rltst = Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT
    question_ids_to_relative_score: set[int] = set(
        Question.objects.filter(
            Q(post__projects__primary_leaderboard__score_type=rltst)
            | Q(post__default_project__primary_leaderboard__score_type=rltst)
            | Q(group__post__projects__primary_leaderboard__score_type=rltst)
            | Q(group__post__default_project__primary_leaderboard__score_type=rltst),
            resolution__isnull=True,
        )
        .distinct()
        .values_list("id", flat=True)
    )
    question: Question
    start = timezone.now()
    for i, question in enumerate(questions, 1):
        score_types = [
            Score.ScoreTypes.PEER,
            Score.ScoreTypes.BASELINE,
            Score.ScoreTypes.SPOT_PEER,
        ]
        if question.id in question_ids_to_relative_score:
            score_types.append(Score.ScoreTypes.RELATIVE_LEGACY)
        f = question.user_forecasts.count()
        print(
            f"\033[Kscoring question {i:>4}/{c} ID:{question.id:<4} forecasts:{f:<4} "
            f"dur:{str(timezone.now() - start).split('.')[0]} "
            f"remaining:{str((timezone.now() - start) / i * (c - i)).split(".")[0]} "
            f"scoring: {','.join(score_types)}...",
            end="\r",
        )
        score_question(
            question=question,
            resolution=question.resolution,
            score_types=score_types,
        )
    print(
        f"\033[Kscoring question {i:>4}/{c} ID:{question.id:<4} forecasts:{f:<4} "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        f"remaining:{str((timezone.now() - start) / i * (c - i)).split(".")[0]} "
        f"scoring: {','.join(score_types)}... DONE",
    )


@dramatiq.actor
def populate_project_leaderboards_async():
    populate_project_leaderboards()
