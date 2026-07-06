import logging
from collections import defaultdict

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Exists, OuterRef, QuerySet, Q
from django.utils import timezone
import numpy as np

from coherence.models import CoherenceLink
from posts.models import Post
from projects.models import Project
from questions.constants import UnsuccessfulResolutionType
from questions.models import AggregateForecast, Forecast, Question
from scoring.constants import ScoreTypes, ExclusionStatuses
from scoring.models import Leaderboard, LeaderboardEntry, MedalExclusionRecord
from scoring.score_math import (
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
    get_geometric_means,
)
from scoring.utils import assign_prize_percentages_, assign_prizes_
from users.models import User
from utils.the_math.formulas import string_location_to_bucket_index

SkillType = dict[int | str, float]

logger = logging.getLogger(__name__)


def get_score_pair(
    user1_forecasts: list[Forecast | AggregateForecast],
    user2_forecasts: list[Forecast | AggregateForecast],
    question: Question,
) -> tuple[int, float, float] | None:
    # Setup for calling evaluate function
    forecasts = user1_forecasts + user2_forecasts
    resolution_bucket = string_location_to_bucket_index(question.resolution, question)
    forecast_horizon_start = question.open_time.timestamp()
    actual_close_time = question.actual_close_time.timestamp()
    forecast_horizon_end = question.scheduled_close_time.timestamp()
    geometric_means = get_geometric_means(forecasts)

    if question.default_score_type == ScoreTypes.PEER:
        # Coverage
        coverage = 0.0
        cvs = []
        total_duration = forecast_horizon_end - forecast_horizon_start
        current_timestamp = actual_close_time
        for gm in geometric_means[::-1]:
            end = max(min(current_timestamp, actual_close_time), forecast_horizon_start)
            start = max(min(gm.timestamp, actual_close_time), forecast_horizon_start)
            if gm.num_forecasters == 2:  # coverage only when both have a forecast
                coverage += max(0, (end - start)) / total_duration
                cvs.append(max(0, (end - start)) / total_duration)
            current_timestamp = gm.timestamp
        if coverage == 0:
            return None
        user1_scores = evaluate_forecasts_peer_accuracy(
            forecasts=user1_forecasts,  # only evaluate user1 (user2 is opposite)
            base_forecasts=None,
            resolution_bucket=resolution_bucket,
            forecast_horizon_start=forecast_horizon_start,
            actual_close_time=actual_close_time,
            forecast_horizon_end=forecast_horizon_end,
            question_type=question.type,
            geometric_means=geometric_means,
        )
    elif question.default_score_type == ScoreTypes.SPOT_PEER:
        spot_forecast_timestamp = min(
            question.get_spot_scoring_time().timestamp(), actual_close_time
        )
        # Coverage
        coverage = 0.0
        current_timestamp = actual_close_time
        for gm in geometric_means[::-1]:
            if gm.timestamp <= spot_forecast_timestamp <= current_timestamp:
                if gm.num_forecasters == 2:
                    # both have a forecast at spot scoring time
                    coverage = 1 / 3  # downweight spot score questions
                break
            current_timestamp = gm.timestamp
        if coverage == 0:
            return None
        user1_scores = evaluate_forecasts_peer_spot_forecast(
            forecasts=user1_forecasts,  # only evaluate user1 (user2 is opposite)
            base_forecasts=None,
            resolution_bucket=resolution_bucket,
            spot_forecast_timestamp=spot_forecast_timestamp,
            question_type=question.type,
            geometric_means=geometric_means,
        )
    else:
        raise ValueError("we only do Peer scores 'round hya")

    score_sum = sum(s.score for s in user1_scores)
    if question.default_score_type == ScoreTypes.PEER:
        score_sum /= coverage or 1

    return (question.id, score_sum, coverage)


def gather_data(
    baseline_user: User,
    competitors: QuerySet[User],
    questions: QuerySet[Question],
) -> tuple[list[int], list[int], list[float], list[float]]:
    competitor_ids: list[int | str] = []
    question_ids: list[int] = []
    scores: list[float] = []
    coverages: list[float] = []

    user_ids = competitors.values_list("id", flat=True)
    logger.info("Processing pairwise scoring.")
    for question in questions:
        # Get forecasts
        baseline_forecasts = list(
            question.user_forecasts.filter(author_id=baseline_user.id).order_by(
                "start_time"
            )
        )
        forecast_dict: dict[int | str, list[Forecast | AggregateForecast]] = (
            defaultdict(list)
        )
        for f in question.user_forecasts.filter(author_id__in=user_ids).order_by(
            "start_time"
        ):
            forecast_dict[f.author_id].append(f)

        forecaster_ids = sorted(list(forecast_dict.keys()), key=str, reverse=True)
        for user_id in forecaster_ids:
            result = get_score_pair(
                forecast_dict[user_id],
                baseline_forecasts,
                question,
            )
            if result:
                q, u1s, cov = result
                competitor_ids.append(user_id)
                question_ids.append(q)
                scores.append(u1s)
                coverages.append(cov)

    return (competitor_ids, question_ids, scores, coverages)


