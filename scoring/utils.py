from collections import defaultdict
from dataclasses import dataclass

import numpy as np
from django.db.models import QuerySet, Q
from django.utils import timezone
from decimal import Decimal

from comments.models import Comment
from posts.models import Post
from projects.models import Project
from questions.models import Question
from questions.types import AggregationMethod
from scoring.models import (
    ArchivedScore,
    Score,
    LeaderboardEntry,
    Leaderboard,
    MedalExclusionRecord,
)
from scoring.score_math import evaluate_question
from users.models import User
from utils.the_math.formulas import string_location_to_bucket_index
from utils.the_math.measures import decimal_h_index


def score_question(
    question: Question,
    resolution: str,
    spot_forecast_time: float | None = None,
    score_types: list[str] | None = None,
):
    resolution_bucket = string_location_to_bucket_index(resolution, question)
    spot_forecast_time = spot_forecast_time or question.cp_reveal_time.timestamp()
    score_types = score_types or [c[0] for c in Score.ScoreTypes.choices]
    seen = set()
    previous_scores = list(
        Score.objects.filter(question=question, score_type__in=score_types)
    )
    new_scores = evaluate_question(
        question,
        resolution_bucket,
        score_types,
        spot_forecast_time,
    )
    for new_score in new_scores:
        is_new = True
        for previous_score in previous_scores:
            if (
                (previous_score.user == new_score.user)
                and (previous_score.aggregation_method == new_score.aggregation_method)
                and (previous_score.score_type == new_score.score_type)
            ):
                is_new = False
                previous_score.score = new_score.score
                previous_score.coverage = new_score.coverage
                previous_score.edited_at = question.resolution_set_time
                previous_score.save()
                seen.add(previous_score)
                break
        if is_new:
            new_score.question = question
            new_score.edited_at = question.resolution_set_time
            new_score.save()
    for previous_score in previous_scores:
        if previous_score not in seen:
            previous_score.delete()


