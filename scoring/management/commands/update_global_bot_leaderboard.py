import random
from collections import defaultdict, Counter

from datetime import datetime
from django.core.management.base import BaseCommand
<<<<<<< HEAD
from django.db.models import Exists, OuterRef, Prefetch, QuerySet
=======
>>>>>>> 4b77fe49f6cd1298db358751b6c9efbd4e36d6ca
from django.utils import timezone
import numpy as np
from scipy import sparse
from sklearn.linear_model import Ridge

from posts.models import Post
from projects.models import Project
from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from scoring.constants import ScoreTypes, LeaderboardScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry
from scoring.score_math import (
    evaluate_forecasts_peer_accuracy,
    evaluate_forecasts_peer_spot_forecast,
    get_geometric_means,
)
from users.models import User
from utils.the_math.formulas import string_location_to_bucket_index

SkillType = dict[int, float]


def get_score_pair(
    user1_forecasts: list[Forecast],
    user2_forecasts: list[Forecast],
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
        coverage = 0
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
        coverage = 0
        current_timestamp = actual_close_time
        for gm in geometric_means[::-1]:
            if gm.timestamp <= spot_forecast_timestamp <= current_timestamp:
                if gm.num_forecasters == 2:
                    # both have a forecast at spot scoring time
                    coverage = 1
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
    users: QuerySet[User], questions: QuerySet[Question]
) -> tuple[list[int], list[int], list[int], list[float], list[float]]:
    user_ids = users.values_list("id", flat=True)
    print("Processing Pairwise Scoring:")
    print("|   Question  |  ID   |   Pairing   |    Duration    | Est. Duration  |")
    t0 = datetime.now()
    question_count = len(questions)
    user1_ids: list[int] = []
    user2_ids: list[int] = []
    question_ids: list[int] = []
    scores: list[float] = []
    coverages: list[float] = []
    for question_number, question in enumerate(questions.iterator(chunk_size=10), 1):
        if question_number > 100:
            continue
        question_print_str = (
            f"\033[K"
            f"| {question_number:>5}/{question_count:<5} "
            f"| {question.id:<5} "
        )
        forecasts = question.user_forecasts.filter(author_id__in=user_ids).order_by(
            "start_time"
        )
        forecast_dict: dict[int, list[Forecast]] = defaultdict(list)
        for f in forecasts:
            forecast_dict[f.author_id].append(f)
        forecaster_ids = sorted(list(forecast_dict.keys()))
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
    return (user1_ids, user2_ids, question_ids, scores, coverages)


