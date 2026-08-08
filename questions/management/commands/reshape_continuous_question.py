from bisect import bisect_right
from datetime import datetime, timezone as dt_timezone
from typing import Sequence, Callable

from django.core.management.base import BaseCommand
from django.db import transaction
import numpy as np

from utils.the_math.formulas import (
    scaled_location_to_unscaled_location,
    string_location_to_bucket_index,
)
from posts.models import Post
from questions.models import QUESTION_CONTINUOUS_TYPES, Forecast, Question
from questions.services.forecasts import build_question_forecasts
from questions.services.common import clone_question
from scoring.utils import score_question
from utils.models import ModelBatchCreator, ModelBatchUpdater


def _dense_gauss_solve(mat, rhs):
    """In-place Gaussian elimination solve for mat x = rhs (naive but fine for moderate N)."""
    size = len(rhs)
    for k in range(size):
        pivot = mat[k][k]
        if pivot == 0.0:
            # find a row to swap
            for r in range(k + 1, size):
                if mat[r][k] != 0.0:
                    mat[k], mat[r] = mat[r], mat[k]
                    rhs[k], rhs[r] = rhs[r], rhs[k]
                    pivot = mat[k][k]
                    break
            if pivot == 0.0:
                raise ValueError("Singular matrix in Gaussian elimination.")
        inv = 1.0 / pivot
        for j in range(k, size):
            mat[k][j] *= inv
        rhs[k] *= inv
        for i in range(k + 1, size):
            factor = mat[i][k]
            if factor != 0.0:
                for j in range(k, size):
                    mat[i][j] -= factor * mat[k][j]
                rhs[i] -= factor * rhs[k]
    # back substitution
    for i in range(size - 1, -1, -1):
        acc = rhs[i]
        for j in range(i + 1, size):
            acc -= mat[i][j] * rhs[j]
        rhs[i] = acc


def get_spline_function(
    xs: Sequence[float],
    ys: Sequence[float],
) -> Callable[[float], float]:
    """
    Build a C² cubic spline through (xs, ys).
    "not-a-knot": S''' continuous at x1 and x_{n-1}
    """
    xs = list(map(float, xs))
    ys = list(map(float, ys))
    n_segs = len(xs) - 1
    if n_segs < 1:
        raise ValueError("Need at least two points.")
    for i in range(n_segs):
        if not (xs[i + 1] > xs[i]):
            raise ValueError("x must be strictly increasing.")

    widths = [xs[i + 1] - xs[i] for i in range(n_segs)]
    slopes = [(ys[i + 1] - ys[i]) / widths[i] for i in range(n_segs)]

    size = n_segs + 1
    mat = [[0.0] * size for _ in range(size)]
    second_derivs = [0.0] * size

    # interior second-derivative continuity rows
    for i in range(1, n_segs):
        mat[i][i - 1] = widths[i - 1]
        mat[i][i] = 2 * (widths[i - 1] + widths[i])
        mat[i][i + 1] = widths[i]
        second_derivs[i] = 6 * (slopes[i] - slopes[i - 1])

    # not-a-knot constraints at x1 and x_{n-1}:
    # widths[1]*M0 - (widths[0] + widths[1])*M1 + widths[0]*M2 = 0
    mat[0][0] = widths[1]
    mat[0][1] = -(widths[0] + widths[1])
    if n_segs >= 2:
        mat[0][2] = widths[0]
    second_derivs[0] = 0.0

    # widths[n-2]*M_{n-2} - (widths[n-2] + widths[n-1])*M_{n-1} + widths[n-1]*Mn = 0
    mat[n_segs][n_segs - 2] = widths[n_segs - 2] if n_segs >= 2 else 0.0
    mat[n_segs][n_segs - 1] = (
        -(widths[n_segs - 2] + widths[n_segs - 1])
        if n_segs >= 2
        else -widths[n_segs - 1]
    )
    mat[n_segs][n_segs] = widths[n_segs - 1]
    second_derivs[n_segs] = 0.0

    _dense_gauss_solve(mat, second_derivs)

    def spline(pt: float) -> float:
        "Evaluate spline at pt (clamped to [xs[0], xs[-1]])."
        if pt <= xs[0]:
            i = 0
        elif pt >= xs[-1]:
            i = len(xs) - 2
        else:
            i = bisect_right(xs, pt) - 1

        width = xs[i + 1] - xs[i]
        lo_w = (xs[i + 1] - pt) / width
        hi_w = (pt - xs[i]) / width
        return (
            lo_w * ys[i]
            + hi_w * ys[i + 1]
            + ((lo_w**3 - lo_w) * width**2 / 6.0) * second_derivs[i]
            + ((hi_w**3 - hi_w) * width**2 / 6.0) * second_derivs[i + 1]
        )

    return spline