def run_update_coherence_spring_2026_cup() -> None:
    baseline_player: User = User.objects.get(id=283585)  # coherence links bot
    project = Project.objects.get(id=32921)  # metaculus spring cup 2026

    # SETUP: users to evaluate & questions
    logger.info("Initializing...")
    users: QuerySet[User] = User.objects.filter(
        metadata__coherence_bot_for_user_id__isnull=False,
        is_active=True,
    ).order_by("id")
    user_forecast_exists = Forecast.objects.filter(
        question_id=OuterRef("pk"), author__in=users
    )
    potential_questions = project.primary_leaderboard.get_questions()
    questions: QuerySet[Question] = (
        potential_questions.filter(
            post__curation_status=Post.CurationStatus.APPROVED,
            resolution__isnull=False,
            # scheduled_close_time__lte=timezone.now(),
        )
        .exclude(resolution__in=UnsuccessfulResolutionType)
        .filter(Exists(user_forecast_exists))
        .order_by("id")
        .distinct("id")
    )
    logger.info("Initializing... DONE")

    # Gather head to head scores
    competitor_ids, question_ids, scores, coverages = gather_data(
        baseline_player, users, questions
    )

    # Scores
    competitor_score_record = defaultdict(list)
    competitor_coverage_record = defaultdict(list)
    for uid, score, coverage in zip(competitor_ids, scores, coverages):
        competitor_score_record[uid].append(score)
        competitor_coverage_record[uid].append(coverage)
    cov_by_q = defaultdict(float)
    for qid, coverage in zip(question_ids, coverages):
        cov_by_q[qid] = max(cov_by_q[qid], coverage)
    baseline_coverage = sum(cov_by_q.values())
    records = [(baseline_player.id, 0.0, baseline_coverage)]
    for uid in competitor_score_record.keys():
        records.append(
            (
                uid,
                # double the score to normalize it such that the baseline is given
                # a score of 0
                np.sum(competitor_score_record[uid]) * 2.0,
                np.sum(competitor_coverage_record[uid]),
            )
        )
    ordered_scores = sorted(records, key=lambda x: x[1], reverse=True)

    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    # UPDATE Leaderboard
    logger.info("Updating leaderboard...")
    leaderboard, _ = Leaderboard.objects.get_or_create(
        project=project,
        name=f"Coherence Leaderboard for {project.name}",
        score_type="relative_legacy_tournament",
        bot_status=Project.BotLeaderboardStatus.BOTS_ONLY,
        prize_pool=Decimal("5000.00"),
        display_config={
            "display_name": "Question Links Leaderboard",
            "display_order": 1,
            "column_renames": {"Questions": "Question Links"},
            "display_on_project": True,
        },
    )
    entry_dict = {
        entry.user_id or entry.aggregation_method: entry
        for entry in list(leaderboard.entries.all())
    }
    rank = 1
    question_ids_set = set(question_ids)
    question_count = len(question_ids_set) or 1
    entries = []
    for uid, score, coverage in ordered_scores:
        huid = (User.objects.get(id=uid).metadata or {}).get(
            "coherence_bot_for_user_id"
        )
        relevant_links = CoherenceLink.objects.filter(
            Q(question1_id__in=question_ids_set) | Q(question2_id__in=question_ids_set),
            user_id=huid or 0,
        )

        exclusion_status = ExclusionStatuses.INCLUDE
        if uid == baseline_player.id:
            exclusion_status = ExclusionStatuses.EXCLUDE_AND_SHOW
        for exclusion in MedalExclusionRecord.objects.filter(user_id=uid or 0):
            exclusion_status = max(exclusion_status, exclusion.exclusion_status)

        entry: LeaderboardEntry = entry_dict.pop(uid, LeaderboardEntry())
        entry.user_id = uid if isinstance(uid, int) else None
        entry.aggregation_method = None
        entry.leaderboard = leaderboard
        entry.score = score
        entry.take = max(score, 0.0) ** 2
        entry.rank = rank
        entry.excluded = exclusion_status != ExclusionStatuses.INCLUDE
        entry.show_when_excluded = True
        entry.exclusion_status = exclusion_status
        entry.contribution_count = relevant_links.count()
        entry.coverage = coverage / question_count
        entry.calculated_on = timezone.now()
        entries.append(entry)
        if exclusion_status <= ExclusionStatuses.EXCLUDE_PRIZE_ONLY:
            rank += 1
    # assign prize percentages
    prize_pool = (
        leaderboard.prize_pool
        if leaderboard.prize_pool is not None
        else project.prize_pool
    )
    minimum_prize_percent = (
        float(leaderboard.minimum_prize_amount) / float(prize_pool) if prize_pool else 0
    )
    assign_prize_percentages_(entries, minimum_prize_percent)
    if prize_pool:
        assign_prizes_(entries, prize_pool)
    seen = set()
    for entry in entries:
        entry.save()
        seen.add(entry.id)
    logger.info("Updating leaderboard... DONE")
    # delete unseen entries
    leaderboard.entries.exclude(id__in=seen).delete()
    logger.info("Pruned unseen leaderboard entries.")


class Command(BaseCommand):
    help = """
    Update the coherence leaderboard for the Metaculus Spring Cup 2026
    """

    def handle(self, *args, **options) -> None:
        run_update_coherence_spring_2026_cup()
