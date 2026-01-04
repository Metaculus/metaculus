import csv
import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from io import StringIO

import numpy as np
from django.db import transaction
from django.db.models import (
    QuerySet,
    Q,
    Sum,
    IntegerField,
    FloatField,
    OuterRef,
    Exists,
    When,
    Value,
    ExpressionWrapper,
    F,
    Case,
    Count,
    Func,
)
from django.db.models.functions import Coalesce, ExtractYear, Power
from django.utils import timezone
from django.utils.timezone import make_aware
from sql_util.aggregates import SubqueryAggregate

from comments.models import Comment
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.cache import invalidate_average_coverage_cache
from questions.constants import UnsuccessfulResolutionType
from questions.models import Question, Forecast, QuestionPost
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes, LeaderboardScoreTypes
from scoring.models import (
    ArchivedScore,
    Score,
    LeaderboardEntry,
    Leaderboard,
    MedalExclusionRecord,
    LeaderboardsRanksEntry,
)
from scoring.score_math import evaluate_question
from users.models import User
from utils.dtypes import generate_map_from_list
from utils.the_math.measures import decimal_h_index

logger = logging.getLogger(__name__)


def get_question_scores(
    question: Question,
    resolution: str | None,
    spot_scoring_time: datetime | None = None,
    score_types: list[str] | None = None,
    aggregation_methods: list[AggregationMethod] | None = None,
    only_include_user_ids: list[int] | None = None,
) -> list[Score]:
    if aggregation_methods is None:
        aggregation_methods = [
            AggregationMethod.RECENCY_WEIGHTED,
            AggregationMethod.UNWEIGHTED,
        ]
    if not spot_scoring_time:
        spot_scoring_time = question.get_spot_scoring_time()
    score_types = score_types or [s for s in ScoreTypes if s != ScoreTypes.MANUAL]

    new_scores = evaluate_question(
        question=question,
        resolution=resolution,
        score_types=score_types,
        spot_forecast_time=spot_scoring_time,
        aggregation_methods=aggregation_methods,
        only_include_user_ids=only_include_user_ids,
    )
    return new_scores


def score_question(
    question: Question,
    resolution: str,
    spot_scoring_time: datetime | None = None,
    score_types: list[str] | None = None,
    aggregation_methods: list[AggregationMethod] | None = None,
    only_include_user_ids: list[int] | None = None,
    protect_uncalculated_scores: bool = False,
):
    score_types = score_types or [s for s in ScoreTypes if s != ScoreTypes.MANUAL]
    new_scores = get_question_scores(
        question=question,
        resolution=resolution,
        spot_scoring_time=spot_scoring_time,
        score_types=score_types,
        aggregation_methods=aggregation_methods,
        only_include_user_ids=only_include_user_ids,
    )
    previous_scores = Score.objects.filter(
        question=question, score_type__in=score_types
    )
    previous_scores_map = {
        (score.user_id, score.aggregation_method, score.score_type): score.id
        for score in previous_scores
    }
    seen = set()
    for new_score in new_scores:
        previous_score_id = previous_scores_map.get(
            (new_score.user_id, new_score.aggregation_method, new_score.score_type)
        )
        if previous_score_id:
            seen.add(previous_score_id)

        new_score.id = previous_score_id
        new_score.question = question
        new_score.edited_at = question.resolution_set_time

    with transaction.atomic():
        scores_to_delete = previous_scores
        if protect_uncalculated_scores:
            scores_to_delete = scores_to_delete.filter(id__in=seen)
        scores_to_delete.delete()
        Score.objects.bulk_create(new_scores, batch_size=500)

    invalidate_average_coverage_cache([question])