class Command(BaseCommand):
    help = "Reshapes the range for a continuous question. Can also convert to discrete."

    def add_arguments(self, parser):

        parser.add_argument(
            "--dry_run",
            action="store_true",
            help="Run the full reshape logic but roll back all DB changes at the end.",
        )

        parser.add_argument(
            "--question_id",
            type=int,
            default=None,
            help="Question ID to reshape. Provide either this or --post_id.",
        )
        parser.add_argument(
            "--post_id",
            type=int,
            default=None,
            help="Post ID whose single question will be reshaped. Provide either this or --question_id.",
        )

        # copy question options
        parser.add_argument(
            "--make_copy",
            action="store_true",
            help="Whether to make a copy of the question before reshaping. "
            "Defaults to False.",
        )
        parser.add_argument(
            "--alter_copy",
            action="store_true",
            help="Whether to alter the copy of the question instead of the original.",
        )
        parser.add_argument(
            "--approve_copy_post",
            action="store_true",
            help="Whether to set the copied post's approval. Default sets it to draft.",
        )

        # range details
        # TODO: add support for changing bound openness
        parser.add_argument(
            "--nominal_range_min",
            type=str,
            default=None,
            help="New range min (nominal). If not provided, keeps current value."
            " If the question is date, use YYYY-MM-DD format.",
        )
        parser.add_argument(
            "--nominal_range_max",
            type=str,
            default=None,
            help="New range max (nominal). If not provided, keeps current value."
            " If the question is date, use YYYY-MM-DD format.",
        )
        # Discrete conversion details
        parser.add_argument(
            "--convert_to_discrete",
            action="store_true",
            help="Whether to convert the question to discrete."
            " If not provided, keeps current type.",
        )
        parser.add_argument(
            "--step",
            type=float,
            default=None,
            help="If converting to discrete, the step size between outcomes."
            " Required if discrete is True.",
        )

        # new times
        parser.add_argument(
            "--new_scheduled_close_time",
            type=str,
            default=None,
            help="New scheduled close time in YYYY-MM-DD HH:MM:SS format."
            " If not provided, keeps current scheduled close time.",
        )
        parser.add_argument(
            "--new_scheduled_resolve_time",
            type=str,
            default=None,
            help="New scheduled resolve time in YYYY-MM-DD HH:MM:SS format."
            " If not provided, keeps current scheduled resolve time.",
        )

    def clone_post(self, post: Post, new_question: Question) -> Post:
        post_dict: dict = {}
        for k, v in post.__dict__.items():
            if k.startswith("_") or k == "id" or k == "group_of_questions_id":
                pass
            elif k == "question_id":
                post_dict[k] = new_question.id
            else:
                post_dict[k] = v
        new_post = Post(**post_dict)
        new_post.save()
        new_question.post_id = new_post.id
        new_question.save()
        return new_post

    @transaction.atomic
    def make_copy_of_question(
        self, question: Question, approve_copy_post: bool
    ) -> Question:
        self.stdout.write(
            self.style.WARNING(f"Making copy of question {question.id}...")
        )
        # copy question
        new_question = clone_question(question, title=question.title)

        # copy post
        post = question.get_post()
        if post is None:
            raise ValueError("question has no post to copy")
        new_post = self.clone_post(post, new_question)
        if not approve_copy_post:
            new_post.curation_status = Post.CurationStatus.DRAFT
        new_post.save()

        idx = 0
        with ModelBatchCreator(model_class=Forecast, batch_size=100) as creator:
            for idx, forecast in enumerate(
                question.user_forecasts.iterator(chunk_size=100), 1
            ):
                forecast.id = None
                forecast.pk = None
                forecast.question = new_question
                forecast.post = new_post
                creator.append(forecast)

                if idx % 100 == 0:
                    self.stdout.write(self.style.WARNING(f"Copied {idx} forecasts..."))
            self.stdout.write(self.style.SUCCESS(f"Copied {idx} forecasts... DONE"))

        new_question.aggregate_forecasts.all().delete()
        build_question_forecasts(new_question)
        self.stdout.write(
            self.style.SUCCESS(f"Making copy of question {question.id}... DONE")
        )
        self.stdout.write(self.style.SUCCESS(f"New post id: {new_post.id}"))
        return new_question

    def reshape_question(
        self,
        question_to_change: Question,
        basis_question: Question,
        new_nominal_range_min: float,
        new_nominal_range_max: float,
        new_scheduled_close_time: datetime | None,
        new_scheduled_resolve_time: datetime | None,
        discrete: bool,
        step: float | None,
    ):
        previous_inbound_outcome_count = question_to_change.inbound_outcome_count
        if discrete:
            if step is None:  # keep the same step
                # since we're using real range (not nominal),
                # don't subtract 1 from inbound outcome count
                step = (question_to_change.range_max - question_to_change.range_min) / (
                    question_to_change.inbound_outcome_count
                )
            float_inbound_outcome_count = (
                new_nominal_range_max - new_nominal_range_min
            ) / step + 1
            if not round(float_inbound_outcome_count, 10) % 1 == 0:
                raise ValueError("step must divide range")
            new_inbound_outcome_count = round(float_inbound_outcome_count)
            question_to_change.range_min = round(new_nominal_range_min - 0.5 * step, 10)
            question_to_change.range_max = round(new_nominal_range_max + 0.5 * step, 10)
            question_to_change.inbound_outcome_count = new_inbound_outcome_count
            question_to_change.type = Question.QuestionType.DISCRETE
        else:
            question_to_change.range_min = new_nominal_range_min
            question_to_change.range_max = new_nominal_range_max
        if new_scheduled_close_time:
            question_to_change.scheduled_close_time = new_scheduled_close_time
        if new_scheduled_resolve_time or new_scheduled_close_time:
            question_to_change.scheduled_resolve_time = (
                new_scheduled_resolve_time or new_scheduled_close_time
            )
        question_to_change.save()
        post: Post = question_to_change.post
        post.update_pseudo_materialized_fields()

        new_inbound_outcome_count = question_to_change.get_inbound_outcome_count()

        def transform_cdf(cdf: list[float]):

            x_locs = np.linspace(
                0, 1, (previous_inbound_outcome_count or 200) + 1
            ).tolist()
            spline = get_spline_function(x_locs, cdf)

            def get_cdf_at(unscaled_location: float) -> float:
                if unscaled_location <= 0:
                    return cdf[0]
                if unscaled_location >= 1:
                    return cdf[-1]
                return spline(unscaled_location)

            if not discrete:
                # evaluate cdf at critical points
                new_cdf: list[float] = []
                for nom_val in np.linspace(
                    new_nominal_range_min,
                    new_nominal_range_max,
                    new_inbound_outcome_count + 1,
                ):
                    location = scaled_location_to_unscaled_location(
                        nom_val, basis_question
                    )
                    new_cdf.append(get_cdf_at(location))
            else:
                # evaluate pmf at critical points, ignoring mass assigned between them
                # no smoothing b/c resolution decreases
                pmf = [cdf[0]]
                for i in range(1, len(cdf)):
                    pmf.append(cdf[i] - cdf[i - 1])
                pmf.append(1 - cdf[-1])
                inbound_pmf: list[float] = []
                for nom_val in np.linspace(
                    new_nominal_range_min,
                    new_nominal_range_max,
                    new_inbound_outcome_count,
                ):
                    index = string_location_to_bucket_index(
                        str(round(nom_val, 10)), basis_question
                    )
                    assert index is not None
                    inbound_pmf.append(pmf[index])

                prob_below_lower = (
                    get_cdf_at(
                        scaled_location_to_unscaled_location(
                            question_to_change.range_min, basis_question
                        )
                    )
                    if question_to_change.open_lower_bound
                    else 0
                )
                prob_above_upper = (
                    1
                    - get_cdf_at(
                        scaled_location_to_unscaled_location(
                            question_to_change.range_max, basis_question
                        )
                    )
                    if question_to_change.open_upper_bound
                    else 0
                )
                # renormalize (respecting out of bounds weights)
                inbound_arr = np.array(inbound_pmf)
                inbound_arr = (
                    (1 - prob_below_lower - prob_above_upper)
                    * inbound_arr
                    / np.sum(inbound_arr)
                )
                new_pmf = [prob_below_lower] + inbound_arr.tolist() + [prob_above_upper]
                new_cdf = np.cumsum(new_pmf).tolist()[:-1]
            return new_cdf

        forecasts = question_to_change.user_forecasts.all()
        total_count = forecasts.count()
        with ModelBatchUpdater(
            model_class=Forecast,
            fields=["continuous_cdf", "distribution_input"],
            batch_size=100,
        ) as updater:
            for idx, forecast in enumerate(forecasts.iterator(chunk_size=100), 1):
                print(f"Processing forecast {idx} of {total_count}", end="\r")
                forecast.continuous_cdf = transform_cdf(forecast.continuous_cdf)
                forecast.distribution_input = None
                updater.append(forecast)

        build_question_forecasts(question_to_change)

    def handle(self, *args, **options) -> None:
        question_id = options["question_id"]
        post_id = options["post_id"]

        if question_id is None and post_id is None:
            self.stdout.write(
                self.style.ERROR("Must provide --question_id or --post_id.")
            )
            return
        if question_id is not None and post_id is not None:
            self.stdout.write(
                self.style.ERROR("Provide --question_id or --post_id, not both.")
            )
            return

        if post_id is not None:
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Post with ID {post_id} does not exist.")
                )
                return
            questions = post.get_questions()
            if len(questions) != 1:
                self.stdout.write(
                    self.style.ERROR(
                        f"Post {post_id} has {len(questions)} questions; requires "
                        "exactly 1. Please submit question_id instead of post_id."
                    )
                )
                return
            question = questions[0]
        else:
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Question with ID {question_id} does not exist.")
                )
                return
        make_copy = options["make_copy"]
        alter_copy = options["alter_copy"]
        approve_copy_post = options["approve_copy_post"]
        dry_run = options["dry_run"]
        # range details
        nominal_range_min = options.get("nominal_range_min")
        if nominal_range_min is None:
            if question.type == "discrete":
                step = (
                    question.range_max - question.range_min
                ) / question.inbound_outcome_count
                nominal_range_min = question.range_min + step / 2
            else:
                nominal_range_min = question.range_min
        nominal_range_max = options.get("nominal_range_max")
        if nominal_range_max is None:
            if question.type == "discrete":
                step = (
                    question.range_max - question.range_min
                ) / question.inbound_outcome_count
                nominal_range_max = question.range_max - step / 2
            else:
                nominal_range_max = question.range_max
        # discrete conversion details
        convert_to_discrete = options["convert_to_discrete"]
        step = options["step"]
        # new times
        new_scheduled_close_time = options["new_scheduled_close_time"]
        new_scheduled_resolve_time = options["new_scheduled_resolve_time"]

        # input parsing
        try:
            try:
                nominal_range_min = float(nominal_range_min)
            except ValueError:
                nominal_range_min = (
                    datetime.fromisoformat(nominal_range_min)
                    .replace(tzinfo=dt_timezone.utc)
                    .timestamp()
                )
            try:
                nominal_range_max = float(nominal_range_max)
            except ValueError:
                nominal_range_max = (
                    datetime.fromisoformat(nominal_range_max)
                    .replace(tzinfo=dt_timezone.utc)
                    .timestamp()
                )
        except ValueError:
            self.stdout.write(
                self.style.ERROR(
                    "Invalid format for nominal_range_min or nominal_range_max. "
                    "Please input a float if numeric or discrete, YYYY-MM-DD for date."
                )
            )
            return
        try:
            if new_scheduled_close_time is not None:
                new_scheduled_close_time = datetime.fromisoformat(
                    new_scheduled_close_time
                ).replace(tzinfo=dt_timezone.utc)
        except ValueError:
            self.stdout.write(
                self.style.ERROR(
                    "Invalid format for new_scheduled_close_time. "
                    "Please use YYYY-MM-DD HH:MM:SS format."
                )
            )
            return
        try:
            if new_scheduled_resolve_time is not None:
                new_scheduled_resolve_time = datetime.fromisoformat(
                    new_scheduled_resolve_time
                ).replace(tzinfo=dt_timezone.utc)
        except ValueError:
            self.stdout.write(
                self.style.ERROR(
                    "Invalid format for new_scheduled_resolve_time. "
                    "Please use YYYY-MM-DD HH:MM:SS format."
                )
            )
            return
        discrete = (
            convert_to_discrete or question.type == Question.QuestionType.DISCRETE
        )

        # validations
        if question.type not in QUESTION_CONTINUOUS_TYPES:
            self.stdout.write(
                self.style.ERROR(
                    "Question type must be numeric, discrete, or date to reshape."
                )
            )
            return
        if question.type == Question.QuestionType.DATE:
            if convert_to_discrete:
                self.stdout.write(
                    self.style.ERROR("Date questions cannot be converted to discrete.")
                )
                return
        if convert_to_discrete and step is None:
            self.stdout.write(
                self.style.ERROR("Must provide step size when converting to discrete.")
            )
            return

        with transaction.atomic():
            # Set up basis vs changing question
            stored_question: Question | None = None
            if make_copy:
                stored_question = self.make_copy_of_question(
                    question, approve_copy_post
                )
                if alter_copy:
                    question_to_change = stored_question
                    basis_question = question
                else:
                    question_to_change = question
                    basis_question = stored_question
            else:
                question_to_change = question
                basis_question = Question.objects.get(id=question.id)

            # execute reshape
            self.reshape_question(
                question_to_change=question_to_change,
                basis_question=basis_question,
                new_nominal_range_min=nominal_range_min,
                new_nominal_range_max=nominal_range_max,
                new_scheduled_close_time=new_scheduled_close_time,
                new_scheduled_resolve_time=new_scheduled_resolve_time,
                discrete=discrete,
                step=step,
            )
            self.stdout.write(self.style.SUCCESS("Reshaped question successfully!"))

            if stored_question:
                stored_post = stored_question.get_post()
                assert stored_post
                self.stdout.write(
                    self.style.SUCCESS(f"Copied Post ID: {stored_post.id}")
                )

            # rescore
            if question_to_change.resolution is not None:
                score_question(
                    question_to_change,
                    question_to_change.resolution,
                )
                self.stdout.write(self.style.SUCCESS("Rescored question successfully!"))

            if dry_run:
                transaction.set_rollback(True)
                self.stdout.write(
                    self.style.WARNING("Dry run — all changes rolled back.")
                )
