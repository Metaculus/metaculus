import logging
import time
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from questions.cache import invalidate_average_coverage_cache
from questions.constants import UnsuccessfulResolutionType
from questions.models import Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes
from scoring.models import Score
from scoring.utils import get_question_scores, invalidate_clipped_scores_cache

logger = logging.getLogger(__name__)

SPOT_SCORE_TYPES = [ScoreTypes.SPOT_PEER, ScoreTypes.SPOT_BASELINE]


def required_score_types(
    question: Question, score_types: list[ScoreTypes]
) -> list[ScoreTypes]:
    """Spot score types only apply to questions with a spot scoring time."""
    if question.get_spot_scoring_time():
        return score_types
    return [s for s in score_types if s not in SPOT_SCORE_TYPES]


def score_question_aggregations(
    question: Question,
    aggregation_methods: list[AggregationMethod],
    score_types: list[ScoreTypes],
) -> int:
    """Scores `aggregation_methods` with `score_types` on a resolved question,
    replacing only those scores. score_question can't be used: it replaces every
    score of the score types it computes, users' and other aggregations' included.
    Spot score types are skipped on questions without a spot scoring time, as
    on resolution."""
    score_types = required_score_types(question, score_types)
    if not score_types:
        return 0

    new_scores = [
        score
        for score in get_question_scores(
            question,
            question.resolution,
            spot_scoring_time=question.get_spot_scoring_time(),
            score_types=score_types,
            aggregation_methods=aggregation_methods,
        )
        if score.aggregation_method in aggregation_methods
    ]
    for score in new_scores:
        score.question = question
        score.edited_at = question.resolution_set_time

    with transaction.atomic():
        Score.objects.filter(
            question=question,
            aggregation_method__in=aggregation_methods,
            score_type__in=score_types,
        ).delete()
        Score.objects.bulk_create(new_scores, batch_size=500)
    invalidate_average_coverage_cache([question])
    invalidate_clipped_scores_cache(question)
    return len(new_scores)


class Command(BaseCommand):
    help = (
        "Scores the named aggregation methods with the named score types on "
        "resolved questions, leaving all other scores untouched. Resumable: "
        "questions that already have every named score type for every named "
        "method are skipped unless --force. Rebuild leaderboards afterwards."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--methods",
            nargs="+",
            required=True,
            choices=AggregationMethod.values,
            help="Aggregation methods to score",
        )
        parser.add_argument(
            "--score-types",
            nargs="+",
            required=True,
            choices=[s for s in ScoreTypes.values if s != ScoreTypes.MANUAL],
            help="Score types to compute",
        )
        parser.add_argument(
            "--question-ids",
            nargs="+",
            type=int,
            help="Only these questions",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Rescore questions that already have the requested scores",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Score at most this many questions (skipped ones don't count)",
        )

    def handle(self, *args, **options):
        methods = [AggregationMethod(m) for m in options["methods"]]
        score_types = [ScoreTypes(s) for s in options["score_types"]]
        limit = options["limit"]

        qs = (
            Question.objects.filter(resolution__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType.values)
            .order_by("id")
        )
        if options["question_ids"]:
            qs = qs.filter(id__in=options["question_ids"])
        question_ids = list(qs.values_list("id", flat=True))

        # (method, score type) pairs each question already has, for skipping
        existing: dict[int, set[tuple[str, str]]] = defaultdict(set)
        if not options["force"]:
            for question_id, method, score_type in (
                Score.objects.filter(
                    question_id__in=question_ids,
                    aggregation_method__in=methods,
                    score_type__in=score_types,
                )
                .values_list("question_id", "aggregation_method", "score_type")
                .distinct()
            ):
                existing[question_id].add((method, score_type))

        c = len(question_ids)
        print(
            f"Scoring {', '.join(methods)} ({', '.join(score_types)}) "
            f"on up to {c} resolved questions"
            + (f", at most {limit}." if limit else ".")
        )
        tm = time.time()
        scored = skipped = 0
        failed: list[int] = []
        for i, question_id in enumerate(question_ids, start=1):
            if limit and scored + len(failed) >= limit:
                break
            question = Question.objects.get(id=question_id)
            required = {
                (method, score_type)
                for method in methods
                for score_type in required_score_types(question, score_types)
            }
            if not options["force"] and required <= existing[question_id]:
                skipped += 1
                continue
            try:
                score_question_aggregations(question, methods, score_types)
                scored += 1
            except Exception:
                failed.append(question_id)
                logger.exception(
                    "Failed to score aggregations for question %s", question_id
                )
            print(
                f"Checked {i}/{c}: scored {scored}, skipped {skipped}, "
                f"failed {len(failed)} dur:{round(time.time() - tm)}s",
                end="\r",
            )
        print(
            f"\nScored {scored}, skipped {skipped} already complete, "
            f"failed {len(failed)}."
        )
        if failed:
            raise CommandError(f"{len(failed)} questions failed: {failed}")
        print("Done. Rebuild leaderboards to pick up the new scores.")
