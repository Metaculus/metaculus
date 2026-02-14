import random
from collections import defaultdict
import csv
from pathlib import Path

from datetime import datetime, timedelta, timezone as dt_timezone
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Exists, OuterRef, Prefetch, QuerySet, Q
from django.utils import timezone
import numpy as np
from scipy import sparse, stats
from sklearn.linear_model import Ridge

from posts.models import Post
from projects.models import Project
from questions.constants import UnsuccessfulResolutionType
from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes, LeaderboardScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry, Score, ExclusionStatuses
from scoring.score_math import (
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
    get_geometric_means,
)
from users.models import User
from utils.the_math.aggregations import get_aggregation_history
from utils.the_math.formulas import string_location_to_bucket_index

SkillType = dict[int | str, float]


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
    users: QuerySet[User],
    questions: QuerySet[Question],
    cache_use: str | None = "partial",
) -> tuple[
    list[int | str], list[int | str], list[int], list[float], list[float], list[float]
]:
    user1_ids: list[int | str] = []
    user2_ids: list[int | str] = []
    question_ids: list[int] = []
    scores: list[float] = []
    coverages: list[float] = []
    timestamps: list[float] = []
    if cache_use == "full":
        # load all from cache, don't calculate more
        def _deserialize_user(value: str) -> int | str:
            value = value.strip()
            if not value:
                return value
            try:
                return int(value)
            except ValueError:
                return value

        csv_path = Path("HtH_score_data.csv")
        with csv_path.open("r") as input_file:
            reader = csv.DictReader(input_file)
            for row in reader:
                user1_ids.append(_deserialize_user(row["user1"]))
                user2_ids.append(_deserialize_user(row["user2"]))
                question_ids.append(int(row["questionid"]))
                scores.append(float(row["score"]))
                coverages.append(float(row["coverage"]))
                timestamps.append(float(row["timestamp"]))

        return (user1_ids, user2_ids, question_ids, scores, coverages, timestamps)

    if cache_use == "partial":
        csv_path = Path("HtH_score_data.csv")
        if not csv_path.exists():
            with csv_path.open("w") as output_file:
                writer = csv.writer(output_file)
                writer.writerow(
                    ["user1", "user2", "questionid", "score", "coverage", "timestamp"]
                )
        with csv_path.open("r") as input_file:
            reader = csv.DictReader(input_file)
            for row in reader:
                question_ids.append(int(row["questionid"]))
    cached_question_ids = set(question_ids)
    question_ids = []

    # TODO: make authoritative mapping
    print("creating AIB <> Pro AIB question mapping...", end="\r")
    aib_projects = Project.objects.filter(
        id__in=[
            3349,  # Q3 2024
            32506,  # Q4 2024
            32627,  # Q1 2025
            32721,  # Q2 2025
            32813,  # fall 2025
            32916,  # Q1 2026
        ]
    )
    aib_to_pro_version = {
        3349: 3345,
        32506: 3673,
        32627: 32631,
        32721: 32761,
        32813: None,
        32916: 32930,
    }
    aib_question_map: dict[Question, Question | None] = dict()
    for aib in aib_projects:
        pro_id = aib_to_pro_version[aib.id]
        aib_questions = Question.objects.filter(post__default_project=aib)
        pro_questions_by_title: dict[str, Question] = {
            q.title: q
            for q in (
                []
                if not pro_id
                else Question.objects.filter(
                    post__default_project=pro_id,
                    resolution__isnull=False,
                ).exclude(resolution__in=UnsuccessfulResolutionType)
            )
        }
        for question in aib_questions:
            aib_question_map[question] = pro_questions_by_title.get(
                question.title, None
            )
    print("creating AIB <> Pro AIB question mapping...DONE\n")
    #
    user_ids = users.values_list("id", flat=True)
    t0 = datetime.now()
    question_count = questions.count()
    questions = list(questions)
    cache_interval = 100
    print("Processing Pairwise Scoring:")
    print("|   Question  |  ID   |   Pairing   |    Duration    | Est. Duration  |")
    for question_number, question in enumerate(questions, 1):
        # TODO: cache results every ~100 questions, clearing lists of values
        question_print_str = (
            f"\033[K"
            f"| {question_number:>5}/{question_count:<5} "
            f"| {question.id:<5} "
        )
        if question.id in cached_question_ids:
            # Skip questions that are already cached
            duration = datetime.now() - t0
            est_duration = duration / question_number * question_count
            print(
                f"{question_print_str}"
                f"| {'N':>5}/{'A':<5} "
                f"| {duration} "
                f"| {est_duration} "
                "|",
                end="\r",
            )
            continue
        # Get forecasts
        forecast_dict: dict[int | str, list[Forecast | AggregateForecast]] = (
            defaultdict(list)
        )
        # bot forecasts
        bot_forecasts = question.user_forecasts.filter(author_id__in=user_ids).order_by(
            "start_time"
        )
        for f in bot_forecasts:
            forecast_dict[f.author_id].append(f)
        # human aggregate forecasts - conditional on a bunch of stuff
        human_question: Question | None = aib_question_map.get(question, question)
        if not human_question:
            aggregate_forecasts: list[AggregateForecast] = []
        else:
            if question in aib_question_map:
                question.default_score_type = ScoreTypes.SPOT_PEER
            aggregation_method = (
                AggregationMethod.UNWEIGHTED
                if question.default_score_type == ScoreTypes.SPOT_PEER
                else AggregationMethod.RECENCY_WEIGHTED
            )
            # aggregate_forecasts = human_question.aggregate_forecasts.filter(
            #     method=aggregation_method
            # ).order_by("start_time")
            aggregate_forecasts = get_aggregation_history(
                human_question,
                [aggregation_method],
                minimize=100,
                include_stats=False,
                include_bots=False,
                include_future=False,
            )[aggregation_method]
            if not aggregate_forecasts:
                pass
            elif question in aib_question_map:
                # set the last aggregate to be the one that gets scored
                # TODO: instead grab the aggregate that was live at spot scoring time
                forecast = aggregate_forecasts[-1]
                forecast.start_time = question.get_spot_scoring_time() - timedelta(
                    seconds=1
                )
                forecast.end_time = None
                forecast_dict["Pro Aggregate"] = [forecast]
            else:
                forecast_dict["Community Aggregate"] = aggregate_forecasts

        forecaster_ids = sorted(list(forecast_dict.keys()), key=str, reverse=True)
        pairing_index = 0
        pairing_count = int(len(forecaster_ids) * (len(forecaster_ids) - 1) / 2)
        for i, user1_id in enumerate(forecaster_ids):
            for user2_id in forecaster_ids[i + 1 :]:
                pairing_index += 1
                duration = datetime.now() - t0
                est_duration = duration / question_number * question_count
                print(
                    f"{question_print_str}"
                    f"| {pairing_index:>5}/{pairing_count:<5} "
                    f"| {duration} "
                    f"| {est_duration} "
                    "|",
                    end="\r",
                )
                result = get_score_pair(
                    forecast_dict[user1_id],
                    forecast_dict[user2_id],
                    question,
                )
                if result:
                    q, u1s, cov = result
                    user1_ids.append(user1_id)
                    user2_ids.append(user2_id)
                    question_ids.append(q)
                    scores.append(u1s)
                    coverages.append(cov)
                    timestamps.append(question.actual_close_time.timestamp())
        if cache_use == "partial" and question_number % cache_interval == 0:
            print(f"\nCaching {len(user1_ids)} matches...")
            with csv_path.open("a") as output_file:
                writer = csv.writer(output_file)
                for row in zip(
                    user1_ids, user2_ids, question_ids, scores, coverages, timestamps
                ):
                    writer.writerow(row)
            user1_ids = []
            user2_ids = []
            question_ids = []
            scores = []
            coverages = []
            timestamps = []
    print("\n")

    if cache_use:
        with csv_path.open("a") as output_file:
            writer = csv.writer(output_file)
            for row in zip(
                user1_ids, user2_ids, question_ids, scores, coverages, timestamps
            ):
                writer.writerow(row)
        user1_ids = []
        user2_ids = []
        question_ids = []
        scores = []
        coverages = []
        timestamps = []

        def _deserialize_user(value: str) -> int | str:
            value = value.strip()
            if not value:
                return value
            try:
                return int(value)
            except ValueError:
                return value

        with csv_path.open("r") as input_file:
            reader = csv.DictReader(input_file)
            for row in reader:
                user1_ids.append(_deserialize_user(row["user1"]))
                user2_ids.append(_deserialize_user(row["user2"]))
                question_ids.append(int(row["questionid"]))
                scores.append(float(row["score"]))
                coverages.append(float(row["coverage"]))
                timestamps.append(float(row["timestamp"]))

    return (user1_ids, user2_ids, question_ids, scores, coverages, timestamps)


