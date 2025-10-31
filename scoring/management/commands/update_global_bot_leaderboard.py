import random
from collections import defaultdict, Counter

from datetime import datetime, timedelta, timezone as dt_timezone
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
from scoring.models import Leaderboard, LeaderboardEntry
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
        total_duration = forecast_horizon_end - forecast_horizon_start
        current_timestamp = actual_close_time
        for gm in geometric_means[::-1]:
            if gm.num_forecasters == 2:  # converage only when both have a forecast
                coverage += max(0, (current_timestamp - gm.timestamp)) / total_duration
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

    return (
        question.id,
        sum(s.score for s in user1_scores),
        coverage,
    )


def gather_data(
    users: QuerySet[User],
    questions: QuerySet[Question],
) -> tuple[list[int | str], list[int | str], list[int], list[float], list[float]]:
    # TODO: make authoritative mapping
    print("creating AIB <> Pro AIB question mapping...", end="\r")
    aib_projects = Project.objects.filter(
        id__in=[
            3349,  # Q3 2024
            32506,  # Q4 2024
            32627,  # Q1 2025
            32721,  # Q2 2025
            32813,  # fall 2025
        ]
    )
    aib_to_pro_version = {
        3349: 3345,
        32506: 3673,
        32627: 32631,
        32721: 32761,
        32813: None,
    }
    aib_question_map: dict[Question, Question | None] = dict()
    for aib in aib_projects:
        pro_id = aib_to_pro_version[aib.id]
        aib_questions = Question.objects.filter(
            related_posts__post__default_project=aib
        )
        pro_questions_by_title: dict[str, Question] = {
            q.title: q
            for q in (
                []
                if not pro_id
                else Question.objects.filter(
                    related_posts__post__default_project=pro_id,
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
    user_id_map = {user.id: user for user in users}
    print("Processing Pairwise Scoring:")
    print("|   Question  |  ID   |   Pairing   |    Duration    | Est. Duration  |")
    t0 = datetime.now()
    question_count = len(questions)
    user1_ids: list[int | str] = []
    user2_ids: list[int | str] = []
    question_ids: list[int] = []
    scores: list[float] = []
    coverages: list[float] = []
    for question_number, question in enumerate(questions.iterator(chunk_size=10), 1):
        question_print_str = (
            f"\033[K"
            f"| {question_number:>5}/{question_count:<5} "
            f"| {question.id:<5} "
        )
        # Get forecasts
        forecast_dict: dict[int | str, list[Forecast | AggregateForecast]] = (
            defaultdict(list)
        )
        # bot forecasts - simple
        bot_forecasts = question.user_forecasts.filter(author_id__in=user_ids).order_by(
            "start_time"
        )
        for f in bot_forecasts:
            # don't include forecasts made 1 year or more after model release
            user = user_id_map[f.author_id]
            primary_base_model = user.metadata["bot_details"]["base_models"][0]
            if release_date := primary_base_model.get("model_release_date"):
                if len(release_date) == 7:
                    release_date += "-01"
                release = datetime.fromisoformat(release_date).replace(
                    tzinfo=dt_timezone.utc
                )
                if f.start_time > release + timedelta(days=365):
                    continue

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
            aggregate_forecasts = get_aggregation_history(
                human_question,
                [aggregation_method],
                minimize=False,
                include_stats=False,
                include_bots=False,
                include_future=False,
            )[aggregation_method]
            if not aggregate_forecasts:
                pass
            elif question in aib_question_map:
                # set the last aggregate to be the one that gets scored
                forecast = aggregate_forecasts[-1]
                forecast.start_time = question.get_spot_scoring_time() - timedelta(
                    seconds=1
                )
                forecast.end_time = None
                forecast_dict["Pro Aggregation"] = [forecast]
                # match question.get_post().default_project_id:
                #     case 3349:  # Q3 2024
                #         forecast_dict["2024 Q3 Pro Aggregate"] = [forecast]
                #     case 32506:  # Q4 2024
                #         forecast_dict["2024 Q4 Pro Aggregate"] = [forecast]
                #     case 32627:  # Q1 2025
                #         forecast_dict["2025 Q1 Pro Aggregate"] = [forecast]
                #     case 32721:  # Q2 2025
                #         forecast_dict["2025 Q2 Pro Aggregate"] = [forecast]
                #     case 32813:  # fall 2025
                #         forecast_dict["2025 Fall Pro Aggregate"] = [forecast]
                #     case other:
                #         print(question.id, human_question.id, "NOT FOUND...", other)
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
    print("\n")
    cov_arr = np.array(coverages)
    weights = list(cov_arr * len(cov_arr) / sum(cov_arr))
    return (user1_ids, user2_ids, question_ids, scores, weights)


def estimate_variances_from_head_to_head(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    scores: list[float],
    weights: list[float],
    min_matches_for_true=100,
    min_rematches=100,
    verbose=False,
) -> float:
    """
    Helper function: Estimate σ_error and σ_true from head-to-head data.

    Returns:
        (σ_error, σ_true, alpha): estimated standard deviations and regularization parameter
    """
    # Estimate σ_error from rematches
    matchups: dict[tuple[int | str, int | str], dict[str, list[float]]] = defaultdict(
        lambda: {"scores": [], "weights": []}
    )
    for user1_id, user2_id, score, coverage in zip(
        user1_ids, user2_ids, scores, weights
    ):
        pair = (user1_id, user2_id)
        matchups[pair]["scores"].append(score)
        matchups[pair]["weights"].append(coverage)

    # Calculate weighted variance within each matchup
    rematch_variances = []
    for pair, data in matchups.items():
        pair_scores = np.array(data["scores"])
        pair_weights = np.array(data["weights"])
        if len(pair_scores) >= min_rematches:
            weighted_mean = np.average(pair_scores, weights=pair_weights)
            weighted_var = np.average(
                (pair_scores - weighted_mean) ** 2, weights=pair_weights
            )
            rematch_variances.append(weighted_var)

    if verbose:
        print(
            f"Found {len(rematch_variances)} matchups with >={min_rematches} rematches"
        )

    if len(rematch_variances) == 0:
        # Fallback if no rematches found
        σ_error = np.sqrt(np.var(scores))
        if verbose:
            print(f"WARNING: No rematches found, using overall score variance")
    else:
        σ_error = np.sqrt(np.mean(rematch_variances))

    if verbose:
        print(f"σ_error (match noise): {σ_error:.4f}")

    # Estimate σ_true from high-match players
    match_counts: dict[int | str, float] = defaultdict(float)
    for user1_id, user2_id, coverage in zip(user1_ids, user2_ids, weights):
        match_counts[user1_id] += coverage
        match_counts[user2_id] += coverage

    # Quick ridge regression to estimate skills
    players = list(match_counts.keys())
    player_to_idx = {p: i for i, p in enumerate(players)}
    n_players = len(players)

    # Use small λ for initial fit
    λ_init = σ_error**2 / 1.0  # Assume unit variance initially

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

    # Add ridge penalty
    XTX += λ_init * np.eye(n_players)

    # Solve
    skills = np.linalg.solve(XTX, XTy)

    # Get variance of skills for high-match players
    high_match_skills = [
        skills[player_to_idx[p]]
        for p in players
        if match_counts[p] >= min_matches_for_true
    ]

    n_high_match = len(high_match_skills)
    if verbose:
        print(f"Found {n_high_match} players with >={min_matches_for_true} matches")

    if n_high_match < 10:
        if verbose:
            print(
                f"WARNING: Only {n_high_match} high-match players for variance estimation!"
            )

    σ_true = np.std(high_match_skills, ddof=1) if len(high_match_skills) > 1 else 1.0
    if verbose:
        print(f"σ_true (skill variance): {σ_true:.4f}")

    alpha = (σ_error / σ_true) ** 2
    if verbose:
        print(f"alpha = (σ_error / σ_true)² = {alpha:.4f}")

    return alpha


def get_var_avg_scores(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    scores: list[float],
    coverages: list[float],
) -> float:
    # get per-player coverage-weighted average score
    scores_by_player: dict[int | str, list[float]] = defaultdict(lambda: [0.0, 0.0])
    for u1id, u2id, score, coverage in zip(user1_ids, user2_ids, scores, coverages):
        u1 = scores_by_player[u1id]
        u1[0] += score
        u1[1] += coverage
        u2 = scores_by_player[u2id]
        u2[0] -= score
        u2[1] += coverage
    avg_scores = dict()
    for uid, (score, coverage) in scores_by_player.items():
        avg_scores[uid] = score / max(30, coverage)
    var_avg_scores = np.var(np.array(list(avg_scores.values())))
    return var_avg_scores


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

    One player is fixed at skill=0 to make the system identifiable (otherwise
    we could add any constant to all skills and get the same predictions).
    """
    matches = len(scores)
    user_ids = set(user1_ids) | set(user2_ids)
    player_to_idx = {p: i for i, p in enumerate(user_ids)}

    X = sparse.lil_matrix((matches, len(user_ids)))
    y = np.zeros(matches)

    for i, u1id, u2id, score, weight in zip(
        range(matches), user1_ids, user2_ids, scores, weights
    ):
        y[i] = score / (weight if weight != 1 / 3 else 1)
        X[i, player_to_idx[u1id]] = 1
        X[i, player_to_idx[u2id]] = -1

    X = X.tocsr()

    # Fit with intercept=True so sklearn centers the solution
    # This effectively enforces sum-to-zero constraint
    model = Ridge(alpha=alpha, fit_intercept=False, solver="lsqr")
    model.fit(X, y, sample_weight=weights)
    # Extract estimated skills
    skills = {p: model.coef_[i] for i, p in enumerate(user_ids)}

    # Explicitly enforce sum-to-zero by removing mean
    mean_skill = np.mean(list(skills.values()))
    skills = {p: s - mean_skill for p, s in skills.items()}

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
    var_skills = np.var(np.array(list(skills.values())))
    scale_factor = np.sqrt(var_avg_scores / var_skills)
    for uid in skills:
        skills[uid] *= scale_factor
    return skills


def get_skills(
    user1_ids: list[int | str],
    user2_ids: list[int | str],
    scores: list[float],
    weights: list[float],  # normalized coverages
    alpha: float,
    baseline_player: int | str,
    var_avg_scores: float,
) -> SkillType:
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
    min_matches_for_true: int = 100,
    min_rematches: int = 100,
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
    bootstrap_results: dict[int | str, list[float]] = defaultdict(list)

    print(f"Bootstrapping (method - question):")
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
        boot_scores: list[float] = []
        boot_weights: list[float] = []
        # resample questions with repalcement
        question_ids_set = list(set(question_ids))
        boot_question_ids_counts = Counter(
            random.choices(question_ids_set, k=len(question_ids_set))
        )
        for index, question_id in enumerate(question_ids):
            for _ in range(boot_question_ids_counts[question_id]):
                boot_user1_ids.append(user1_ids[index])
                boot_user2_ids.append(user2_ids[index])
                boot_scores.append(scores[index])
                boot_weights.append(weights[index])

        # Recompute skills on bootstrap sample with bootstrap-specific alpha
        boot_alpha = estimate_variances_from_head_to_head(
            user1_ids=boot_user1_ids,
            user2_ids=boot_user2_ids,
            scores=boot_scores,
            weights=boot_weights,
            min_matches_for_true=min_matches_for_true,
            min_rematches=min_rematches,
        )

        # TODO: maybe move before calculating boot_alpha? & then move alpha calc into
        # get_skills
        weights_arr = np.array(boot_weights)
        boot_weights = list(weights_arr * len(weights_arr) / sum(weights_arr))

        # Recompute skills with bootstrap-specific alpha
        boot_skills = get_skills(
            user1_ids=boot_user1_ids,
            user2_ids=boot_user2_ids,
            scores=boot_scores,
            weights=boot_weights,
            alpha=boot_alpha,
            baseline_player=baseline_player,
            var_avg_scores=var_avg_scores,
        )

        for player, boot_skill in boot_skills.items():
            bootstrap_results[player].append(boot_skill)

    # Compute 95% confidence intervals using percentiles
    ci_lower: SkillType = {}
    ci_upper: SkillType = {}
    user_ids = set(user1_ids) | set(user2_ids)
    for user_id in user_ids:
        if bootstrap_results[user_id]:  # Player appeared in bootstrap samples
            ci_lower[user_id] = float(np.percentile(bootstrap_results[user_id], 2.5))
            ci_upper[user_id] = float(np.percentile(bootstrap_results[user_id], 97.5))
        else:  # Player never appeared (shouldn't happen)
            print("WARNING: user_id didn't appear:", user_id)
            ci_lower[user_id] = 0.0
            ci_upper[user_id] = 0.0
    print("\n")
    return ci_lower, ci_upper


class Command(BaseCommand):
    help = """
    Update the global bots leaderboard
    """

    def handle(self, *args, **options) -> None:
        # SETTINGS - TODO: allow these as args
        baseline_player: int | str = 236038
        min_matches_for_true = 100
        min_rematches = 100
        bootstrap_iterations = 30

        # SETUP: users to evaluate & questions
        print("Initializing...", end="\r")
        users: QuerySet[User] = User.objects.filter(
            metadata__bot_details__metac_bot=True,
            metadata__bot_details__include_in_calculations=True,
            is_active=True,
        ).order_by("id")
        user_forecast_exists = Forecast.objects.filter(
            question_id=OuterRef("pk"), author__in=users
        )
        questions: QuerySet[Question] = (
            Question.objects.filter(
                Q(
                    related_posts__post__default_project__default_permission__in=[
                        "viewer",
                        "forecaster",
                    ]
                )
                | Q(
                    related_posts__post__default_project_id__in=[
                        3349,
                        32506,
                        32627,
                        32721,
                        32813,
                    ]
                ),
                related_posts__post__curation_status=Post.CurationStatus.APPROVED,
                resolution__isnull=False,
            )
            .exclude(related_posts__post__default_project__slug__startswith="minibench")
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .filter(Exists(user_forecast_exists))
            .prefetch_related(  # only prefetch forecasts from those users
                Prefetch(
                    "user_forecasts", queryset=Forecast.objects.filter(author__in=users)
                )
            )
            .order_by("id")
            .distinct("id")
        )
        print("Initializing... DONE")

        # Gather head to head scores
        user1_ids, user2_ids, question_ids, scores, weights = gather_data(
            users, questions
        )

        # choose baseline player if not already chosen
        if not baseline_player:
            baseline_player = max(
                set(user1_ids) | set(user2_ids), key=(user1_ids + user2_ids).count
            )
        # get variance of average scores (used in rescaling)
        var_avg_scores = get_var_avg_scores(user1_ids, user2_ids, scores, weights)

        # compute skills initially
        print("Computing Skills initial...", end="\r")
        alpha = estimate_variances_from_head_to_head(
            user1_ids=user1_ids,
            user2_ids=user2_ids,
            scores=scores,
            weights=weights,
            min_matches_for_true=min_matches_for_true,
            min_rematches=min_rematches,
            verbose=False,
        )
        skills = get_skills(
            user1_ids=user1_ids,
            user2_ids=user2_ids,
            scores=scores,
            weights=weights,
            alpha=alpha,
            baseline_player=baseline_player,
            var_avg_scores=var_avg_scores,
        )
        print("Computing Skills initial... DONE\n")

        # Compute bootstrap confidence intervals
        ci_lower, ci_upper = bootstrap_skills(
            user1_ids,
            user2_ids,
            question_ids,
            scores,
            weights,
            var_avg_scores,
            baseline_player=baseline_player,
            min_matches_for_true=min_matches_for_true,
            min_rematches=min_rematches,
            bootstrap_iterations=bootstrap_iterations,
        )
        print()

        ##########################################################################
        ##########################################################################
        ##########################################################################
        ##########################################################################
        # UPDATE Leaderboard
        ordered_skills = sorted(
            [(user, skill) for user, skill in skills.items()], key=lambda x: -x[1]
        )
        player_stats: dict[int | str, list] = defaultdict(lambda: [0, set()])
        for u1id, u2id, qid in zip(user1_ids, user2_ids, question_ids):
            player_stats[u1id][0] += 1
            player_stats[u1id][1].add(qid)
            player_stats[u2id][0] += 1
            player_stats[u2id][1].add(qid)
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
            entry.excluded = excluded
            entry.show_when_excluded = False
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
        for uid in unevaluated:
            if isinstance(uid, str):
                username = uid
            else:
                username = User.objects.get(id=uid).username
            print(
                "| ------ "
                "| ------ "
                "| ------ "
                "| ------ "
                "| ------ "
                f"| {uid if isinstance(uid, int) else '':>5} "
                f"| {username}"
            )
        print()

        ##########################################################################
        ##########################################################################
        ##########################################################################
        ##########################################################################
        # TESTS
        skills_array = np.array(list(skills.values()))

        # 1. Correllation between skill and avg_score (DO NOT HAVE YET - need avg_score)
        ...

        # 2. Shapiro-Wilk test (good for small to medium samples)
        if len(skills_array) >= 3:
            shapiro_stat, shapiro_p = stats.shapiro(skills_array)
            print(
                f"  Shapiro-Wilk test: statistic={shapiro_stat:.4f}, p-value={shapiro_p:.4f}"
            )
            if shapiro_p > 0.05:
                print(f"    → Skills appear normally distributed (p > 0.05)")
            else:
                print(f"    → Skills may not be normally distributed (p ≤ 0.05)")

        # 3. Anderson-Darling test (more sensitive to tails)
        anderson_result = stats.anderson(skills_array, dist="norm")
        print(f"  Anderson-Darling test: statistic={anderson_result.statistic:.4f}")
        # Check at 5% significance level
        critical_5pct = anderson_result.critical_values[2]  # Index 2 is 5% level
        print(f"    Critical value at 5%: {critical_5pct:.4f}")
        if anderson_result.statistic < critical_5pct:
            print(f"    → Skills appear normally distributed (stat < critical)")
        else:
            print(f"    → Skills may not be normally distributed (stat ≥ critical)")

        # 4. Kolmogorov-Smirnov test (compare to normal distribution)
        ks_stat, ks_p = stats.kstest(
            skills_array, "norm", args=(skills_array.mean(), skills_array.std())
        )
        print(f"  Kolmogorov-Smirnov test: statistic={ks_stat:.4f}, p-value={ks_p:.4f}")
        if ks_p > 0.05:
            print(f"    → Skills appear normally distributed (p > 0.05)")
        else:
            print(f"    → Skills may not be normally distributed (p ≤ 0.05)")

        # 5. Summary statistics
        print(f"\nSkill distribution summary:")
        print(f"  Mean: {skills_array.mean():.2f}")
        print(f"  Std: {skills_array.std():.2f}")
        print(f"  Skewness: {stats.skew(skills_array):.4f}")
        print(f"  Kurtosis: {stats.kurtosis(skills_array):.4f}")
        print()