def retrieve_question_scores(
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[Score | ArchivedScore]:
    score_type = LeaderboardScoreTypes.get_base_score(leaderboard.score_type) or F(
        "question__default_score_type"
    )
    qs_filters = {
        "question__in": questions,
        "score_type": score_type,
    }

    finalize_time = leaderboard.finalize_time or (
        leaderboard.project.close_date if leaderboard.project else None
    )
    if finalize_time:
        qs_filters["question__scheduled_close_time__lte"] = finalize_time
        qs_filters["question__resolution_set_time__lte"] = finalize_time

    user_list = leaderboard.user_list.all()
    if user_list:
        qs_filters["user__in"] = user_list.values_list("id", flat=True)

    archived_scores = ArchivedScore.objects.filter(**qs_filters).prefetch_related(
        "question"
    )
    calculated_scores = Score.objects.filter(**qs_filters).prefetch_related("question")

    archived_scores_subquery = ArchivedScore.objects.filter(
        question_id=OuterRef("question_id"),
        user_id=OuterRef("user_id"),
        aggregation_method=OuterRef("aggregation_method"),
        score_type=score_type,
    )
    if finalize_time:
        archived_scores_subquery = archived_scores_subquery.filter(
            question__scheduled_close_time__lte=finalize_time,
            question__resolution_set_time__lte=finalize_time,
        )

    calculated_scores = calculated_scores.annotate(
        archived_exists=Exists(archived_scores_subquery)
    ).filter(archived_exists=False)

    scores = list(archived_scores) + list(calculated_scores)
    scores = sorted(scores, key=lambda x: x.user_id or x.score)

    return scores


def generate_entries_from_scores(
    scores: list[Score | ArchivedScore],
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    entries: dict[int | AggregationMethod, LeaderboardEntry] = {}
    now = timezone.now()
    maximum_coverage = sum(
        q.question_weight
        for q in questions
        if q.resolution and q.resolution not in UnsuccessfulResolutionType
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
    if leaderboard.score_type == LeaderboardScoreTypes.PEER_GLOBAL:
        for entry in entries.values():
            entry.score /= max(30, entry.coverage)
    elif leaderboard.score_type == LeaderboardScoreTypes.PEER_GLOBAL_LEGACY:
        for entry in entries.values():
            entry.score /= max(40, entry.contribution_count)
    elif leaderboard.score_type in (
        LeaderboardScoreTypes.PEER_TOURNAMENT,
        LeaderboardScoreTypes.DEFAULT,
        LeaderboardScoreTypes.SPOT_PEER_TOURNAMENT,
        LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT,
    ):
        for entry in entries.values():
            entry.take = max(entry.score, 0) ** 2
    elif leaderboard.score_type == LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT:
        for entry in entries.values():
            entry.coverage /= maximum_coverage
            entry.take = entry.coverage * np.exp(entry.score)
        return sorted(entries.values(), key=lambda entry: entry.take, reverse=True)
    return sorted(entries.values(), key=lambda entry: entry.score, reverse=True)


def generate_scoring_leaderboard_entries(
    questions: list[Question],
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    scores = retrieve_question_scores(questions, leaderboard)
    return generate_entries_from_scores(scores, questions, leaderboard)


def generate_comment_insight_leaderboard_entries(
    leaderboard: Leaderboard,
) -> list[LeaderboardEntry]:
    now = timezone.now()
    if not leaderboard.project:
        return []

    if leaderboard.project.type == Project.ProjectTypes.SITE_MAIN:
        posts = Post.objects.filter_for_main_feed().exclude(
            curation_status__in=[
                Post.CurationStatus.DRAFT,
                Post.CurationStatus.PENDING,
                Post.CurationStatus.REJECTED,
                Post.CurationStatus.DELETED,
            ]
        )
    else:
        posts = Post.objects.filter(
            Q(projects=leaderboard.project) | Q(default_project=leaderboard.project)
        ).filter_published()

    comments = (
        Comment.objects.filter(
            on_post__in=posts,
        )
        .annotate(
            vote_score=Coalesce(
                SubqueryAggregate(
                    "comment_votes__direction",
                    filter=Q(
                        created_at__gte=leaderboard.start_time
                        or make_aware(datetime.min),
                        created_at__lte=leaderboard.end_time
                        or make_aware(datetime.max),
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

    user_list = leaderboard.user_list.all()
    if user_list:
        comments = comments.filter(author__in=user_list)

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
    questions = list(questions)

    user_forecasts_map = generate_map_from_list(
        Forecast.objects.filter(
            question__in=questions,
            start_time__gte=leaderboard.start_time or make_aware(datetime.min),
            start_time__lte=leaderboard.end_time or make_aware(datetime.max),
        ).only("question_id", "author_id"),
        key=lambda forecast: forecast.question_id,
    )
    question_post_map = {
        obj.question_id: obj.post
        for obj in QuestionPost.objects.filter(question__in=questions)
        .select_related("post__author")
        .prefetch_related("post__coauthors", "post__projects")
    }

    forecaster_ids_for_post: dict[Post, set[int]] = defaultdict(set)
    for question in questions:
        forecasts_during_period = user_forecasts_map.get(question.pk) or []
        forecasters = set(forecast.author_id for forecast in forecasts_during_period)
        post = question_post_map.get(question.id)
        if post:
            forecaster_ids_for_post[post].update(forecasters)

    exclusions: QuerySet[MedalExclusionRecord] = (
        MedalExclusionRecord.objects.all().select_related("user")
    )
    exclusion_dict: dict[User, list[MedalExclusionRecord]] = defaultdict(list)
    for exclusion in exclusions:
        exclusion_dict[exclusion.user].append(exclusion)

    user_list = list(leaderboard.user_list.all())
    scores_for_author: dict[User, list[float]] = defaultdict(list)
    for post, forecaster_ids in forecaster_ids_for_post.items():
        all_authors = [post.author] + list(post.coauthors.all())
        if user_list:
            all_authors = [a for a in all_authors if a in user_list]
        for author in all_authors:
            excluded = False
            for exclusion in exclusion_dict.get(author, []):
                # exclusion not applicable if post not published during exclusion period
                if (
                    exclusion.start_time and post.published_at < exclusion.start_time
                ) or (exclusion.end_time and post.published_at > exclusion.end_time):
                    continue
                if (
                    (exclusion.project_id is None and exclusion.leaderboard_id is None)
                    or (
                        exclusion.leaderboard_id
                        and exclusion.leaderboard_id == leaderboard.id
                    )
                    or (
                        exclusion.project_id
                        and (
                            exclusion.project_id == leaderboard.project_id
                            or exclusion.project_id == post.default_project_id
                            or (
                                exclusion.project_id
                                in post.projects.values_list("id", flat=True)
                            )
                        )
                    )
                ):
                    excluded = True
                    continue
                excluded = True
                break
            if not excluded:
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

    if leaderboard.score_type == LeaderboardScoreTypes.COMMENT_INSIGHT:
        return generate_comment_insight_leaderboard_entries(leaderboard)
    questions = questions or leaderboard.get_questions()
    if leaderboard.score_type == LeaderboardScoreTypes.QUESTION_WRITING:
        return generate_question_writing_leaderboard_entries(questions, leaderboard)
    # We have a scoring based leaderboard
    return generate_scoring_leaderboard_entries(questions, leaderboard)


def assign_ranks(
    entries: list[LeaderboardEntry],
    leaderboard: Leaderboard,
    include_humans: bool = True,
    include_bots: bool = False,
) -> list[LeaderboardEntry]:
    RelativeLegacy = LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT
    if leaderboard.score_type == RelativeLegacy:
        entries.sort(key=lambda entry: entry.take, reverse=True)
    else:
        entries.sort(key=lambda entry: entry.score, reverse=True)

    # set up exclusions
    exclusion_records = MedalExclusionRecord.objects.filter(
        (Q(project__isnull=True) & Q(leaderboard__isnull=True))
        | Q(leaderboard=leaderboard)
        | Q(project=leaderboard.project),
    )
    start_time = leaderboard.start_time or (
        leaderboard.project.start_date if leaderboard.project else None
    )
    end_time = leaderboard.end_time or (
        leaderboard.project.close_date if leaderboard.project else None
    )
    finalize_time = leaderboard.finalize_time or (
        leaderboard.project.close_date if leaderboard.project else None
    )
    if start_time:
        exclusion_records = exclusion_records.filter(
            Q(end_time__isnull=True) | Q(end_time__gte=start_time)
        )
    if end_time:
        # only exclude by end_time if it's set
        exclusion_records = exclusion_records.filter(
            Q(start_time__isnull=True) | Q(start_time__lte=end_time)
        )
    elif finalize_time:
        # if end_time is not set, use finalize_time
        exclusion_records = exclusion_records.filter(
            Q(start_time__isnull=True) | Q(start_time__lte=finalize_time)
        )

    candidates: QuerySet[User] = User.objects.filter(
        id__in=[x.user_id for x in entries if x.user_id], is_active=True
    ).only("id")

    # dictionary of {excluded user id : show anyway status}
    shown_exclusions_dict = {None: True}  # aggregations always excluded but shown
    for exclusion in exclusion_records:
        if exclusion.user_id not in shown_exclusions_dict:
            shown_exclusions_dict[exclusion.user_id] = False
        shown_exclusions_dict[exclusion.user_id] = (
            shown_exclusions_dict[exclusion.user_id] or exclusion.show_anyway
        )
    if not include_humans:
        for user in candidates.filter(is_bot=False):
            if user.id not in shown_exclusions_dict:
                shown_exclusions_dict[user.id] = True
    if not include_bots:
        for user in candidates.filter(is_bot=True):
            if user.id not in shown_exclusions_dict:
                shown_exclusions_dict[user.id] = True

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
        if entry.user_id in shown_exclusions_dict:
            entry.excluded = True
            entry.show_when_excluded = shown_exclusions_dict[entry.user_id]
        else:
            rank += 1

    return entries


def assign_prize_percentages(
    entries: list[LeaderboardEntry], minimum_prize_percent: float
) -> list[LeaderboardEntry]:
    # Distribute prize % according to take
    # anyone who takes less than the minimum gets redistributed up iteratively
    scoring_take = sum((e.take or 0) * int(not e.excluded) for e in entries)
    for entry in entries[::-1]:  # start in reverse
        entry.percent_prize = 0
        if entry.excluded or not entry.take:
            continue
        percent_prize = entry.take / (scoring_take or 1)
        if percent_prize < minimum_prize_percent:
            # remove take from pool since they don't get prize
            scoring_take -= entry.take
        else:
            entry.percent_prize = percent_prize
    percent_prize_sum = sum(entry.percent_prize for entry in entries) or 1
    for entry in entries:
        entry.percent_prize /= percent_prize_sum
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


def calculate_medals_points_at_time(at_time):
    """
    Calculate the medal points for all users who have received a medal
    (either on global leaderboards or tournament leaderboards)
    The points are calculated based on this idea:

    medal points are 10 for gold, 4 for silver, and 1 for bronze
    tournament_rank = sum(
        [medal.points * exp(-2 * (now.year - medal.date.year)) for medal in tournament_medals]
    )
    … and similarly for other medal categories

    """

    # Look only at leaderboard entries which are closed before the timestamp
    relevant_entries_qs = LeaderboardEntry.objects.filter(
        Q(leaderboard__end_time__lte=at_time)
        | Q(leaderboard__project__close_date__lte=at_time),
        leaderboard__project__default_permission=ObjectPermission.FORECASTER,
    )

    # Get the age, in years, for each leaderboard, and use it to
    # exp-decay the points associated with each medal (older medals weigh less)
    leaderboard_age_expr = Case(
        When(
            leaderboard__project__type="tournament",
            then=(at_time.year - ExtractYear(F("leaderboard__project__close_date"))),
        ),
        When(
            leaderboard__end_time__isnull=False,
            then=(
                at_time.year
                - ExtractYear(
                    Func(
                        F("leaderboard__end_time"),
                        function="",  # 6month round the year to the closest one
                        template="(%(expressions)s - INTERVAL '6 MONTH')",
                    )
                )
            ),
        ),
        default=Value(0),
        output_field=IntegerField(),
    )

    base_points_expr = Case(
        When(medal=LeaderboardEntry.Medals.GOLD, then=Value(10)),
        When(medal=LeaderboardEntry.Medals.SILVER, then=Value(4)),
        When(medal=LeaderboardEntry.Medals.BRONZE, then=Value(1)),
        default=Value(0),
        output_field=IntegerField(),
    )

    # Decay the points
    decayed_points_by_age_vexpr = ExpressionWrapper(
        F("base_points") * Power(Value(2), -F("leaderboard_age")),
        output_field=FloatField(),
    )

    points_type_expr = Case(
        When(
            leaderboard__score_type__in=[
                LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT,
                LeaderboardScoreTypes.PEER_TOURNAMENT,
                LeaderboardScoreTypes.SPOT_PEER_TOURNAMENT,
                LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT,
            ],
            then=Value(LeaderboardsRanksEntry.RankTypes.TOURNAMENTS_GLOBAL),
        ),
        When(
            leaderboard__score_type__in=[
                LeaderboardScoreTypes.PEER_GLOBAL,
                LeaderboardScoreTypes.PEER_GLOBAL_LEGACY,
            ],
            then=Value(LeaderboardsRanksEntry.RankTypes.PEER_GLOBAL),
        ),
        When(
            leaderboard__score_type__in=[
                LeaderboardScoreTypes.BASELINE_GLOBAL,
            ],
            then=Value(LeaderboardsRanksEntry.RankTypes.BASELINE_GLOBAL),
        ),
        When(
            leaderboard__score_type__in=[
                LeaderboardScoreTypes.COMMENT_INSIGHT,
            ],
            then=Value(LeaderboardsRanksEntry.RankTypes.COMMENTS_GLOBAL),
        ),
        When(
            leaderboard__score_type__in=[LeaderboardScoreTypes.QUESTION_WRITING],
            then=Value(LeaderboardsRanksEntry.RankTypes.QUESTIONS_GLOBAL),
        ),
    )

    points_qs = relevant_entries_qs.filter(medal__isnull=False).annotate(
        leaderboard_age=leaderboard_age_expr,
        base_points=base_points_expr,
        points=decayed_points_by_age_vexpr,
        points_type=points_type_expr,
    )

    totals = (
        relevant_entries_qs.filter(excluded=False)
        .annotate(
            points_type=points_type_expr,
        )
        .values("points_type")
        .annotate(total_participants=Count("user", distinct=True))
    )

    points = (
        points_qs.values("user", "points_type")
        .annotate(
            total_points=Sum("points"),
        )
        .order_by("points_type", "-total_points")
    )

    return points, totals.values_list("points_type", "total_participants")


def update_medal_points_and_ranks(at_time=None):
    at_time = at_time or timezone.now()
    point_values, totals = calculate_medals_points_at_time(at_time)

    for points_type_dict in LeaderboardsRanksEntry.RankTypes.choices:
        points_type = points_type_dict[0]
        qs = point_values.filter(points_type=points_type)
        count = qs.count()
        logging.info(f"Updating {count} entries for {points_type}")
        if count < 1:
            continue
        total_participants = totals.get(points_type=points_type)[1]
        objects = []
        for idx, pv in enumerate(qs):
            obj = LeaderboardsRanksEntry(
                user_id=pv["user"],
                rank_type=points_type,
                points=pv["total_points"],
                rank_timestamp=at_time,
                rank=idx + 1,
                rank_total=total_participants,
            )

            objects.append(obj)

        LeaderboardsRanksEntry.objects.bulk_create(
            objs=objects,
            ignore_conflicts=False,
            update_conflicts=True,
            update_fields=[
                "user",
                "rank_type",
                "rank",
                "rank_total",
                "points",
                "rank_timestamp",
            ],
            unique_fields=["user", "rank_type"],
            batch_size=1000,
        )

        # Update the best rank related fields
        LeaderboardsRanksEntry.objects.filter(
            Q(best_rank__isnull=True)
            | Q(best_rank__gt=F("rank") * F("best_rank_total") / F("rank_total"))
        ).update(
            best_rank=F("rank"),
            best_rank_total=F("rank_total"),
            best_rank_timestamp=F("rank_timestamp"),
        )


def assign_prizes(
    entries: list[LeaderboardEntry], prize_pool: Decimal
) -> list[LeaderboardEntry]:
    included = [e for e in entries if not e.excluded]
    for entry in included:
        entry.prize = float(prize_pool) * entry.percent_prize
    return entries


def process_entries_for_leaderboard(
    entries: list[LeaderboardEntry],
    project: Project,
    leaderboard: Leaderboard,
    force_finalize: bool = False,
) -> list[LeaderboardEntry]:
    # assign ranks - also applies exclusions
    bot_status = leaderboard.bot_status or project.bot_leaderboard_status
    bots_get_ranks = bot_status in [
        Project.BotLeaderboardStatus.BOTS_ONLY,
        Project.BotLeaderboardStatus.INCLUDE,
    ]
    humans_get_ranks = bot_status != Project.BotLeaderboardStatus.BOTS_ONLY
    entries = assign_ranks(
        entries,
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
    entries = assign_prize_percentages(entries, minimum_prize_percent)

    if prize_pool:  # always assign prizes
        entries = assign_prizes(entries, prize_pool)
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
            entries = assign_medals(entries)
        # always set finalize
        Leaderboard.objects.filter(pk=leaderboard.pk).update(finalized=True)

    # save entries
    previous_entries_map = {
        (entry.user_id, entry.aggregation_method): entry.id
        for entry in leaderboard.entries.all()
    }

    for entry in entries:
        entry.leaderboard = leaderboard
        entry.id = previous_entries_map.get((entry.user_id, entry.aggregation_method))

    with transaction.atomic():
        leaderboard.entries.all().delete()
        LeaderboardEntry.objects.bulk_create(entries, batch_size=500)

    return entries


def update_project_leaderboard(
    project: Project | None = None,
    leaderboard: Leaderboard | None = None,
    force_update: bool = False,
    force_finalize: bool = False,
) -> list[LeaderboardEntry]:
    if project is None and leaderboard is None:
        raise ValueError("Either project or leaderboard must be provided")

    leaderboard = leaderboard or project.primary_leaderboard
    project = project or leaderboard.project
    if not leaderboard:
        raise ValueError("Leaderboard not found")

    if leaderboard.score_type == LeaderboardScoreTypes.MANUAL:
        logger.info("%s is manual, not updating", leaderboard.name)
        return list(leaderboard.entries.all().order_by("rank"))

    if not force_update and leaderboard.finalized:
        logger.warning("%s is already finalized, not updating", str(leaderboard))
        return list(leaderboard.entries.all().order_by("rank"))

    # new entries
    new_entries = generate_project_leaderboard(project, leaderboard)

    # process entries
    processed_entries = process_entries_for_leaderboard(
        new_entries, project, leaderboard, force_finalize=force_finalize
    )
    return processed_entries


def update_leaderboard_from_csv_data(
    leaderboard: Leaderboard, csv_data: str
) -> list[LeaderboardEntry]:
    """
    updates a maunal leaderboard directly from a csv file
    """
    if leaderboard.score_type != LeaderboardScoreTypes.MANUAL:
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


def get_contribution_comment_insight(user: User, leaderboard: Leaderboard):
    if not leaderboard.project:
        return []
    if leaderboard.project.type == Project.ProjectTypes.SITE_MAIN:
        posts = Post.objects.filter_for_main_feed().filter_published()
    else:
        posts = Post.objects.filter(
            Q(projects=leaderboard.project) | Q(default_project=leaderboard.project)
        ).filter_published()

    comments = (
        Comment.objects.filter(
            on_post__in=posts,
            author=user,
            created_at__lte=leaderboard.end_time or make_aware(datetime.max),
            comment_votes__isnull=False,
        )
        .annotate(
            vote_score=SubqueryAggregate(
                "comment_votes__direction",
                filter=Q(
                    created_at__gte=leaderboard.start_time or make_aware(datetime.min),
                    created_at__lte=leaderboard.end_time or make_aware(datetime.max),
                ),
                aggregate=Sum,
            )
        )
        .exclude(vote_score=0)
        .distinct("pk")
    )

    # Using Comment.prefetch_related("on_post") is not efficient in this scenario,
    # as we may retrieve 10k+ rows, each requiring a JOIN on a large Post record,
    # significantly slowing down serialization and data fetching.
    # Instead, we perform a custom mapping fetch to optimize this process.
    posts_map = {
        p.id: p for p in Post.objects.filter(comments__in=comments).distinct("pk")
    }
    contributions = [
        Contribution(
            score=comment.vote_score,
            post=posts_map[comment.on_post_id],
            comment=comment,
        )
        for comment in comments
    ]
    contributions = sorted(contributions, key=lambda c: c.score, reverse=True)

    h_index = decimal_h_index([c.score for c in contributions])
    min_score = contributions[: max(int(h_index), 1)][-1].score if contributions else 0
    return [c for c in contributions if c.score >= min_score]


def get_contribution_question_writing(user: User, leaderboard: Leaderboard):
    question_ids = list(
        leaderboard.get_questions()
        .filter(
            Q(related_posts__post__author_id=user.id)
            | Q(related_posts__post__coauthors=user)
        )
        .distinct("id")
        .values_list("id", flat=True)
    )

    # Now fetch full questions for later iteration
    questions = Question.objects.filter(id__in=question_ids).prefetch_related(
        "related_posts__post"
    )

    user_forecasts_map = generate_map_from_list(
        Forecast.objects.filter(
            question_id__in=question_ids,
            start_time__gte=leaderboard.start_time or make_aware(datetime.min),
            start_time__lte=leaderboard.end_time or make_aware(datetime.max),
        ).only("question_id", "author_id"),
        key=lambda forecast: forecast.question_id,
    )
    question_post_map = {
        obj.question_id: obj.post
        for obj in QuestionPost.objects.filter(question_id__in=question_ids)
        .select_related("post__author")
        .prefetch_related("post__coauthors", "post__projects")
    }

    forecaster_ids_for_post: dict[Post, set[int]] = defaultdict(set)
    for question in questions:
        forecasts_during_period = user_forecasts_map.get(question.pk) or []
        forecasters = set(forecast.author_id for forecast in forecasts_during_period)
        post = question_post_map.get(question.id)
        if post:
            forecaster_ids_for_post[post].update(forecasters)

    exclusions = MedalExclusionRecord.objects.filter(user=user)
    contributions: list[Contribution] = []
    for post, forecaster_ids in forecaster_ids_for_post.items():
        excluded = False
        for exclusion in exclusions:
            # exclusion not applicable if post not published during exclusion period
            if (exclusion.start_time and post.published_at < exclusion.start_time) or (
                exclusion.end_time and post.published_at > exclusion.end_time
            ):
                continue
            if (
                (exclusion.project_id is None and exclusion.leaderboard_id is None)
                or (
                    exclusion.leaderboard_id
                    and exclusion.leaderboard_id == leaderboard.id
                )
                or (
                    exclusion.project_id
                    and (
                        exclusion.project_id == leaderboard.project_id
                        or exclusion.project_id == post.default_project_id
                        or (
                            exclusion.project_id
                            in post.projects.values_list("id", flat=True)
                        )
                    )
                )
            ):
                excluded = True
                continue
            excluded = True
            break
        if not excluded:
            # we use the h-index by number of forecasters divided by 10
            contributions.append(Contribution(score=len(forecaster_ids), post=post))

    contributions = sorted(contributions, key=lambda c: c.score, reverse=True)

    return contributions


def get_contributions(
    user: User,
    leaderboard: Leaderboard,
    with_live_coverage: bool = False,
) -> list[Contribution]:
    if leaderboard.score_type == LeaderboardScoreTypes.COMMENT_INSIGHT:
        return get_contribution_comment_insight(user, leaderboard)

    if leaderboard.score_type == LeaderboardScoreTypes.QUESTION_WRITING:
        return get_contribution_question_writing(user, leaderboard)

    # Scoring Leaderboards
    questions = (
        leaderboard.get_questions()
        .prefetch_related("related_posts__post")
        .filter(Q(related_posts__post__published_at__lt=timezone.now()))
    )

    # Extract question IDs first to avoid complex subqueries in Score filters
    # This is much faster than using question__in=queryset which creates a subquery
    # Because PSQL recalculates it for every row
    question_ids = list(questions.values_list("id", flat=True))

    user_question_forecasts_map = generate_map_from_list(
        Forecast.objects.filter(question_id__in=question_ids, author_id=user.id),
        key=lambda f: f.question_id,
    )

    score_type = LeaderboardScoreTypes.get_base_score(leaderboard.score_type) or F(
        "question__default_score_type"
    )

    calculated_scores = Score.objects.filter(
        question_id__in=question_ids,
        user=user,
        score_type=score_type,
    ).prefetch_related("question__related_posts__post")
    archived_scores = ArchivedScore.objects.filter(
        question_id__in=question_ids,
        user=user,
        score_type=score_type,
    ).prefetch_related("question__related_posts__post")

    if leaderboard.finalize_time:
        calculated_scores = calculated_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time,
            question__resolution_set_time__lte=leaderboard.finalize_time,
        ).prefetch_related("question")
        archived_scores = archived_scores.filter(
            question__scheduled_close_time__lte=leaderboard.finalize_time,
            question__resolution_set_time__lte=leaderboard.finalize_time,
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
        Contribution(
            score=s.score,
            coverage=s.coverage,
            question=s.question,
            post=s.question.get_post(),
        )
        for s in scores
    ]
    # add unpopulated contributions for other questions
    scored_question = {score.question for score in scores}
    if leaderboard.score_type in [
        LeaderboardScoreTypes.PEER_TOURNAMENT,
        LeaderboardScoreTypes.DEFAULT,
        LeaderboardScoreTypes.SPOT_PEER_TOURNAMENT,
        LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT,
        LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT,
        LeaderboardScoreTypes.MANUAL,
    ]:
        for question in questions:
            if question not in scored_question:
                coverage = None
                if with_live_coverage:
                    # coverage is added for questions that the user has predicted
                    forecast_horizon_start = question.open_time.timestamp()
                    forecast_horizon_end = question.scheduled_close_time.timestamp()
                    now = timezone.now().timestamp()
                    covered = 0
                    user_forecasts = user_question_forecasts_map.get(question.id, [])
                    for forecast in user_forecasts:
                        forecast_start = max(
                            forecast.start_time.timestamp(), forecast_horizon_start
                        )
                        forecast_end = min(
                            (
                                forecast.end_time or question.scheduled_close_time
                            ).timestamp(),
                            forecast_horizon_end,
                            now,
                        )
                        covered += max(0, forecast_end - forecast_start)
                    coverage = covered / (forecast_horizon_end - forecast_horizon_start)

                contribution = Contribution(
                    score=None,
                    coverage=coverage or None,
                    question=question,
                    post=question.get_post(),
                )
                contributions.append(contribution)

    contributions = sorted(
        contributions,
        key=lambda c: (
            bool(c.score),
            c.score or 0,
            bool(c.coverage),
            -c.question.open_time.timestamp(),
        ),
        reverse=True,
    )

    return contributions