def get_avg_scores(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    scores: list[float],
    coverages: list[float],
) -> dict[int | str, float]:
    # get per-player coverage-weighted average score
    scores_by_player: dict[int | str, list[float]] = defaultdict(lambda: [0.0, 0.0])
    for u1id, u2id, score, coverage in zip(user1_ids, user2_ids, scores, coverages):
        u1 = scores_by_player[u1id]
        u1[0] += score * coverage
        u1[1] += coverage
        u2 = scores_by_player[u2id]
        u2[0] -= score * coverage
        u2[1] += coverage
    avg_scores = dict()
    for uid, (coverage_weighted_score_sum, coverage_sum) in scores_by_player.items():
        avg_scores[uid] = coverage_weighted_score_sum / coverage_sum
    return avg_scores


def estimate_variances_from_head_to_head(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    question_ids: list[int],
    scores: list[float],
    weights: list[float],
    min_questions_for_true=100,
    min_paired_matches=100,
    verbose: bool | None = None,
) -> float:
    """
    Helper function: Estimate σ_error and σ_true from head-to-head data.

    Returns:
        alpha: estimated standard deviations and regularization parameter
    """
    verbose = False if verbose is None else verbose
    # Estimate σ_error from paired matches
    matchups: dict[tuple[int | str, int | str], dict[str, list[float]]] = defaultdict(
        lambda: {"scores": [], "weights": []}
    )
    for user1_id, user2_id, score, weight in zip(user1_ids, user2_ids, scores, weights):
        pair = (user1_id, user2_id)
        matchups[pair]["scores"].append(score)
        matchups[pair]["weights"].append(weight)
    # Calculate weighted variance within each matchup
    rematch_variances = []
    for pair, data in matchups.items():
        pair_scores = np.array(data["scores"])
        pair_weights = np.array(data["weights"])
        if len(pair_scores) >= min_paired_matches:
            weighted_mean = np.average(pair_scores, weights=pair_weights)
            weighted_var = np.average(
                (pair_scores - weighted_mean) ** 2, weights=pair_weights
            )
            rematch_variances.append(weighted_var)
    error = np.sqrt(np.mean(rematch_variances)) if rematch_variances else 1
    error = 1 if np.isnan(error) else error

    # Estimating σ_true
    # Quick ridge regression to estimate skills
    players = set(user1_ids) | set(user2_ids)
    player_to_idx = {p: i for i, p in enumerate(players)}
    n_players = len(players)
    # Use small λ for initial fit
    lambda_init = error**2 / 1.0  # Assume unit variance initially
    # Build normal equations: (X^T W X + λI)β = X^T W y
    XTX = np.zeros((n_players, n_players))
    XTy = np.zeros(n_players)
    for user1_id, user2_id, score, coverage in zip(
        user1_ids, user2_ids, scores, weights
    ):
        i = player_to_idx[user1_id]
        j = player_to_idx[user2_id]
        XTX[i, i] += coverage
        XTX[j, j] += coverage
        XTX[i, j] -= coverage
        XTX[j, i] -= coverage
        XTy[i] += coverage * score
        XTy[j] -= coverage * score
    # Add ridge penalty and solve
    XTX += lambda_init * np.eye(n_players)
    skills = np.linalg.solve(XTX, XTy)
    # Get variance of skills only for high-participation players
    questions_participated: dict[int | str, set[int]] = defaultdict(set)
    for user1_id, user2_id, question_id in zip(user1_ids, user2_ids, question_ids):
        questions_participated[user1_id].add(question_id)
        questions_participated[user2_id].add(question_id)
    high_match_skills = []
    for player in players:
        if len(questions_participated[player]) >= min_questions_for_true:
            high_match_skills.append([skills[player_to_idx[player]]])
    skill_variance = (
        np.var(high_match_skills, ddof=1) if len(high_match_skills) > 1 else 1
    )
    skill_variance = 1 if np.isnan(skill_variance) else skill_variance

    alpha = (error / skill_variance) ** 2
    if verbose:
        print(
            f"Found {len(rematch_variances)} matchups with >={min_paired_matches} rematches"
        )
        print(f"σ_error (match noise): {error:.4f}")
        print(
            f"Found {len(high_match_skills)} players with >={min_questions_for_true} questions"
        )
        print(f"σ_true (skill variance): {skill_variance:.4f}")
        print(f"alpha = (σ_error / σ_true)² = {alpha:.4f}")
    return alpha


