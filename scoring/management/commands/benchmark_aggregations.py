import logging
import random
import time

from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db.models import Count, Max

from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from scoring.constants import ScoreTypes
from scoring.fast_scoring import (
    MEAN_BASED_METHODS,
    MEDIAN_BASED_METHODS,
    REPUTATION_WEIGHTED_CLASSES,
    compute_aggregation_series,
    compute_geometric_mean_series,
    compute_median_aggregation_series,
    compute_spot_scores,
    get_or_build_question_data,
    preload_reputation_history,
    score_baseline,
    score_peer,
)
from utils.the_math.aggregations import AGGREGATIONS

logger = logging.getLogger(__name__)

VALID_AGGREGATION_METHODS = [agg.method for agg in AGGREGATIONS]
DEFAULT_AGGREGATION_METHODS = [
    "unweighted",
    "recency_weighted",
    "single_aggregation",
    "year_performance",
]
VALID_QUESTION_TYPES = [c.value for c in Question.QuestionType]
SPOT_SCORE_TYPES = {"spot_peer", "spot_baseline"}


class Command(BaseCommand):
    help = """
    Rapid-iteration benchmark: evaluate one or more aggregation methods
    against already-resolved questions and report their summed/averaged
    score (peer, by default) - meant as a quick feedback loop for tuning
    aggregation parameters (e.g. via scipy.optimize) rather than a
    production scoring path.

    Bypasses evaluate_question/get_aggregation_history entirely (see
    scoring/fast_scoring.py): every forecast is reduced to a single float -
    its PMF value at the question's resolution bucket - once, and all
    aggregation/scoring math runs on compact (num_forecasters,
    num_timesteps) arrays instead of full PMF/CDF vectors at every
    timestep. Only valid for mean-based methods on any question type, or
    median-based methods (recency_weighted, unweighted) when
    multiple_choice questions are excluded - see --exclude-question-type.
    """

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="Random seed used when --question-count samples a subset of "
            "eligible questions, for repeatable runs.",
        )
        parser.add_argument(
            "--question-count",
            type=int,
            default=None,
            help="If set, randomly sample this many eligible questions instead "
            "of using all of them - for fast iteration. Default: use all "
            "eligible questions.",
        )
        parser.add_argument(
            "--aggregation-method",
            dest="aggregation_methods",
            action="append",
            default=None,
            help="Aggregation method to evaluate (repeatable, e.g. "
            "--aggregation-method single_aggregation --aggregation-method "
            f"year_performance). Valid choices: {', '.join(VALID_AGGREGATION_METHODS)}. "
            f"Default: {', '.join(DEFAULT_AGGREGATION_METHODS)}.",
        )
        parser.add_argument(
            "--exclude-question-type",
            dest="exclude_question_types",
            action="append",
            default=None,
            help="Question type to exclude from the eligible pool (repeatable). "
            f"Valid choices: {', '.join(VALID_QUESTION_TYPES)}. Median-based "
            "aggregation methods (e.g. recency_weighted, unweighted) require "
            "multiple_choice to be excluded - their median renormalization "
            "needs the full PMF, which this fast path doesn't retain.",
        )
        parser.add_argument(
            "--score-type",
            default="default",
            choices=[c.value for c in ScoreTypes] + ["default"],
            help="Score type to compute. 'default' (the default) scores each "
            "question using its own default_score_type field instead of one "
            "fixed type for every question.",
        )
        parser.add_argument(
            "--min-forecasters",
            type=int,
            default=8,
            help="Minimum number of forecasters a question must have to be "
            "included (default: 8).",
        )
        parser.add_argument(
            "--rebuild-cache",
            action="store_true",
            default=False,
            help="Ignore any cached per-question data and rebuild it from the "
            "database (use after changing the PMF-reduction logic itself, or "
            "if a question's forecasts have changed).",
        )
        parser.add_argument(
            "--a",
            type=float,
            default=0.5,
            help="Decay/reputation blend exponent for reputation-weighted "
            "methods (single_aggregation, year_performance). Default: 0.5.",
        )
        parser.add_argument(
            "--b",
            type=float,
            default=6.0,
            help="Outer exponent for reputation-weighted methods' weight "
            "formula. Default: 6.0.",
        )

    def handle(self, *args, **options):
        start = time.perf_counter()

        seed = options["seed"]
        question_count = options["question_count"]
        score_type = options["score_type"]
        min_forecasters = options["min_forecasters"]
        exclude_question_types = options["exclude_question_types"] or []
        rebuild_cache = options["rebuild_cache"]
        a = options["a"]
        b = options["b"]
        aggregation_methods = (
            options["aggregation_methods"] or DEFAULT_AGGREGATION_METHODS
        )

        self._validate_options(aggregation_methods, exclude_question_types)

        question_ids = self._select_question_ids(
            min_forecasters=min_forecasters,
            question_count=question_count,
            seed=seed,
            exclude_question_types=exclude_question_types,
        )

        reputation_histories = self._preload_reputation_histories(
            question_ids, aggregation_methods
        )

        totals = {
            method: {"score": 0.0, "coverage": 0.0, "count": 0}
            for method in aggregation_methods
        }

        total_questions = len(question_ids)
        questions = Question.objects.filter(id__in=question_ids)
        for i, question in enumerate(questions.iterator(), start=1):
            if i == 1 or i % 25 == 0 or i == total_questions:
                self.stdout.write(f"  evaluating {i}/{total_questions}...")
            question_score_type = (
                question.default_score_type if score_type == "default" else score_type
            )
            try:
                self._score_question(
                    question,
                    question_score_type,
                    aggregation_methods,
                    totals,
                    rebuild_cache,
                    a,
                    b,
                    reputation_histories,
                )
            except Exception:
                logger.exception(
                    "Failed to evaluate question %s - skipping", question.id
                )
                continue

        elapsed = time.perf_counter() - start
        self._print_results(totals, elapsed, total_questions, score_type)

    def _validate_options(
        self, aggregation_methods: list[str], exclude_question_types: list[str]
    ) -> None:
        invalid_methods = sorted(
            set(aggregation_methods) - set(VALID_AGGREGATION_METHODS)
        )
        if invalid_methods:
            raise CommandError(
                f"Unknown aggregation method(s): {', '.join(invalid_methods)}. "
                f"Valid choices: {', '.join(VALID_AGGREGATION_METHODS)}"
            )

        invalid_types = sorted(set(exclude_question_types) - set(VALID_QUESTION_TYPES))
        if invalid_types:
            raise CommandError(
                f"Unknown question type(s): {', '.join(invalid_types)}. "
                f"Valid choices: {', '.join(VALID_QUESTION_TYPES)}"
            )

        median_methods = sorted(set(aggregation_methods) & MEDIAN_BASED_METHODS)
        if (
            median_methods
            and Question.QuestionType.MULTIPLE_CHOICE not in exclude_question_types
        ):
            raise CommandError(
                f"Median-based aggregation method(s) {', '.join(median_methods)} "
                "requested, but multiple_choice questions aren't excluded. "
                "Median aggregation's renormalization for multiple_choice needs "
                "the full PMF, which this fast path doesn't retain - add "
                "--exclude-question-type multiple_choice, or drop these methods."
            )

        unsupported_methods = sorted(
            set(aggregation_methods) - MEAN_BASED_METHODS - MEDIAN_BASED_METHODS
        )
        if unsupported_methods:
            raise CommandError(
                f"Aggregation method(s) {', '.join(unsupported_methods)} aren't "
                "supported by this fast scoring path yet."
            )

    def _preload_reputation_histories(
        self, question_ids: list[int], aggregation_methods: list[str]
    ) -> dict[str, dict[int, list]]:
        """Fetches every reputation-weighted method's full user-reputation
        history once for the whole batch of questions, instead of once per
        question - the dominant cost otherwise, since the same active
        forecasters reappear across most questions."""
        methods_needing_reputation = [
            m for m in aggregation_methods if m in REPUTATION_WEIGHTED_CLASSES
        ]
        if not methods_needing_reputation:
            return {}

        user_ids = list(
            Forecast.objects.filter(question_id__in=question_ids)
            .values_list("author_id", flat=True)
            .distinct()
        )
        # Bound the preload to what this batch actually needs - the latest
        # close time among its questions - rather than "now", which would
        # fetch a decade of irrelevant future scores for a batch of old
        # questions.
        end_time = Question.objects.filter(id__in=question_ids).aggregate(
            Max("scheduled_close_time")
        )["scheduled_close_time__max"]
        self.stdout.write(
            f"Preloading reputation history for {len(user_ids)} forecasters "
            f"({', '.join(methods_needing_reputation)})..."
        )
        return {
            method: preload_reputation_history(method, user_ids, end_time=end_time)
            for method in methods_needing_reputation
        }

    def _score_question(
        self,
        question: Question,
        question_score_type: str,
        aggregation_methods: list[str],
        totals: dict[str, dict[str, float]],
        rebuild_cache: bool,
        a: float,
        b: float,
        reputation_histories: dict[str, dict[int, list]],
    ) -> None:
        if question_score_type in SPOT_SCORE_TYPES:
            for method in aggregation_methods:
                score, coverage = compute_spot_scores(
                    question,
                    method,
                    question_score_type,
                    a=a,
                    b=b,
                    reputation_history=reputation_histories.get(method),
                )
                totals[method]["score"] += score
                totals[method]["coverage"] += coverage
                totals[method]["count"] += 1
            return

        data = get_or_build_question_data(question, rebuild_cache=rebuild_cache)
        if data is None:
            return

        gm_series = gm_counts = None
        if question_score_type == ScoreTypes.PEER:
            gm_series, gm_counts = compute_geometric_mean_series(data)

        for method in aggregation_methods:
            if method in MEAN_BASED_METHODS:
                series = compute_aggregation_series(
                    data,
                    question,
                    method,
                    a=a,
                    b=b,
                    reputation_history=reputation_histories.get(method),
                )
            else:
                series = compute_median_aggregation_series(data, method)

            if question_score_type == ScoreTypes.PEER:
                score, coverage = score_peer(data, series, gm_series, gm_counts)
            elif question_score_type == ScoreTypes.BASELINE:
                score, coverage = score_baseline(data, series)
            else:
                raise NotImplementedError(
                    f"Unsupported score_type for interval scoring: "
                    f"{question_score_type!r}"
                )
            totals[method]["score"] += score
            totals[method]["coverage"] += coverage
            totals[method]["count"] += 1

    def _select_question_ids(
        self,
        min_forecasters: int,
        question_count: int | None,
        seed: int | None,
        exclude_question_types: list[str],
    ) -> list[int]:
        eligible = (
            Question.objects.filter_public()
            .filter(resolution__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .exclude(type__in=exclude_question_types)
            .annotate(num_forecasters=Count("user_forecasts__author_id", distinct=True))
            .filter(num_forecasters__gte=min_forecasters)
            # Deterministic order so --seed sampling below is actually
            # reproducible - without it, Postgres row order for an unordered
            # query isn't guaranteed to be stable across runs even when the
            # underlying data hasn't changed, and random.Random.sample's
            # result depends on input order, not just input contents.
            # .order_by("id")
            .order_by("-scheduled_close_time", "id")
        )
        question_ids = list(eligible.values_list("id", flat=True))
        total_eligible = len(question_ids)

        if question_count is not None and question_count < total_eligible:
            rng = random.Random(seed)
            question_ids = rng.sample(question_ids, question_count)

        self.stdout.write(
            f"Evaluating {len(question_ids)} of {total_eligible} eligible questions "
            f"(min_forecasters={min_forecasters}, seed={seed}, "
            f"excluded_types={exclude_question_types or 'none'})"
        )
        return question_ids

    def _print_results(
        self,
        totals: dict[str, dict[str, float]],
        elapsed: float,
        num_questions: int,
        score_type: str,
    ) -> None:
        score_type_label = (
            "default (per-question default_score_type)"
            if score_type == "default"
            else score_type
        )
        self.stdout.write("")
        self.stdout.write(
            f"Results across {num_questions} questions, score_type={score_type_label} "
            f"(elapsed: {elapsed:.2f}s)"
        )
        header = (
            f"{'method':<20}{'questions':>10}{'total_score':>14}"
            f"{'avg_score':>12}{'avg_coverage':>14}"
        )
        self.stdout.write(header)
        self.stdout.write("-" * len(header))
        for method, stats in sorted(
            totals.items(), key=lambda kv: kv[1]["score"], reverse=True
        ):
            count = stats["count"] or 1
            avg_score = stats["score"] / count
            avg_coverage = stats["coverage"] / count
            self.stdout.write(
                f"{method:<20}{stats['count']:>10}{stats['score']:>14.2f}"
                f"{avg_score:>12.4f}{avg_coverage:>14.4f}"
            )