def compute_skills(
    user1_ids,
    user2_ids,
    scores,
    coverages,
    baseline_player=269196,
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

    matches_df is a pandas thing with columns: player_a, player_a, score
    """

    # Set alpha using heuristic: variance of scores / average matches per player
    matches = len(scores)
    user_ids = set(user1_ids) | set(user2_ids)
    score_variance = np.var(scores)
    average_matches = matches / len(user_ids)
    alpha = score_variance / average_matches

    # Remove baseline player from design matrix
    # This implicitly sets their skill to 0 (reference point)
    players = [uid for uid in user_ids if uid != baseline_player]
    player_to_idx = {p: i for i, p in enumerate(players)}

    # Build sparse design matrix X
    # Each row represents one match:
    # - Column for player_a gets +1 (they gain the score)
    # - Column for player_b gets -1 (they lose the score)
    # - If baseline player is involved, their column is omitted (skill=0)
    X = sparse.lil_matrix((matches, len(players)))
    y = np.zeros(matches)
    for i, u1id, u2id, score in zip(range(matches), user1_ids, user2_ids, scores):
        y[i] = score
        if u1id != baseline_player:
            X[i, player_to_idx[u1id]] = 1
        if u2id != baseline_player:
            X[i, player_to_idx[u2id]] = -1
    # Convert to CSR format for efficient operations
    X = X.tocsr()

    # Solve weighted Ridge regression
    # The Ridge class minimizes: ||sqrt(W) * (y - X*beta)||^2 + alpha * ||beta||^2
    # This gives us beta (skills) that balance:
    # 1. Fitting the observed scores (weighted by importance)
    # 2. Keeping skills small (regularization to avoid overfitting)
    model = Ridge(alpha=alpha, fit_intercept=False, solver="lsqr")
    model.fit(X, y, sample_weight=coverages)
    # Extract estimated skills
    skills = {p: model.coef_[i] for i, p in enumerate(players)}
    skills[baseline_player] = 0.0

    # TODO: unfinished std_error
    # # Compute standard errors for confidence intervals
    # # Based on the weighted residual variance and the inverse of (X'WX + alpha*I)
    # residuals = y - model.predict(X)
    # sigma2 = np.average(residuals**2, weights=coverages)
    # # Weighted design matrix for covariance calculation
    # W_sqrt = sparse.diags(np.sqrt(coverages))
    # X_weighted = W_sqrt @ X
    # XtWX = X_weighted.T @ X_weighted
    # # Covariance matrix of coefficients: sigma^2 * (X'WX + alpha*I)^(-1)
    # reg_matrix = XtWX + alpha * sparse.eye(len(players))
    # inv_term = sparse.linalg.inv(reg_matrix)
    # var_coef = sigma2 * inv_term.diagonal()

    return skills


def get_var_avg_scores(user1_ids, user2_ids, scores, coverages) -> float:
    # get per-player coverage-weighted average score
    scores_by_player: dict[int, list[float]] = defaultdict(lambda: [0.0, 0.0])
    for u1id, u2id, score, coverage in zip(user1_ids, user2_ids, scores, coverages):
        u1 = scores_by_player[u1id]
        u1[0] += score
        u1[1] += coverage
        u2 = scores_by_player[u2id]
        u2[0] -= score
        u2[1] += coverage
    avg_scores = dict()
    for uid, (score, coverage) in scores_by_player.items():
        avg_scores[uid] = score / coverage
    var_avg_scores = np.var(np.array(list(avg_scores.values())))
    return var_avg_scores


def rescale_skills_(skills: SkillType, var_avg_scores) -> SkillType:
    """
    rescaled to have skills in same range as peer scores
    NOTE: changes skills in place
    """
    var_skills = np.var(np.array(list(skills.values())))
    scale_factor = np.sqrt(var_avg_scores / var_skills)
    for uid in skills:
        skills[uid] *= scale_factor
    return skills


def bootstrap_skills(
    user1_ids,
    user2_ids,
    question_ids,
    scores,
    coverages,
    var_avg_scores,
    baseline_player=269196,
    n_bootstrap=30,
    method="matches",
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
    bootstrap_results: dict[int, list[float]] = defaultdict(list)

    print(f"Bootstrapping (method - {method}):")
    print("| Bootstrap |    Duration    | Est. Duration  |")
    t0 = datetime.now()
    for i in range(n_bootstrap):
        duration = datetime.now() - t0
        est_duration = duration / (i + 1) * n_bootstrap
        print(
            f"\033[K"
            f"| {i + 1:>4}/{n_bootstrap:<4} "
            f"| {duration} "
            f"| {est_duration} "
            "|",
            end="\r",
        )

        boot_user1_ids: list[int] = []
        boot_user2_ids: list[int] = []
        boot_scores: list[float] = []
        boot_coverages: list[float] = []
        if method == "matches":
            # Resample matches with replacement
            indices = np.random.choice(len(scores), len(scores), replace=True)
            for index in indices:
                boot_user1_ids.append(user1_ids[index])
                boot_user2_ids.append(user2_ids[index])
                boot_scores.append(scores[index])
                boot_coverages.append(coverages[index])
        else:  # method == "question"
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
                    boot_coverages.append(coverages[index])

        # Recompute skills on bootstrap sample with bootstrap-specific alpha
        boot_skills = compute_skills(
            boot_user1_ids,
            boot_user2_ids,
            boot_scores,
            boot_coverages,
            baseline_player,
        )

        # Apply variance scaling for this bootstrap sample
        var_boot_skills = np.var(np.array(list(boot_skills.values())))

        if var_boot_skills > 0:
            boot_scale_factor = np.sqrt(var_avg_scores / var_boot_skills)
        else:
            boot_scale_factor = 1.0

        # Store scaled skills
        for player in boot_skills.keys():
            bootstrap_results[player].append(boot_skills[player] * boot_scale_factor)

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
        # SETUP: we need to choose the baseline player, users to evaluate, and questions
        baseline_player = 269782
        print("Initializing...", end="\r")
        users: QuerySet[User] = User.objects.filter(
            is_active=True,
            is_bot=True,
            username__startswith="metac-",
        ).order_by("id")
        user_forecast_exists = Forecast.objects.filter(
            question_id=OuterRef("pk"), author__in=users
        )
        questions: QuerySet[Question] = (
            Question.objects.filter(
                related_posts__post__default_project__default_permission__in=[
                    "viewer",
                    "forecaster",
                ],
                related_posts__post__curation_status=Post.CurationStatus.APPROVED,
                resolution__isnull=False,
            )
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .filter(Exists(user_forecast_exists))
            .prefetch_related(  # only prefetch forecasts from those users
                Prefetch(
                    "user_forecasts", queryset=Forecast.objects.filter(author__in=users)
                )
            )
            .order_by("id")
        )
        print("Initializing... DONE")

        # PROCESS DATA
        user1_ids, user2_ids, question_ids, scores, coverages = gather_data(
            users, questions
        )

        print("Computing Skills initial...", end="\r")
        skills = compute_skills(
            user1_ids, user2_ids, scores, coverages, baseline_player
        )
        var_avg_scores = get_var_avg_scores(user1_ids, user2_ids, scores, coverages)
        skills = rescale_skills_(skills, var_avg_scores)
        print("Computing Skills initial... DONE\n")

        match_ci_lower, match_ci_upper = bootstrap_skills(
            user1_ids,
            user2_ids,
            question_ids,
            scores,
            coverages,
            var_avg_scores,
            baseline_player=baseline_player,
            n_bootstrap=30,
            method="match",
        )
        question_ci_lower, question_ci_upper = bootstrap_skills(
            user1_ids,
            user2_ids,
            question_ids,
            scores,
            coverages,
            var_avg_scores,
            baseline_player=baseline_player,
            n_bootstrap=30,
            method="question",
        )

        # DISPLAY
        print("Results:")
        print(
            "|       2.5%      "
            "|  skill "
            "|      97.5%      "
            "| Match  "
            "| Quest. "
            "|   ID   "
            "| Username "
        )
        print(
            "|  match (quest.) "
            "|        "
            "|  match (quest.) "
            "| Count  "
            "| Count  "
            "|        "
            "|          "
        )
        print(
            "=========================================="
            "=========================================="
        )
        player_stats: dict[int, list] = defaultdict(lambda: [0, set()])
        for u1id, u2id, qid in zip(user1_ids, user2_ids, question_ids):
            player_stats[u1id][0] += 1
            player_stats[u1id][1].add(qid)
            player_stats[u2id][0] += 1
            player_stats[u2id][1].add(qid)
        ordered_skills = sorted(
            [(user, skill) for user, skill in skills.items()], key=lambda x: -x[1]
        )
        unevaluated = set([u.id for u in users])
        for uid, skill in ordered_skills:
            user = User.objects.get(id=uid)
            unevaluated.remove(uid)
            match_lower = match_ci_lower.get(uid, 0)
            match_upper = match_ci_upper.get(uid, 0)
            question_lower = question_ci_lower.get(uid, 0)
            question_upper = question_ci_upper.get(uid, 0)
            print(
                f"| {round(match_lower, 2):>6} {'('+str(round(question_lower, 2))+')':>8} "
                f"| {round(skill, 2):>6} "
                f"| {round(match_upper, 2):>6} {'('+str(round(question_upper, 2))+')':>8} "
                f"| {player_stats[uid][0]:>6} "
                f"| {len(player_stats[uid][1]):>6} "
                f"| {user.id:>5} "
                f"| {user.username}"
            )
        for uid in unevaluated:
            user = User.objects.get(id=uid)
            print(
                "| --------------- "
                "| ------ "
                "| --------------- "
                "| ------ "
                "| ------ "
                f"| {user.id:>5} "
                f"| {user.username}"
            )
        print()

        # UPDATE Leaderboard
        print("Updating leaderboard...", end="\r")
        leaderboard, _ = Leaderboard.objects.get_or_create(
            name="Global Bot Leaderboard",
            project=Project.objects.get(type=Project.ProjectTypes.SITE_MAIN),
            score_type=LeaderboardScoreTypes.MANUAL,
            bot_status=Project.BotLeaderboardStatus.BOTS_ONLY,
        )
        entry_dict = {entry.user_id: entry for entry in list(leaderboard.entries.all())}
        question_count = len(set(question_ids))
        for rank, (uid, skill) in enumerate(ordered_skills, 1):
            contribution_count = len(player_stats[uid][1])

            entry = entry_dict.pop(uid, LeaderboardEntry())
            entry.user_id = uid
            entry.leaderboard = leaderboard
            entry.score = skill
            entry.rank = rank
            entry.excluded = False
            entry.contribution_count = contribution_count
            entry.coverage = contribution_count / question_count
            entry.calculated_on = timezone.now()
            entry.ci_lower = match_ci_lower.get(uid, None)  # consider question_ci_lower
            entry.ci_upper = match_ci_upper.get(uid, None)  # consider question_ci_upper
            entry.save()
        print("Updating leaderboard... DONE")
        # delete unseen entries
        for entry in entry_dict.values():
            entry.delete()