def compute_skills(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    scores: list[float],
    weights: list[float],  # normalized coverages
    alpha: float,
) -> SkillType:
    """
    Compute player skills using weighted ridge regression with fixed baseline.

    The model: For each match i, we model the score as:
        score_i = skill[player_a_i] - skill[player_b_i] + error_i

    Ridge regression solves:
        minimize: sum(weight_i * (score_i - predicted_i)^2) + alpha * sum(skill_j^2)

    The regularization term (alpha * sum(skill_j^2)) shrinks skills toward zero,
    which is especially important for players with few matches. Higher alpha means
    more shrinkage, preventing overfitting.
    """
    match_count = len(scores)
    user_ids = set(user1_ids) | set(user2_ids)
    player_to_idx = {p: i for i, p in enumerate(user_ids)}

    X = sparse.lil_matrix((match_count, len(user_ids)))
    y = np.zeros(match_count)
    for i, u1id, u2id, score in zip(range(match_count), user1_ids, user2_ids, scores):
        y[i] = score
        X[i, player_to_idx[u1id]] = 1
        X[i, player_to_idx[u2id]] = -1
    X = X.tocsr()

    # Fit with intercept=True so sklearn centers the solution
    # This effectively enforces sum-to-zero constraint
    model = Ridge(alpha=alpha, fit_intercept=False, solver="lsqr")
    model.fit(X, y, sample_weight=weights)
    # Extract estimated skills
    skills = {p: model.coef_[i] for i, p in enumerate(user_ids)}

    return skills


