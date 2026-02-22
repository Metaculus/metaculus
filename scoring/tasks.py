import logging
from collections import defaultdict
from datetime import datetime, timezone as dt_timezone

import dramatiq
from django.db.models import QuerySet

from posts.models import Post
from projects.models import Project
from questions.constants import UnsuccessfulResolutionType
from questions.models import Question
from scoring.constants import LeaderboardScoreTypes, ScoreTypes
from scoring.management.commands.update_coherence_tournament_leaderboard import (
    Command as UpdateCoherenceTournamentLeaderboardCommand,
)
from scoring.models import Leaderboard, Score
from scoring.score_math import evaluate_question
from scoring.utils import (
    generate_entries_from_scores,
    process_entries_for_leaderboard_,
    get_cached_metaculus_stats,
)

logger = logging.getLogger(__name__)


def calculate_minimum_time_scores(
    questions: QuerySet[Question],
    minimum_time: datetime,
    score_type: ScoreTypes = ScoreTypes.PEER,
) -> list[Score]:
    scores: list[Score] = []

    c = questions.count()
    i = 0
    for question in questions:
        i += 1
        logger.info(f"Processing question {i}/{c} (ID: {question.id})")
        if question.open_time >= minimum_time:
            scores.extend(question.scores.filter(score_type=score_type))
            continue
        question.open_time = minimum_time
        # simulate scores as if question open_time was minimum_time
        new_scores = evaluate_question(
            question=question,
            resolution=question.resolution,
            score_types=[score_type],
        )
        scores.extend(new_scores)

    return scores


def calculate_spot_times_scores(
    questions: QuerySet[Question],
    spot_times: list[datetime],
    score_type: ScoreTypes = ScoreTypes.SPOT_PEER,
) -> list[Score]:
    scores: list[Score] = []

    c = questions.count()
    i = 0
    for question in questions:
        i += 1
        logger.info(f"Processing question {i}/{c} (ID: {question.id})")
        question_scores: list[Score] = []
        for spot_time in spot_times:
            # simulate scores as if question spot_scoring_time was spot_time
            new_scores = evaluate_question(
                question=question,
                resolution=question.resolution,
                score_types=[score_type],
                spot_forecast_time=spot_time,
            )
            question_scores.extend(new_scores)
        user_score_map = defaultdict(list)
        for score in question_scores:
            user_score_map[(score.user_id, score.aggregation_method)].append(
                score.score
            )
        for (user_id, aggregation_method), user_scores in user_score_map.items():
            scores.append(
                Score(
                    user_id=user_id,
                    aggregation_method=aggregation_method,
                    score=sum(user_scores) / len(spot_times),
                    score_type=score_type,
                    question=question,
                    coverage=len(user_scores) / len(spot_times),
                )
            )

    return scores


@dramatiq.actor
def update_custom_leaderboard(
    project_id: int,
    minimum_timestamp: float | None = None,
    spot_timestamps: list[float] | None = None,
    score_type: ScoreTypes = ScoreTypes.PEER,
) -> None:
    project = Project.objects.filter(id=project_id).first()
    if not project:
        logger.error(f"Project with id {project_id} does not exist.")
        return
    if bool(minimum_timestamp) == bool(spot_timestamps):
        logger.error("minimum_time or spot_times must be provided, but not both.")
        return

    minimum_time = (
        datetime.fromtimestamp(minimum_timestamp, tz=dt_timezone.utc)
        if minimum_timestamp
        else None
    )
    spot_times = (
        [datetime.fromtimestamp(t, tz=dt_timezone.utc) for t in spot_timestamps]
        if spot_timestamps
        else None
    )
    # setup
    name = (
        f"Set open_time for {project.name} at {minimum_time}"
        if minimum_time
        else (f"Spot time for {project.name} at {len(spot_times)} spot times")
    )
    leaderboard, _ = Leaderboard.objects.get_or_create(
        prize_pool=0,
        name=name,
        project=project,
        score_type=LeaderboardScoreTypes.MANUAL,
    )
    questions = (
        leaderboard.get_questions()
        .filter(
            post__curation_status=Post.CurationStatus.APPROVED,
            resolution__isnull=False,
        )
        .exclude(resolution__in=UnsuccessfulResolutionType)
    )
    if not questions.exists():
        logger.info(f"No resolved questions found for project {project.name}.")
        return
    # detect if any questions actually resolved since last evaluation
    existing_entries = leaderboard.entries.all()
    if existing_entries.exists():
        last_evaluation_time = max(
            entry.calculated_on for entry in existing_entries if entry.calculated_on
        )
        newly_resolved_questions = questions.filter(
            resolution_set_time__gt=last_evaluation_time
        )
        if not newly_resolved_questions.exists():
            logger.info(
                "No questions resolved since last evaluation "
                f"at {last_evaluation_time}, skipping leaderboard update."
            )
            return

    if minimum_time:
        scores = calculate_minimum_time_scores(questions, minimum_time, score_type)

    if spot_times:
        if score_type == ScoreTypes.PEER:
            score_type = ScoreTypes.SPOT_PEER
        if score_type == ScoreTypes.BASELINE:
            score_type = ScoreTypes.SPOT_BASELINE
        scores = calculate_spot_times_scores(questions, spot_times, score_type)

    # temporarily change leaderboard type for entry creation
    if score_type in [ScoreTypes.PEER, ScoreTypes.SPOT_PEER]:
        leaderboard.score_type = LeaderboardScoreTypes.PEER_TOURNAMENT
    elif score_type in [ScoreTypes.BASELINE, ScoreTypes.SPOT_BASELINE]:
        leaderboard.score_type = LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT
    else:
        leaderboard.score_type = score_type
    new_entries = generate_entries_from_scores(scores, questions, leaderboard)
    leaderboard.score_type = LeaderboardScoreTypes.MANUAL

    process_entries_for_leaderboard_(
        new_entries, project, leaderboard, force_finalize=False
    )

    logger.info(f"Updated leaderboard: {leaderboard.name} with id {leaderboard.id}")
    return


@dramatiq.actor
def update_coherence_spring_2026_cup() -> None:
    UpdateCoherenceTournamentLeaderboardCommand().handle()


@dramatiq.actor
def warm_cache_metaculus_stats() -> None:
    get_cached_metaculus_stats.refresh_cache()
