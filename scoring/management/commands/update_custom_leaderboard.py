# create a leaderboard that re-evaluates all questions as if they opened
# at some specific time or average scores across given some spot times

from datetime import datetime
from collections import defaultdict

from django.utils import timezone
from django.db import transaction

from posts.models import Post
from scoring.constants import LeaderboardScoreTypes, ScoreTypes
from scoring.models import Leaderboard, Score, LeaderboardEntry
from scoring.score_math import evaluate_question
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.types import AggregationMethod
from questions.constants import UnsuccessfulResolutionType
from scoring.utils import (
    assign_ranks,
    assign_prize_percentages,
    assign_prizes,
    assign_medals,
)


def update_minimum_time_leaderboard(
    project: Project, minimum_time: datetime
) -> Leaderboard:
    leaderboard, _ = Leaderboard.objects.get_or_create(
        prize_pool=0,
        name=f"Set open_time for {project.name} at {minimum_time}",
        project=project,
        score_type=LeaderboardScoreTypes.MANUAL,
    )

    questions = (
        leaderboard.get_questions()
        .filter(
            related_posts__post__curation_status=Post.CurationStatus.APPROVED,
            resolution__isnull=False,
        )
        .exclude(resolution__in=UnsuccessfulResolutionType)
    )

    scores: list[Score] = []

    for question in questions:
        if question.open_time >= minimum_time:
            scores.extend(question.scores.filter(score_type=ScoreTypes.PEER))
            continue
        question.open_time = minimum_time
        # simulate scores as if question open_time was minimum_time
        new_scores = evaluate_question(
            question=question,
            resolution=question.resolution,
            score_types=[ScoreTypes.PEER],
        )
        scores.extend(new_scores)

    ########### copied code from `generate_scoring_leaderboard_entries`
    scores = sorted(scores, key=lambda x: x.user_id or x.score)

    entries: dict[int | AggregationMethod, LeaderboardEntry] = {}
    now = timezone.now()
    for score in scores:
        identifier = score.user_id or score.aggregation_method
        if identifier not in entries:
            entries[identifier] = LeaderboardEntry(
                user_id=score.user_id,
                aggregation_method=score.aggregation_method,
                score=0,
                coverage=0,
                contribution_count=0,
                calculated_on=now,
            )
        entries[identifier].score += score.score * score.question.question_weight
        entries[identifier].coverage += score.coverage * score.question.question_weight
        entries[identifier].contribution_count += 1
    for entry in entries.values():
        entry.take = max(entry.score, 0) ** 2
    new_entries = sorted(entries.values(), key=lambda entry: entry.score, reverse=True)

    ########### copied code from `update_project_leaderboard`
    force_finalize = False
    # assign ranks - also applies exclusions
    bot_status = leaderboard.bot_status or project.bot_leaderboard_status
    bots_get_ranks = bot_status in [
        Project.BotLeaderboardStatus.BOTS_ONLY,
        Project.BotLeaderboardStatus.INCLUDE,
    ]
    humans_get_ranks = bot_status != Project.BotLeaderboardStatus.BOTS_ONLY
    new_entries = assign_ranks(
        new_entries,
        leaderboard,
        include_humans=humans_get_ranks,
        include_bots=bots_get_ranks,
    )

    # assign prize percentages
    prize_pool = (
        leaderboard.prize_pool
        if leaderboard.prize_pool is not None
        else project.prize_pool
    )
    minimum_prize_percent = (
        float(leaderboard.minimum_prize_amount) / float(prize_pool) if prize_pool else 0
    )
    new_entries = assign_prize_percentages(new_entries, minimum_prize_percent)

    if prize_pool:  # always assign prizes
        new_entries = assign_prizes(new_entries, prize_pool)
    # check if we're ready to finalize and assign medals/prizes if applicable
    finalize_time = leaderboard.finalize_time or (
        project.close_date if project else None
    )
    if force_finalize or (finalize_time and (timezone.now() >= finalize_time)):
        if (
            project
            and project.type
            in [
                Project.ProjectTypes.SITE_MAIN,
                Project.ProjectTypes.TOURNAMENT,
            ]
            and project.default_permission == ObjectPermission.FORECASTER
            and project.visibility == Project.Visibility.NORMAL
        ):
            new_entries = assign_medals(new_entries)
        # always set finalize
        Leaderboard.objects.filter(pk=leaderboard.pk).update(finalized=True)

    # save entries
    previous_entries_map = {
        (entry.user_id, entry.aggregation_method): entry.id
        for entry in leaderboard.entries.all()
    }

    for new_entry in new_entries:
        new_entry.leaderboard = leaderboard
        new_entry.id = previous_entries_map.get(
            (new_entry.user_id, new_entry.aggregation_method)
        )

    with transaction.atomic():
        leaderboard.entries.all().delete()
        LeaderboardEntry.objects.bulk_create(new_entries, batch_size=500)

    return leaderboard