def rescale_skills_(
    skills: SkillType,
    baseline_player: int | str,
    var_avg_scores: float,
) -> SkillType:
    """
    rescaled to have skills in same range as peer scores
    NOTE: changes skills in place
    """
    # shift so baseline player has skill == 0
    baseline_shift = skills[baseline_player]
    for player in skills.keys():
        skills[player] -= baseline_shift
    # apply variance scaling
    var_skills = np.var(np.array(list(skills.values()))) if len(skills) > 1 else 0
    scale_factor = np.sqrt(var_avg_scores / var_skills)
    for uid in skills:
        skills[uid] *= scale_factor
    print("Scale factor", scale_factor)
    return skills


def get_skills(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    question_ids: list[int],
    scores: list[float],
    weights: list[float],
    baseline_player: int | str,
    var_avg_scores: float,
    verbose: bool | None = None,
) -> SkillType:
    alpha = estimate_variances_from_head_to_head(
        user1_ids=user1_ids,
        user2_ids=user2_ids,
        question_ids=question_ids,
        scores=scores,
        weights=weights,
        verbose=verbose,
    )
    skills = compute_skills(
        user1_ids=user1_ids,
        user2_ids=user2_ids,
        scores=scores,
        weights=weights,
        alpha=alpha,
    )
    # Apply baseline and variance rescaling
    skills = rescale_skills_(
        skills=skills,
        baseline_player=baseline_player,
        var_avg_scores=var_avg_scores,
    )
    return skills


