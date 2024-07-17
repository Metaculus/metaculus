from collections import defaultdict
from datetime import datetime, timedelta
from dataclasses import dataclass

from django.utils import timezone
from django.db.models import QuerySet, Q

from comments.models import Comment
from users.models import User
from projects.models import Project
from questions.models import Question
from scoring.models import Score, LeaderboardEntry, Leaderboard, MedalExclusionRecord
from scoring.score_math import evaluate_question
from utils.the_math.formulas import string_location_to_bucket_index


def score_question(
    question: Question,
    resolution: str,
    spot_forecast_time: datetime | None = None,
    score_types: list[str] | None = None,
):
    resolution_bucket = string_location_to_bucket_index(resolution, question)
    score_types = score_types or Score.ScoreTypes.choices
    for score_type in score_types:
        seen = set()
        previous_scores = list(
            Score.objects.filter(question=question, score_type=score_type)
        )
        new_scores = evaluate_question(
            question, resolution_bucket, score_type, spot_forecast_time
        )
        for new_score in new_scores:
            is_new = True
            for previous_score in previous_scores:
                if previous_score.user == new_score.user:
                    is_new = False
                    previous_score.score = new_score.score
                    previous_score.coverage = new_score.coverage
                    previous_score.save()
                    seen.add(previous_score)
                    break
            if is_new:
                new_score.question = question
                new_score.save()
        for previous_score in previous_scores:
            if previous_score not in seen:
                previous_score.delete()


def generate_scoring_leaderboard_entries(
    questions: list[Question],
    score_type: Leaderboard.ScoreTypes,
) -> list[LeaderboardEntry]:
    scores: QuerySet[Score] = Score.objects.filter(
        question__in=questions,
        score_type=Leaderboard.ScoreTypes.get_base_score(score_type),
    )
    user_entries: dict[User, LeaderboardEntry] = {}
    now = timezone.now()
    for score in scores:
        user_id = score.user_id
        if user_id not in user_entries:
            user_entries[user_id] = LeaderboardEntry(
                user_id=user_id,
                score=0,
                coverage=0,
                contribution_count=0,
                calculated_on=now,
            )
        user_entries[user_id].score += score.score
        user_entries[user_id].coverage += score.coverage
        user_entries[user_id].contribution_count += 1
    if score_type == Leaderboard.ScoreTypes.PEER_GLOBAL:
        for entry in user_entries.values():
            entry.score /= max(30, entry.coverage)
    elif score_type == Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY:
        for entry in user_entries.values():
            entry.score /= max(40, entry.contribution_count)
    return sorted(user_entries.values(), key=lambda entry: entry.score, reverse=True)


def generate_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
) -> list[LeaderboardEntry]:
    """Calculates (does not save) LeaderboardEntries for a project."""

    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    leaderboard.project = project

    if leaderboard.score_type in [
        Leaderboard.ScoreTypes.COMMENT_INSIGHT,
        Leaderboard.ScoreTypes.QUESTION_WRITING,
    ]:
        # TODO
        return []
    # We have a scoring based leaderboard
    return generate_scoring_leaderboard_entries(
        leaderboard.get_questions(), leaderboard.score_type
    )


def update_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
) -> list[LeaderboardEntry]:
    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    leaderboard.project = project
    leaderboard.save()

    seen = set()
    previous_entries = list(leaderboard.entries.all())
    new_entries = generate_project_leaderboard(project, leaderboard)

    # assign ranks (and medals if finalized)
    new_entries.sort(key=lambda entry: entry.score, reverse=True)
    exclusion_records = MedalExclusionRecord.objects.all()
    if leaderboard.start_time:
        exclusion_records = exclusion_records.filter(
            Q(end_time__isnull=True) | Q(end_time__gte=leaderboard.start_time)
        )
    if leaderboard.finalize_time:
        exclusion_records = exclusion_records.filter(
            start_time__lte=leaderboard.finalize_time
        )
    excluded_users = exclusion_records.values_list("user", flat=True)
    # medals
    golds = silvers = bronzes = 0
    if (
        (leaderboard.project.type != "question_series")
        and leaderboard.finalize_time
        and (timezone.now() > leaderboard.finalize_time)
    ):
        entry_count = len(new_entries)
        golds = max(0.01 * entry_count, 1)
        silvers = max(0.01 * entry_count, 1)
        bronzes = max(0.03 * entry_count, 1)
    rank = 1
    for entry in new_entries:
        if entry.user.id in excluded_users:
            entry.excluded = True
            entry.medal = None
            entry.rank = rank
            continue
        if rank <= golds:
            entry.medal = LeaderboardEntry.Medals.GOLD
        elif rank <= golds + silvers:
            entry.medal = LeaderboardEntry.Medals.SILVER
        elif rank <= golds + silvers + bronzes:
            entry.medal = LeaderboardEntry.Medals.BRONZE
        entry.rank = rank
        rank += 1

    for new_entry in new_entries:
        new_entry.leaderboard = leaderboard
        for previous_entry in previous_entries:
            if previous_entry.user == new_entry.user:
                new_entry.id = previous_entry.id
                seen.add(previous_entry)
                break
        new_entry.save()
    for previous_entry in previous_entries:
        if previous_entry not in seen:
            previous_entry.delete()
    return new_entries


@dataclass
class Contribution:
    score: float
    coverage: float
    question: Question | None = None
    comment: Comment | None = None


def get_contributions(
    user: User,
    leaderboard: Leaderboard,
) -> list[Contribution]:
    if leaderboard.score_type in [
        Leaderboard.ScoreTypes.COMMENT_INSIGHT,
        Leaderboard.ScoreTypes.QUESTION_WRITING,
    ]:
        # TODO
        return []
    scores = Score.objects.filter(
        question__in=leaderboard.get_questions(),
        user=user,
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    return [
        Contribution(
            score=score.score,
            coverage=score.coverage,
            question=score.question,
        )
        for score in scores
    ]


def hydrate_take(
    leaderboard_entries: list[LeaderboardEntry] | QuerySet[LeaderboardEntry],
) -> list[LeaderboardEntry] | QuerySet[LeaderboardEntry]:
    total_take = 0
    for entry in leaderboard_entries:
        if entry.excluded:
            setattr(entry, "take", 0)
        else:
            take = max(entry.score, 0) ** 2
            setattr(entry, "take", take)
            total_take += take
    for entry in leaderboard_entries:
        if total_take == 0:
            setattr(entry, "percent_prize", 0)
        else:
            setattr(entry, "percent_prize", entry.take / total_take)
    return leaderboard_entries
