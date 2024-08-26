from collections import defaultdict
from datetime import datetime
from dataclasses import dataclass

import numpy as np

from django.utils import timezone
from django.db.models import QuerySet, Q

from comments.models import Comment
from users.models import User
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
    score_types = score_types or Score.ScoreTypes.choices
    seen = set()
    previous_scores = list(
        Score.objects.filter(question=question, score_type__in=score_types)
    )
    new_scores = evaluate_question(
        question, resolution_bucket, score_types, spot_forecast_time
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
        entries[identifier].coverage += score.coverage / maximum_coverage
        entries[identifier].contribution_count += 1
    if leaderboard.score_type == Leaderboard.ScoreTypes.PEER_GLOBAL:
        for entry in entries.values():
            entry.score /= max(30, entry.coverage)
    elif leaderboard.score_type == Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY:
        for entry in entries.values():
            entry.score /= max(40, entry.contribution_count)
    elif leaderboard.score_type == Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT:
        for entry in entries.values():
            entry.take = max(entry.coverage * np.exp(entry.score), 0)
        return sorted(entries.values(), key=lambda entry: entry.take, reverse=True)
    return sorted(entries.values(), key=lambda entry: entry.score, reverse=True)


def generate_comment_insight_leaderboard_entries(
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    now = timezone.now()

    posts = Post.objects.filter(
        Q(projects=leaderboard.project) | Q(default_project=leaderboard.project)
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
            start_time__lte=min(
                [
                    leaderboard.end_time,
                    question.actual_close_time or question.scheduled_close_time,
                    question.actual_resolve_time or question.scheduled_resolve_time,
                ]
            ),
        )
        forecasters = set([forecast.author_id for forecast in forecasts_during_period])
        post = question.get_post()
        forecaster_ids_for_post[post].update(forecasters)

    scores_for_author: dict[User, list[float]] = defaultdict(list)
    for post, forecaster_ids in forecaster_ids_for_post.items():
        # TODO: support coauthorship
        author = post.author
        # we use the h-index by number of forecasters divided by 10
        scores_for_author[author].append(len(forecaster_ids) / 10)

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
    if leaderboard.score_type == Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT:
        new_entries.sort(key=lambda entry: entry.take, reverse=True)
    else:
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
    excluded_user_ids = set([r.user.id for r in exclusion_records])
    # medals
    golds = silvers = bronzes = 0
    if (
        (leaderboard.project.type != "question_series")
        and leaderboard.finalize_time
        and (timezone.now() > leaderboard.finalize_time)
    ):
        entry_count = len(
            [
                e
                for e in new_entries
                if (e.user_id and (e.user_id not in excluded_user_ids))
            ]
        )
        golds = max(0.01 * entry_count, 1)
        silvers = max(0.01 * entry_count, 1)
        bronzes = max(0.03 * entry_count, 1)
    rank = 1
    for entry in new_entries:
        if (entry.user_id is None) or (entry.user_id in excluded_users):
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
        return contributions[: int(h_index) + 1]

    if leaderboard.score_type == "global_leaderboard":
        # There are so many questions in global leaderboards that we don't
        # need to make unpopulated contributions for questions that have not
        # been resolved.
        questions = [q for q in questions if q.resolution is not None]
    archived_scores = list(
        ArchivedScore.objects.filter(
            question__in=questions,
            user=user,
            score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
        )
    )
    calculated_scores = list(
        Score.objects.filter(
            question__in=questions,
            user=user,
            score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
        )
    )
    scores = archived_scores
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
    contributions += [
        Contribution(score=None, coverage=None, question=question)
        for question in questions
        if question not in scored_question
    ]

    return contributions


def hydrate_take(
    leaderboard_entries: list[LeaderboardEntry] | QuerySet[LeaderboardEntry],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry] | QuerySet[LeaderboardEntry]:
    # TODO: just add take and percent_prize to model instance
    total_take = 0
    for entry in leaderboard_entries:
        if entry.excluded:
            setattr(entry, "take", 0)
        else:
            if (
                leaderboard.score_type
                == Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT
            ):
                take = max(entry.coverage * np.exp(entry.score), 0)
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
