from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
import csv
from io import StringIO

import numpy as np
from django.db import transaction
from django.db.models import QuerySet, Q, Sum, IntegerField, OuterRef, Exists
from django.db.models.functions import Coalesce
from django.utils import timezone
from sql_util.aggregates import SubqueryAggregate

from comments.models import Comment
from posts.models import Post
from projects.models import Project
from questions.models import Question, Forecast, QuestionPost
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
from utils.dtypes import generate_map_from_list
from utils.the_math.formulas import string_location_to_bucket_index
from utils.the_math.measures import decimal_h_index


def score_question(
    question: Question,
    resolution: str,
    spot_forecast_time: float | None = None,
    score_types: list[str] | None = None,
):
    resolution_bucket = string_location_to_bucket_index(resolution, question)
    spot_forecast_time = spot_forecast_time or (
        question.cp_reveal_time.timestamp() if question.cp_reveal_time else None
    )
    score_types = score_types or [c[0] for c in Score.ScoreTypes.choices]

    previous_scores = Score.objects.filter(
        question=question, score_type__in=score_types
    )
    previous_scores_map = {
        (score.user_id, score.aggregation_method, score.score_type): score.id
        for score in previous_scores
    }
    new_scores = evaluate_question(
        question,
        resolution_bucket,
        score_types,
        spot_forecast_time,
    )

    for new_score in new_scores:
        previous_score_id = previous_scores_map.get(
            (new_score.user_id, new_score.aggregation_method, new_score.score_type)
        )

        new_score.id = previous_score_id
        new_score.question = question
        new_score.edited_at = question.resolution_set_time

    with transaction.atomic():
        previous_scores.delete()
        Score.objects.bulk_create(new_scores, batch_size=500)


def generate_scoring_leaderboard_entries(
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    score_type = Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type)
    qs_filters = {
        "question__in": questions,
        "score_type": score_type,
    }

    if leaderboard.finalize_time:
        qs_filters["question__scheduled_close_time__lte"] = leaderboard.finalize_time

    archived_scores = ArchivedScore.objects.filter(**qs_filters).prefetch_related(
        "question"
    )
    calculated_scores = Score.objects.filter(**qs_filters).prefetch_related("question")

    archived_scores_subquery = ArchivedScore.objects.filter(
        question_id=OuterRef("question_id"),
        user_id=OuterRef("user_id"),
        aggregation_method=OuterRef("aggregation_method"),
        score_type=Leaderboard.ScoreTypes.get_base_score(leaderboard.score_type),
    )
    if leaderboard.finalize_time:
        archived_scores_subquery = archived_scores_subquery.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        )

    calculated_scores = calculated_scores.annotate(
        archived_exists=Exists(archived_scores_subquery)
    ).filter(archived_exists=False)

    scores = list(archived_scores) + list(calculated_scores)
    scores = sorted(scores, key=lambda x: x.user_id or x.score)

    entries: dict[int | AggregationMethod, LeaderboardEntry] = {}
    now = timezone.now()
    maximum_coverage = sum(
        q.question_weight
        for q in questions
        if q.resolution and q.resolution not in ["annulled", "ambiguous"]
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
        entries[identifier].score += score.score * score.question.question_weight
        entries[identifier].coverage += score.coverage * score.question.question_weight
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

    comments = (
        Comment.objects.filter(
            on_post__in=posts,
        )
        .annotate(
            vote_score=Coalesce(
                SubqueryAggregate(
                    "comment_votes__direction",
                    filter=Q(
                        created_at__gte=leaderboard.start_time,
                        created_at__lte=leaderboard.end_time,
                    ),
                    aggregate=Sum,
                ),
                0,
                output_field=IntegerField(),
            )
        )
        .filter(vote_score__gt=0)
        .select_related("author")
    )

    scores_for_author: dict[User, list[int]] = defaultdict(list)
    for comment in comments:
        scores_for_author[comment.author].append(comment.vote_score)

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

    user_forecasts_map = generate_map_from_list(
        Forecast.objects.filter(
            question__in=questions,
            start_time__gte=leaderboard.start_time,
            start_time__lte=leaderboard.end_time,
        ).only("question_id", "author_id"),
        key=lambda forecast: forecast.question_id,
    )
    question_post_map = {
        obj.question_id: obj.post
        for obj in QuestionPost.objects.filter(question__in=questions).select_related(
            "post__author"
        )
    }

    forecaster_ids_for_post: dict[Post, set[int]] = defaultdict(set)
    for question in questions:
        forecasts_during_period = user_forecasts_map.get(question.pk) or []
        forecasters = set(forecast.author_id for forecast in forecasts_during_period)
        post = question_post_map.get(question.id)
        forecaster_ids_for_post[post].update(forecasters)

    exclusions = {e.user: e for e in MedalExclusionRecord.objects.all()}
    scores_for_author: dict[User, list[float]] = defaultdict(list)
    for post, forecaster_ids in forecaster_ids_for_post.items():
        all_authors = [post.author] + list(post.coauthors.all())
        for author in all_authors:
            if exclusion := exclusions.get(author):
                if post.published_at > exclusion.start_time and (
                    exclusion.end_time is None or post.published_at < exclusion.end_time
                ):
                    continue
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
    results = [e for e in user_entries.values()]
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
        exclusion_records.values_list("user_id", flat=True)
    )

    # Extracting users from LeaderboardEntries
    # That could be included in the calculations
    # TODO: add exclusions for moderators (not yet migrated)
    #   Also add similar exclusions to other leaderboard types
    included_users = User.objects.filter(
        id__in=[x.user_id for x in entries if x.user_id], is_active=True
    ).values_list("pk", flat=True)

    if not include_bots:
        included_users = included_users.filter(is_bot=False)

    for entry in entries:
        if entry.user_id and entry.user_id not in included_users:
            excluded_ids.add(entry.user_id)

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
    total_take = sum(e.take for e in entries if not e.excluded and e.take is not None)
    for entry in entries:
        if total_take and not entry.excluded and entry.take is not None:
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

    if leaderboard.score_type == Leaderboard.ScoreTypes.MANUAL:
        return list(leaderboard.entries.all().order_by("rank"))

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

    return new_entries