def bootstrap_skills(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    question_ids: list[int],
    scores: list[float],
    weights: list[float],
    var_avg_scores: float,
    baseline_player: int | str = 269196,
    bootstrap_iterations: int = 30,
) -> tuple[SkillType, SkillType]:
    """
    get Confidence Intervals around the skills using Bootstrapping
    Compute bootstrap confidence intervals for skills.

    Bootstrap is more robust than analytical CIs because:
    - Doesn't assume normality of errors
    - Captures the full uncertainty including from regularization parameter
    - Handles the complex correlations between player estimates
    - Accounts for the variance scaling transformation

    Each bootstrap sample:
    1. Resamples matches with replacement
    2. Recomputes alpha (regularization) from the resampled data
    3. Estimates skills with the new alpha
    4. Applies variance scaling specific to that sample

    Uses the 2.5 and 97.5 percentiles of bootstrap distribution for 95% CIs.
    """
    # setup
    bootstrap_results: dict[int | str, list[float]] = defaultdict(list)
    question_ids_set = list(set(question_ids))
    data_by_question: dict[
        int, tuple[list[int | str], list[int | str], list[float], list[float]]
    ] = defaultdict(lambda: ([], [], [], []))
    for user1_id, user2_id, question_id, score, weight in zip(
        user1_ids, user2_ids, question_ids, scores, weights
    ):
        data = data_by_question[question_id]
        data[0].append(user1_id)
        data[1].append(user2_id)
        data[2].append(score)
        data[3].append(weight)

    print("Bootstrapping (method - question):")
    print("| Bootstrap |    Duration    | Est. Duration  |")
    t0 = datetime.now()
    for i in range(bootstrap_iterations):
        duration = datetime.now() - t0
        est_duration = duration / (i + 1) * bootstrap_iterations
        print(
            f"\033[K"
            f"| {i + 1:>4}/{bootstrap_iterations:<4} "
            f"| {duration} "
            f"| {est_duration} "
            "|",
            end="\r",
        )

        boot_user1_ids: list[int | str] = []
        boot_user2_ids: list[int | str] = []
        boot_question_ids: list[int] = []
        boot_scores: list[float] = []
        boot_weights: list[float] = []
        # resample questions with replacement
        for question_id in random.choices(question_ids_set, k=len(question_ids_set)):
            data = data_by_question[question_id]
            boot_user1_ids.extend(data[0])
            boot_user2_ids.extend(data[1])
            boot_question_ids.extend([question_id] * len(data[2]))
            boot_scores.extend(data[2])
            boot_weights.extend(data[3])

        # Recompute skills with bootstrap-specific alpha
        boot_skills = get_skills(
            user1_ids=boot_user1_ids,
            user2_ids=boot_user2_ids,
            question_ids=boot_question_ids,
            scores=boot_scores,
            weights=boot_weights,
            baseline_player=baseline_player,
            var_avg_scores=var_avg_scores,
            verbose=False,
        )

        for player, boot_skill in boot_skills.items():
            bootstrap_results[player].append(boot_skill)

    ci_lower: SkillType = {}
    ci_upper: SkillType = {}
    user_ids = set(user1_ids) | set(user2_ids)
    for uid in user_ids:
        ci_lower[uid] = float(np.percentile(bootstrap_results.get(uid, [0]), 2.5))
        ci_upper[uid] = float(np.percentile(bootstrap_results.get(uid, [0]), 97.5))
    print("\n")
    return ci_lower, ci_upper