def update_spot_time_leaderboard(
    project: Project, spot_times: list[datetime]
) -> Leaderboard:
    leaderboard, _ = Leaderboard.objects.get_or_create(
        prize_pool=0,
        name=f"Spot time for {project.name} at {len(spot_times)} spot times",
        project=project,
        score_type=LeaderboardScoreTypes.MANUAL,
    )

    questions = (
        leaderboard.get_questions()
        .filter(
            related_posts__post__curation_status=Post.CurationStatus.APPROVED,
            resolution__isnull=False,
        )
        .exclude(resolution__in=UnsuccessfulResolutionType)
    )

    scores: list[Score] = []

    for question in questions:
        question_scores: list[Score] = []
        for spot_time in spot_times:
            # simulate scores as if question spot_scoring_time was spot_time
            question.spot_scoring_time = spot_time
            new_scores = evaluate_question(
                question=question,
                resolution=question.resolution,
                score_types=[ScoreTypes.SPOT_PEER],
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
                    score_type=ScoreTypes.SPOT_PEER,
                    question=question,
                    coverage=len(user_scores) / len(spot_times),
                )
            )

    ########### copied code from `generate_scoring_leaderboard_entries`
    scores = sorted(scores, key=lambda x: x.user_id or x.score)

    entries: dict[int | AggregationMethod, LeaderboardEntry] = {}
    now = timezone.now()
    for score in scores:
        identifier = score.user_id or score.aggregation_method
        if identifier not in entries:
            entries[identifier] = LeaderboardEntry(
                user_id=score.user_id,
                aggregation_method=score.aggregation_method,
                score=0,
                coverage=0,
                contribution_count=0,
                calculated_on=now,
            )
        entries[identifier].score += score.score * score.question.question_weight
        entries[identifier].coverage += score.coverage * score.question.question_weight
        entries[identifier].contribution_count += 1
    for entry in entries.values():
        entry.take = max(entry.score, 0) ** 2
    new_entries = sorted(entries.values(), key=lambda entry: entry.score, reverse=True)

    ########### copied code from `update_project_leaderboard`
    force_finalize = False
    # assign ranks - also applies exclusions
    bot_status = leaderboard.bot_status or project.bot_leaderboard_status
    bots_get_ranks = bot_status in [
        Project.BotLeaderboardStatus.BOTS_ONLY,
        Project.BotLeaderboardStatus.INCLUDE,
    ]
    humans_get_ranks = bot_status != Project.BotLeaderboardStatus.BOTS_ONLY
    new_entries = assign_ranks(
        new_entries,
        leaderboard,
        include_humans=humans_get_ranks,
        include_bots=bots_get_ranks,
    )

    # assign prize percentages
    prize_pool = (
        leaderboard.prize_pool
        if leaderboard.prize_pool is not None
        else project.prize_pool
    )
    minimum_prize_percent = (
        float(leaderboard.minimum_prize_amount) / float(prize_pool) if prize_pool else 0
    )
    new_entries = assign_prize_percentages(new_entries, minimum_prize_percent)

    if prize_pool:  # always assign prizes
        new_entries = assign_prizes(new_entries, prize_pool)
    # check if we're ready to finalize and assign medals/prizes if applicable
    finalize_time = leaderboard.finalize_time or (
        project.close_date if project else None
    )
    if force_finalize or (finalize_time and (timezone.now() >= finalize_time)):
        if (
            project
            and project.type
            in [
                Project.ProjectTypes.SITE_MAIN,
                Project.ProjectTypes.TOURNAMENT,
            ]
            and project.default_permission == ObjectPermission.FORECASTER
            and project.visibility == Project.Visibility.NORMAL
        ):
            new_entries = assign_medals(new_entries)
        # always set finalize
        Leaderboard.objects.filter(pk=leaderboard.pk).update(finalized=True)

    # save entries
    previous_entries_map = {
        (entry.user_id, entry.aggregation_method): entry.id
        for entry in leaderboard.entries.all()
    }

    for new_entry in new_entries:
        new_entry.leaderboard = leaderboard
        new_entry.id = previous_entries_map.get(
            (new_entry.user_id, new_entry.aggregation_method)
        )

    with transaction.atomic():
        leaderboard.entries.all().delete()
        LeaderboardEntry.objects.bulk_create(new_entries, batch_size=500)

    return leaderboard


class Command(BaseCommand):
    help = """
    Update the global bots leaderboard
    """

    def add_arguments(self, parser):
        parser.add_arguement(
            "--project_id",
            type=int,
            required=True,
        )
        parser.add_arguement(
            "--minimum_time",
            type=str,
            required=False,
            help="If creating/updating the minimum time leaderboard, submit a "
            "minimum time in ISO format. Time will be interpreted in UTC. "
            "Cannot be used with --spot_times."
            "Example: 2024-01-01T00:00:00",
        )
        parser.add_arguement(
            "--spot_times",
            type=str,
            required=False,
            help="If creating/updating the spot time leaderboard, submit a "
            "comma-separated list of spot times in ISO format. "
            "Times will be interpreted in UTC. Cannot be used with --minimum_time. "
            "Example: 2024-01-01T00:00:00,2024-01-02T00:00:00",
        )

    def handle(self, *args, **options) -> None:
        project_id = options["project_id"]
        minimum_time_raw = options.get("minimum_time")
        spot_times_raw = options.get("spot_times")

        project = Project.objects.filter(id=project_id).first()
        if not project:
            self.stdout.write(
                self.style.ERROR(f"Project with ID {project_id} does not exist.")
            )
            return
        if (not minimum_time_raw and not spot_times_raw) or (
            minimum_time_raw and spot_times_raw
        ):
            self.stdout.write(
                self.style.ERROR(
                    "Either --minimum_time or --spot_times must be provided, but not both."
                )
            )
            return

        if minimum_time_raw:
            minimum_time = datetime.fromisoformat(minimum_time_raw).replace(
                tzinfo=timezone.utc
            )
            update_minimum_time_leaderboard(project, minimum_time)

        if spot_times_raw:
            spot_times = [
                datetime.fromisoformat(t).replace(tzinfo=timezone.utc)
                for t in spot_times_raw.split(",")
            ]
            update_spot_time_leaderboard(project, spot_times)