def update_leaderboard_from_csv_data(
    leaderboard: Leaderboard, csv_data: str
) -> list[LeaderboardEntry]:
    """
    updates a maunal leaderboard directly from a csv file
    """
    if leaderboard.score_type != Leaderboard.ScoreTypes.MANUAL:
        raise ValueError("Leaderboard is not a manual leaderboard")

    reader = csv.DictReader(StringIO(csv_data))
    new_entries: list[LeaderboardEntry] = []

    for row in reader:
        user_id = row.get("user_id")
        aggregation_method = row.get("aggregation_method")
        score = row.get("score")
        take = row.get("take")
        rank = row.get("rank")
        excluded = row.get("excluded")
        medal = row.get("medal")
        percent_prize = row.get("percent_prize")
        prize = row.get("prize")
        coverage = row.get("coverage")
        contribution_count = row.get("contribution_count")
        calculated_on = row.get("calculated_on")

        new_entry = LeaderboardEntry(
            user_id=user_id,
            aggregation_method=aggregation_method,
            score=score,
            take=take,
            rank=rank,
            excluded=excluded,
            medal=medal,
            percent_prize=percent_prize,
            prize=prize,
            coverage=coverage,
            contribution_count=contribution_count,
            calculated_on=calculated_on,
        )
        new_entries.append(new_entry)

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
        comments = (
            Comment.objects.filter(
                on_post__in=public_posts,
                author=user,
                created_at__lte=leaderboard.end_time,
                comment_votes__isnull=False,
            )
            .annotate(
                vote_score=SubqueryAggregate(
                    "comment_votes__direction",
                    filter=Q(
                        created_at__gte=leaderboard.start_time,
                        created_at__lte=leaderboard.end_time,
                    ),
                    aggregate=Sum,
                )
            )
            .select_related("on_post")
            .distinct("pk")
        )

        contributions: list[Contribution] = []
        for comment in comments:
            contribution = Contribution(
                score=comment.vote_score or 0,
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
        ).prefetch_related("question")
        archived_scores = archived_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time
        ).prefetch_related("question")
    scores = list(archived_scores)

    # Create a set of (question_id, aggregation_method) pairs from archived_scores
    archived_pairs = {
        (archived_score.question_id, archived_score.aggregation_method)
        for archived_score in archived_scores
    }

    # Iterate over calculated_scores and append scores not in archived_pairs
    for score in calculated_scores:
        if (score.question_id, score.aggregation_method) not in archived_pairs:
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