def run_update_global_bot_leaderboard(
    cache_use: str = "partial",
) -> None:
    baseline_player: int | str = 236038  # metac-gpt-4o+asknews
    bootstrap_iterations = 30

    # SETUP: users to evaluate & questions
    print("Initializing...")
    users: QuerySet[User] = User.objects.filter(
        is_bot=True,
        # metadata__bot_details__metac_bot=True,
        # metadata__bot_details__include_in_calculations=True,
        # metadata__bot_details__display_in_leaderboard=True,
    ).order_by("id")
    user_forecast_exists = Forecast.objects.filter(
        question_id=OuterRef("pk"), author__in=users
    )
    questions: QuerySet[Question] = (
        Question.objects.filter(
            Q(post__default_project__default_permission__in=["viewer", "forecaster"])
            | Q(
                post__default_project_id__in=[
                    3349,  # aib q3 2024
                    32506,  # aib q4 2024
                    32627,  # aib q1 2025
                    32721,  # aib q2 2025
                    32813,  # aib fall 2025
                ]
            ),
            post__curation_status=Post.CurationStatus.APPROVED,
            resolution__isnull=False,
            scheduled_close_time__lte=timezone.now(),
        )
        .exclude(post__default_project__slug__startswith="minibench")
        .exclude(resolution__in=UnsuccessfulResolutionType)
        .filter(Exists(user_forecast_exists))
        .prefetch_related(  # only prefetch forecasts from those users
            Prefetch(
                "user_forecasts", queryset=Forecast.objects.filter(author__in=users)
            )
        )
        .distinct("id")
    )
    print("Initializing... DONE")

    # Gather head to head scores
    user1_ids, user2_ids, question_ids, scores, coverages, timestamps = gather_data(
        users, questions, cache_use=cache_use
    )

    # for pro aggregation, community aggregate, and any non-metac bot,
    # duplicate rows indicating year-specific achievements
    new_user1_ids = []
    new_user2_ids = []
    new_question_ids = []
    new_scores = []
    new_coverages = []
    new_timestamps = []
    for user1_id, user2_id, question_id, score, coverage, timestamp in zip(
        user1_ids, user2_ids, question_ids, scores, coverages, timestamps
    ):
        if user1_id == "Community Aggregate":
            new_user1_ids.append(
                f"Community Aggregate ({datetime.fromtimestamp(timestamp).year})"
            )
            new_user2_ids.append(user2_id)
            new_question_ids.append(question_id)
            new_scores.append(score)
            new_coverages.append(coverage)
            new_timestamps.append(timestamp)
        elif user2_id == "Community Aggregate":
            new_user1_ids.append(user1_id)
            new_user2_ids.append(
                f"Community Aggregate ({datetime.fromtimestamp(timestamp).year})"
            )
            new_question_ids.append(question_id)
            new_scores.append(score)
            new_coverages.append(coverage)
            new_timestamps.append(timestamp)
        else:
            new_user1_ids.append(user1_id)
            new_user2_ids.append(user2_id)
            new_question_ids.append(question_id)
            new_scores.append(score)
            new_coverages.append(coverage)
            new_timestamps.append(timestamp)
    user1_ids = new_user1_ids
    user2_ids = new_user2_ids
    question_ids = new_question_ids
    scores = new_scores
    coverages = new_coverages
    timestamps = new_timestamps

    ###############
    ###############
    ###############
    # Filter out entries we don't care about
    # and map some users to other users
    userid_mapping = {
        189585: 236038,  # mf-bot-1 -> metac-gpt-4o+asknews
        189588: 236041,  # mf-bot-3 -> metac-claude-3-5-sonnet-20240620+asknews
        208405: 240416,  # mf-bot-4 -> metac-o1-preview
        221727: 236040,  # mf-bot-5 -> metac-claude-3-5-sonnet-latest+asknews
    }
    print(f"Filtering {len(timestamps)} matches down to only relevant identities ...")
    relevant_users = User.objects.filter(
        metadata__bot_details__metac_bot=True,
        # metadata__bot_details__include_in_calculations=True, # TODO: this should be
        # but we don't have that data correct at the moment
    )
    # make sure they have at least 'minimum_resolved_questions' resolved questions
    print("Filtering users.")
    minimum_resolved_questions = 100
    scored_question_counts: dict[int, int] = defaultdict(int)
    c = relevant_users.count()
    i = 0
    for user in relevant_users:
        i += 1
        print(i, "/", c, end="\r")
        scored_question_counts[user.id] = (
            Score.objects.filter(
                user=user,
                score_type="peer",
                question__in=questions,
            )
            .distinct("question_id")
            .count()
        )
    excluded_ids = [
        uid
        for uid, count in scored_question_counts.items()
        if count < minimum_resolved_questions
    ]
    relevant_users = relevant_users.exclude(id__in=excluded_ids)
    print(f"Filtered {c} users down to {relevant_users.count()}.")
    ###############
    ###############
    ###############

    user_map = {user.id: user for user in relevant_users}
    relevant_identities = set(relevant_users.values_list("id", flat=True)) | {
        "Pro Aggregate",
        "Community Aggregate",
        # "Community Aggregate (2024)",
        "Community Aggregate (2025)",
        "Community Aggregate (2026)",
    }
    filtered_user1_ids = []
    filtered_user2_ids = []
    filtered_question_ids = []
    filtered_scores = []
    filtered_coverages = []
    filtered_timestamps = []
    for u1id, u2id, qid, score, coverage, timestamp in zip(
        user1_ids, user2_ids, question_ids, scores, coverages, timestamps
    ):
        # replace userIds according to the mapping
        u1id = userid_mapping.get(u1id, u1id)
        u2id = userid_mapping.get(u2id, u2id)
        # skip if either user is not in relevant identities
        if (u1id not in relevant_identities) or (u2id not in relevant_identities):
            continue
        # skip if either user model is more than a year old at time of 'timestamp'
        match_users = [user_map[u] for u in (u1id, u2id) if (u in user_map)]
        skip = False
        for user in match_users:
            base_models = (
                (user.metadata or dict())
                .get("bot_details", dict())
                .get("base_models", [])
            )
            if release_date := (
                base_models[0].get("model_release_date") if base_models else None
            ):
                if len(release_date) == 7:
                    release_date += "-01"
                release = (
                    datetime.fromisoformat(release_date)
                    .replace(tzinfo=dt_timezone.utc)
                    .timestamp()
                )
                if timestamp > release + timedelta(days=365).total_seconds():
                    skip = True
        if skip:
            continue

        # done
        filtered_user1_ids.append(u1id)
        filtered_user2_ids.append(u2id)
        filtered_question_ids.append(qid)
        filtered_scores.append(score)
        filtered_coverages.append(coverage)
        filtered_timestamps.append(timestamp)
    user1_ids = filtered_user1_ids
    user2_ids = filtered_user2_ids
    question_ids = filtered_question_ids
    scores = filtered_scores
    coverages = filtered_coverages
    timestamps = filtered_timestamps
    print(f"Filtered down to {len(timestamps)} matches.\n")
    # ###############

    # choose baseline player if not already chosen
    if not baseline_player:
        baseline_player = max(
            set(user1_ids) | set(user2_ids), key=(user1_ids + user2_ids).count
        )
    # get variance of average scores (used in rescaling)
    avg_scores = get_avg_scores(user1_ids, user2_ids, scores, coverages)
    var_avg_scores = (
        np.var(np.array(list(avg_scores.values()))) if len(avg_scores) > 1 else 0
    )

    # compute skills initially
    skills = get_skills(
        user1_ids=user1_ids,
        user2_ids=user2_ids,
        question_ids=question_ids,
        scores=scores,
        weights=coverages,
        baseline_player=baseline_player,
        var_avg_scores=var_avg_scores,
        verbose=True,
    )

    # Compute bootstrap confidence intervals
    ci_lower, ci_upper = bootstrap_skills(
        user1_ids,
        user2_ids,
        question_ids,
        scores,
        coverages,
        var_avg_scores,
        baseline_player=baseline_player,
        bootstrap_iterations=bootstrap_iterations,
    )
    print()

    ordered_skills = sorted(
        [(user, skill) for user, skill in skills.items()], key=lambda x: -x[1]
    )
    player_stats: dict[int | str, list] = dict()
    for u1id, u2id, qid in zip(user1_ids, user2_ids, question_ids):
        if u1id not in player_stats:
            player_stats[u1id] = [0, set()]
        if u2id not in player_stats:
            player_stats[u2id] = [0, set()]
        player_stats[u1id][0] += 1
        player_stats[u1id][1].add(qid)
        player_stats[u2id][0] += 1
        player_stats[u2id][1].add(qid)

    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    # UPDATE Leaderboard
    print("Updating leaderboard...", end="\r")
    leaderboard, _ = Leaderboard.objects.get_or_create(
        name="Global Bot Leaderboard",
        project=Project.objects.get(type=Project.ProjectTypes.SITE_MAIN),
        score_type=LeaderboardScoreTypes.MANUAL,
        bot_status=Project.BotLeaderboardStatus.BOTS_ONLY,
    )
    entry_dict = {
        entry.user_id or entry.aggregation_method: entry
        for entry in list(leaderboard.entries.all())
    }
    rank = 1
    question_count = len(set(question_ids))
    seen = set()
    for uid, skill in ordered_skills:
        contribution_count = len(player_stats[uid][1])

        excluded = False
        if isinstance(uid, int):
            user = User.objects.get(id=uid)
            bot_details = user.metadata["bot_details"]
            if not bot_details.get("display_in_leaderboard"):
                excluded = True

        entry: LeaderboardEntry = entry_dict.pop(uid, LeaderboardEntry())
        entry.user_id = uid if isinstance(uid, int) else None
        entry.aggregation_method = uid if isinstance(uid, str) else None
        entry.leaderboard = leaderboard
        entry.score = skill
        entry.rank = rank
        entry.exclusion_status = (
            ExclusionStatuses.EXCLUDE if excluded else ExclusionStatuses.INCLUDE
        )
        entry.contribution_count = contribution_count
        entry.coverage = contribution_count / question_count
        entry.calculated_on = timezone.now()
        entry.ci_lower = ci_lower.get(uid, None)
        entry.ci_upper = ci_upper.get(uid, None)
        # TODO: support for more efficient saving once this is implemented
        # for leaderboards with more than 100 entries
        entry.save()
        seen.add(entry.id)

        if not excluded:
            rank += 1
    print("Updating leaderboard... DONE")
    # delete unseen entries
    leaderboard.entries.exclude(id__in=seen).delete()
    print()

    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    # DISPLAY
    print("Results:")
    print(
        "|  2.5%  "
        "| Skill  "
        "| 97.5%  "
        "| Match  "
        "| Quest. "
        "|   ID   "
        "| Username "
    )
    print(
        "| Match  "
        "|        "
        "| Match  "
        "| Count  "
        "| Count  "
        "|        "
        "|          "
    )
    print(
        "=========================================="
        "=========================================="
    )
    unevaluated = (
        set(user1_ids) | set(user2_ids) | set(users.values_list("id", flat=True))
    )
    for uid, skill in ordered_skills:
        if isinstance(uid, str):
            username = uid
        else:
            username = User.objects.get(id=uid).username
        unevaluated.remove(uid)
        lower = ci_lower.get(uid, 0)
        upper = ci_upper.get(uid, 0)
        print(
            f"| {round(lower, 2):>6} "
            f"| {round(skill, 2):>6} "
            f"| {round(upper, 2):>6} "
            f"| {player_stats[uid][0]:>6} "
            f"| {len(player_stats[uid][1]):>6} "
            f"| {uid if isinstance(uid, int) else '':>6} "
            f"| {username}"
        )
    # for uid in unevaluated:
    #     if isinstance(uid, str):
    #         username = uid
    #     else:
    #         username = User.objects.get(id=uid).username
    #     print(
    #         "| ------ "
    #         "| ------ "
    #         "| ------ "
    #         "| ------ "
    #         "| ------ "
    #         f"| {uid if isinstance(uid, int) else '':>5} "
    #         f"| {username}"
    #     )
    print()

    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    # TESTS
    skills_array = np.array(list(skills.values()))

    # 1. Correllation between skill and avg_score (DO NOT HAVE YET - need avg_score)
    x = []
    y = []
    for uid in user1_ids:
        x.append(skills.get(uid, 0))
        y.append(avg_scores.get(uid, 0))
    correlation = np.corrcoef(x, y)
    print(f"\nCorrelation between skill and avg_score: {correlation[0][1]}")

    # 2. Shapiro-Wilk test (good for small to medium samples)
    if len(skills_array) >= 3:
        shapiro_stat, shapiro_p = stats.shapiro(skills_array)
        print(
            f"  Shapiro-Wilk test: statistic={shapiro_stat:.4f}, p-value={shapiro_p:.4f}"
        )
        if shapiro_p > 0.05:
            print("    → Skills appear normally distributed (p > 0.05)")
        else:
            print("    → Skills may not be normally distributed (p ≤ 0.05)")

    # 3. Anderson-Darling test (more sensitive to tails)
    anderson_result = stats.anderson(skills_array, dist="norm")
    print(f"  Anderson-Darling test: statistic={anderson_result.statistic:.4f}")
    # Check at 5% significance level
    critical_5pct = anderson_result.critical_values[2]  # Index 2 is 5% level
    print(f"    Critical value at 5%: {critical_5pct:.4f}")
    if anderson_result.statistic < critical_5pct:
        print("    → Skills appear normally distributed (stat < critical)")
    else:
        print("    → Skills may not be normally distributed (stat ≥ critical)")

    # 4. Kolmogorov-Smirnov test (compare to normal distribution)
    ks_stat, ks_p = stats.kstest(
        skills_array, "norm", args=(skills_array.mean(), skills_array.std())
    )
    print(f"  Kolmogorov-Smirnov test: statistic={ks_stat:.4f}, p-value={ks_p:.4f}")
    if ks_p > 0.05:
        print("    → Skills appear normally distributed (p > 0.05)")
    else:
        print("    → Skills may not be normally distributed (p ≤ 0.05)")

    # 5. Summary statistics
    print("\nSkill distribution summary:")
    print(f"  Mean: {skills_array.mean():.2f}")
    print(f"  Std: {skills_array.std():.2f}")
    print(f"  Skewness: {stats.skew(skills_array):.4f}")
    print(f"  Kurtosis: {stats.kurtosis(skills_array):.4f}")
    print()


class Command(BaseCommand):
    help = """
    Update the global bots leaderboard
    """

    def handle(self, *args, **options) -> None:
        if not settings.DEBUG:
            cache_use = ""
        else:
            cache_use = "partial"
        run_update_global_bot_leaderboard(cache_use=cache_use)