def generate_scoring_leaderboard_entries(
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    calculated_scores: QuerySet[Score] = Score.objects.filter(
        question__in=questions,
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    archived_scores: QuerySet[ArchivedScore] = ArchivedScore.objects.filter(
        question__in=questions,
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    if leaderboard.finalize_time:
        calculated_scores = calculated_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        )
        archived_scores = archived_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        )
    scores: list[Score | ArchivedScore]
    if archived_scores.exists():
        scores = list(archived_scores)
        for score in calculated_scores:
            if archived_scores.filter(
                question=score.question,
                user_id=score.user_id,
                aggregation_method=score.aggregation_method,
            ).exists():
                continue
            scores.append(score)
    else:
        scores = list(calculated_scores)

    scores = sorted(scores, key=lambda x: x.user_id or x.score)
    entries: dict[int | AggregationMethod, LeaderboardEntry] = {}
    now = timezone.now()
    maximum_coverage = len(
        [
            q
            for q in questions
            if q.resolution and q.resolution not in ["annulled", "ambiguous"]
        ]
    )
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
        entries[identifier].score += score.score
        entries[identifier].coverage += score.coverage
        entries[identifier].contribution_count += 1
    if leaderboard.score_type == Leaderboard.ScoreTypes.PEER_GLOBAL:
        for entry in entries.values():
            entry.score /= max(30, entry.coverage)
    elif leaderboard.score_type == Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY:
        for entry in entries.values():
            entry.score /= max(40, entry.contribution_count)
    elif leaderboard.score_type in (
        Leaderboard.ScoreTypes.PEER_TOURNAMENT,
        Leaderboard.ScoreTypes.SPOT_PEER_TOURNAMENT,
    ):
        for entry in entries.values():
            entry.take = max(entry.score, 0) ** 2
    elif leaderboard.score_type == Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT:
        for entry in entries.values():
            entry.coverage /= maximum_coverage
            entry.take = entry.coverage * np.exp(entry.score)
        return sorted(entries.values(), key=lambda entry: entry.take, reverse=True)
    return sorted(entries.values(), key=lambda entry: entry.score, reverse=True)


def generate_comment_insight_leaderboard_entries(
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    now = timezone.now()

    posts = Post.objects.filter(
        Q(projects=leaderboard.project) | Q(default_project=leaderboard.project)
    ).exclude(
        curation_status__in=[
            Post.CurationStatus.REJECTED,
            Post.CurationStatus.DRAFT,
            Post.CurationStatus.DELETED,
        ]
    )
    comments = Comment.objects.filter(
        on_post__in=posts,
        comment_votes__isnull=False,
    ).distinct()

    scores_for_author: dict[User, list[int]] = defaultdict(list)
    for comment in comments:
        votes = comment.comment_votes.filter(
            created_at__gte=leaderboard.start_time,
            created_at__lte=leaderboard.end_time,
        )
        score = sum([vote.direction for vote in votes])
        if score > 0:
            scores_for_author[comment.author].append(score)

    user_entries: dict[User, LeaderboardEntry] = {}
    for user, scores in scores_for_author.items():
        if user not in user_entries:
            user_entries[user] = LeaderboardEntry(
                user_id=user.id,
                score=0,
                contribution_count=0,
                calculated_on=now,
            )
        score = decimal_h_index(scores)
        user_entries[user].score = score
        user_entries[user].contribution_count = len(scores)
    results = [entry for entry in user_entries.values() if entry.score > 0]
    return sorted(results, key=lambda entry: entry.score, reverse=True)


def generate_question_writing_leaderboard_entries(
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    now = timezone.now()

    forecaster_ids_for_post: dict[Post, set[int]] = defaultdict(set)
    for question in questions:
        forecasts_during_period = question.user_forecasts.filter(
            start_time__gte=leaderboard.start_time,
            start_time__lte=leaderboard.end_time,
        )
        forecasters = set(forecast.author_id for forecast in forecasts_during_period)
        post = question.get_post()
        forecaster_ids_for_post[post].update(forecasters)

    scores_for_author: dict[User, list[float]] = defaultdict(list)
    for post, forecaster_ids in forecaster_ids_for_post.items():
        # TODO: support coauthorship
        author = post.author
        # we use the h-index by number of forecasters divided by 10
        scores_for_author[author].append(len(forecaster_ids) / 10)

    user_entries: dict[User, LeaderboardEntry] = dict()
    for user, scores in scores_for_author.items():
        if user not in user_entries:
            user_entries[user] = LeaderboardEntry(
                user_id=user.id,
                score=0,
                contribution_count=0,
                calculated_on=now,
            )
        score = decimal_h_index(scores)
        user_entries[user].score = score
        user_entries[user].contribution_count = len(scores)
    results = [e for e in user_entries.values() if e.score > 0]
    return sorted(results, key=lambda e: e.score, reverse=True)


def generate_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
    questions: QuerySet[Question] | list[Question] | None = None,
) -> list[LeaderboardEntry]:
    """Calculates (does not save) LeaderboardEntries for a project."""

    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    leaderboard.project = project

    if leaderboard.score_type == Leaderboard.ScoreTypes.COMMENT_INSIGHT:
        return generate_comment_insight_leaderboard_entries(leaderboard)
    questions = questions or leaderboard.get_questions()
    if leaderboard.score_type == Leaderboard.ScoreTypes.QUESTION_WRITING:
        return generate_question_writing_leaderboard_entries(questions, leaderboard)
    # We have a scoring based leaderboard
    return generate_scoring_leaderboard_entries(questions, leaderboard)


def assign_ranks(
    entries: list[LeaderboardEntry],
    leaderboard: Leaderboard,
    include_bots: bool = False,
) -> list[LeaderboardEntry]:
    RelativeLegacy = Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT
    if leaderboard.score_type == RelativeLegacy:
        entries.sort(key=lambda entry: entry.take, reverse=True)
    else:
        entries.sort(key=lambda entry: entry.score, reverse=True)

    # set up exclusions
    exclusion_records = MedalExclusionRecord.objects.all()
    if leaderboard.start_time:
        exclusion_records = exclusion_records.filter(
            Q(end_time__isnull=True) | Q(end_time__gte=leaderboard.start_time)
        )
    if leaderboard.finalize_time:
        exclusion_records = exclusion_records.filter(
            start_time__lte=leaderboard.finalize_time
        )
    excluded_ids: set[int | None] = set(
        exclusion_records.values_list("user", flat=True)
    )
    for entry in entries:
        if entry.user:
            if not include_bots and entry.user.is_bot:
                excluded_ids.add(entry.user_id)
            if not entry.user.is_active:
                excluded_ids.add(entry.user_id)
            # TODO: add exclusions for moderators (not yet migrated)
            # Also add similar exclusions to other leaderboard types
    excluded_ids.add(None)  # aggregates are excluded

    # set ranks
    rank = 1
    prev_entry = None
    for entry in entries:
        entry.rank = rank
        if leaderboard.score_type == RelativeLegacy:
            if prev_entry and np.isclose(entry.take, prev_entry.take):
                entry.rank = prev_entry.rank
        else:
            if prev_entry and np.isclose(entry.score, prev_entry.score):
                entry.rank = prev_entry.rank
        prev_entry = entry
        if entry.user_id in excluded_ids:
            entry.excluded = True
        else:
            rank += 1

    return entries


def assign_prize_percentages(entries: list[LeaderboardEntry]) -> list[LeaderboardEntry]:
    total_take = sum(e.take for e in entries if not e.excluded)
    for entry in entries:
        if total_take and not entry.excluded:
            entry.percent_prize = entry.take / total_take
        else:
            entry.percent_prize = 0
    return entries


def assign_medals(
    entries: list[LeaderboardEntry],
) -> list[LeaderboardEntry]:
    entries.sort(key=lambda entry: entry.rank)
    entry_count = len([e for e in entries if not e.excluded])
    gold_rank = max(np.ceil(0.01 * entry_count), 1)
    silver_rank = max(np.ceil(0.02 * entry_count), 2)
    bronze_rank = max(np.ceil(0.05 * entry_count), 3)
    for entry in entries:
        if entry.excluded:
            continue
        elif entry.rank <= gold_rank:
            entry.medal = LeaderboardEntry.Medals.GOLD
        elif entry.rank <= silver_rank:
            entry.medal = LeaderboardEntry.Medals.SILVER
        elif entry.rank <= bronze_rank:
            entry.medal = LeaderboardEntry.Medals.BRONZE
        else:
            break
    return entries


def assign_prizes(
    entries: list[LeaderboardEntry], prize_pool: Decimal
) -> list[LeaderboardEntry]:
    included = [e for e in entries if not e.excluded]
    for entry in included:
        entry.prize = float(prize_pool) * entry.percent_prize
    return entries


def update_project_leaderboard(
    project: Project,
    leaderboard: Leaderboard | None = None,
) -> list[LeaderboardEntry]:
    leaderboard = leaderboard or project.primary_leaderboard
    if not leaderboard:
        raise ValueError("Leaderboard not found")
    leaderboard.project = project
    leaderboard.save()

    # new entries
    new_entries = generate_project_leaderboard(project, leaderboard)

    # assign ranks - also applies exclusions
    new_entries = assign_ranks(
        new_entries,
        leaderboard,
        include_bots=project.include_bots_in_leaderboard,
    )

    # assign prize percentages
    new_entries = assign_prize_percentages(new_entries)

    # check if we're ready to finalize with medals and prizes
    if (
        (
            leaderboard.project.type
            in [
                Project.ProjectTypes.SITE_MAIN,
                Project.ProjectTypes.TOURNAMENT,
            ]
        )
        and leaderboard.finalize_time
        and (timezone.now() >= leaderboard.finalize_time)
    ):
        # assign medals
        new_entries = assign_medals(new_entries)
        # add prize if applicable
        if project.prize_pool:
            new_entries = assign_prizes(new_entries, project.prize_pool)

    # save entries
    seen = set()
    previous_entries = list(leaderboard.entries.all())
    for new_entry in new_entries:
        new_entry.leaderboard = leaderboard
        for previous_entry in previous_entries:
            if (previous_entry.user_id == new_entry.user_id) and (
                previous_entry.aggregation_method == new_entry.aggregation_method
            ):
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
    score: float | None
    coverage: float | None = None
    question: Question | None = None
    post: Post | None = None
    comment: Comment | None = None


def get_contributions(
    user: User,
    leaderboard: Leaderboard,
) -> list[Contribution]:
    if leaderboard.score_type == Leaderboard.ScoreTypes.COMMENT_INSIGHT:
        public_posts = Post.objects.filter(
            Q(projects=leaderboard.project) | Q(default_project=leaderboard.project)
        )
        comments = Comment.objects.filter(
            on_post__in=public_posts,
            author=user,
            created_at__lte=leaderboard.end_time,
            comment_votes__isnull=False,
        ).distinct()
        contributions: list[Contribution] = []
        for comment in comments:
            votes = comment.comment_votes.filter(
                created_at__gte=leaderboard.start_time,
                created_at__lte=leaderboard.end_time,
            )
            score = sum([vote.direction for vote in votes])
            contribution = Contribution(
                score=score,
                post=comment.on_post,
                comment=comment,
            )
            contributions.append(contribution)
        h_index = decimal_h_index([c.score for c in contributions])
        contributions = sorted(contributions, key=lambda c: c.score, reverse=True)
        min_score = contributions[int(h_index)].score
        return [c for c in contributions if c.score >= min_score]
    questions = leaderboard.get_questions()
    if leaderboard.score_type == Leaderboard.ScoreTypes.QUESTION_WRITING:
        forecaster_ids_for_post: dict[Post, set[int]] = {}
        for question in questions:
            post: Post = question.get_post()
            if post.author != user:
                continue
            forecasts_during_period = question.user_forecasts.all()
            if leaderboard.start_time:
                forecasts_during_period = forecasts_during_period.filter(
                    start_time__gte=leaderboard.start_time
                )
            if leaderboard.end_time:
                forecasts_during_period = forecasts_during_period.filter(
                    start_time__lte=leaderboard.end_time
                )
            forecasters = set(
                [forecast.author_id for forecast in forecasts_during_period]
            )
            if post not in forecaster_ids_for_post:
                forecaster_ids_for_post[post] = set()
            forecaster_ids_for_post[post].update(forecasters)
        contributions: list[Contribution] = []
        for post, forecaster_ids in forecaster_ids_for_post.items():
            contribution = Contribution(
                score=len(forecaster_ids),
                post=post,
            )
            contributions.append(contribution)
        h_index = decimal_h_index([c.score / 10 for c in contributions])
        contributions = sorted(contributions, key=lambda c: c.score, reverse=True)
        # return contributions[: int(h_index) + 1]
        return contributions

    calculated_scores = Score.objects.filter(
        question__in=questions,
        user=user,
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    archived_scores = ArchivedScore.objects.filter(
        question__in=questions,
        user=user,
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    if leaderboard.finalize_time:
        calculated_scores = calculated_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        )
        archived_scores = archived_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        )
    scores = list(archived_scores)
    for score in calculated_scores:
        found = False
        for archived_score in archived_scores:
            if (
                score.question == archived_score.question
                and score.aggregation_method == archived_score.aggregation_method
            ):
                found = True
                break
        if not found:
            scores.append(score)
    if "global" in leaderboard.score_type:
        # There are so many questions in global leaderboards that we don't
        # need to make unpopulated contributions for questions that have not
        # been resolved.
        scores = [s for s in scores if s.coverage > 0]
    scores = sorted(
        scores, key=lambda s: s.score if s.score is not None else 0, reverse=True
    )
    # User has scores on some questions
    contributions = [
        Contribution(score=s.score, coverage=s.coverage, question=s.question)
        for s in scores
    ]
    # add unpopulated contributions for other questions
    scored_question = {score.question for score in scores}
    if "global" not in leaderboard.score_type:
        contributions += [
            Contribution(score=None, coverage=None, question=question)
            for question in questions
            if question not in scored_question
        ]

    return contributions
