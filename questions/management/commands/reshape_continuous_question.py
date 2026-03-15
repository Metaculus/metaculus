from bisect import bisect_right
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from typing import Optional, Literal, Sequence

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

Boundary = Literal["natural", "clamped", "not-a-knot"]


@dataclass
class CubicSplineC2:
    x: list[float]
    y: list[float]
    M: list[float]  # second derivatives at knots
    bc: Boundary
    m0: Optional[float] = None  # optional clamped slope at x0
    mn: Optional[float] = None  # optional clamped slope at xn

    def __call__(self, xp: float) -> float:
        """Evaluate spline at scalar xp (clamped to [x0, xn])."""
        x, y, M = self.x, self.y, self.M
        if xp <= x[0]:
            i = 0
        elif xp >= x[-1]:
            i = len(x) - 2
        else:
            i = bisect_right(x, xp) - 1

        h = x[i + 1] - x[i]
        a = (x[i + 1] - xp) / h
        b = (xp - x[i]) / h
        # Equivalent “M” formulation (stable and simple):
        return (
            a * y[i]
            + b * y[i + 1]
            + ((a**3 - a) * h**2 / 6.0) * M[i]
            + ((b**3 - b) * h**2 / 6.0) * M[i + 1]
        )

    def derivative(self, xp: float) -> float:
        """First derivative S'(xp)."""
        x, y, M = self.x, self.y, self.M
        if xp <= x[0]:
            i = 0
        elif xp >= x[-1]:
            i = len(x) - 2
        else:
            i = bisect_right(x, xp) - 1

        h = x[i + 1] - x[i]
        a = (x[i + 1] - xp) / h
        b = (xp - x[i]) / h
        return (
            (y[i + 1] - y[i]) / h
            + (-(3 * a * a - 1) * h / 6.0) * M[i]
            + ((3 * b * b - 1) * h / 6.0) * M[i + 1]
        )

    def second_derivative(self, xp: float) -> float:
        """Second derivative S''(xp)."""
        x = self.x
        if xp <= x[0]:
            i = 0
        elif xp >= x[-1]:
            i = len(x) - 2
        else:
            i = bisect_right(x, xp) - 1

        h = x[i + 1] - x[i]
        a = (x[i + 1] - xp) / h
        b = (xp - x[i]) / h
        return a * self.M[i] + b * self.M[i + 1]


def cubic_spline_c2(
    x: Sequence[float],
    y: Sequence[float],
    bc: Boundary = "natural",
    slope_start: Optional[float] = None,
    slope_end: Optional[float] = None,
) -> CubicSplineC2:
    """
    Build a C² cubic spline through (x, y).
    bc:
      - "natural": S''(x0) = S''(xn) = 0
      - "clamped": S'(x0) = slope_start, S'(xn) = slope_end  (provide both)
      - "not-a-knot": S''' continuous at x1 and x_{n-1}
    """
    x = list(map(float, x))
    y = list(map(float, y))
    n = len(x) - 1
    if n < 1:
        raise ValueError("Need at least two points.")
    # strictly increasing x
    for i in range(n):
        if not (x[i + 1] > x[i]):
            raise ValueError("x must be strictly increasing.")

    h = [x[i + 1] - x[i] for i in range(n)]
    d = [(y[i + 1] - y[i]) / h[i] for i in range(n)]  # secant slopes

    # Build tridiagonal system A * M = rhs for second derivatives M[0..n]
    A_diag = [0.0] * (n + 1)
    A_lo = [0.0] * n  # sub-diagonal (1..n) stored at index i for row i
    A_hi = [0.0] * n  # super-diagonal (0..n-1) stored at index i for row i

    rhs = [0.0] * (n + 1)

    if bc == "natural":
        # Natural: M0 = 0, Mn = 0
        A_diag[0] = 1.0
        A_diag[n] = 1.0
        rhs[0] = 0.0
        rhs[n] = 0.0

        for i in range(1, n):
            A_lo[i] = h[i - 1]
            A_diag[i] = 2.0 * (h[i - 1] + h[i])
            A_hi[i] = h[i]
            rhs[i] = 6.0 * (d[i] - d[i - 1])

    elif bc == "clamped":
        if slope_start is None or slope_end is None:
            raise ValueError("Provide slope_start and slope_end for clamped BC.")

        # First derivative conditions translate to equations in M:
        # Row 0 and n derived from Hermite-spline equivalence.
        A_diag[0] = 2 * h[0]
        A_hi[0] = h[0]
        rhs[0] = 6 * (d[0] - slope_start)

        A_lo[n] = h[n - 1]
        A_diag[n] = 2 * h[n - 1]
        rhs[n] = 6 * (slope_end - d[n - 1])

        for i in range(1, n):
            A_lo[i] = h[i - 1]
            A_diag[i] = 2.0 * (h[i - 1] + h[i])
            A_hi[i] = h[i]
            rhs[i] = 6.0 * (d[i] - d[i - 1])

    elif bc == "not-a-knot":
        # Not-a-knot: third derivative continuous at x1 and x_{n-1}
        # End rows:
        # Row 0: h1*M0 - (h0 + h1)*M1 + h0*M2 = 0
        # Row n: h_{n-2}*M_{n-2} - (h_{n-2}+h_{n-1})*M_{n-1} + h_{n-1}*Mn = 0
        if n == 1:
            # Fall back to natural if only two points (not-a-knot undefined)
            A_diag[0] = 1.0
            rhs[0] = 0.0
            A_diag[1] = 1.0
            rhs[1] = 0.0
        else:
            A_diag[0] = -(h[0] + h[1])
            A_hi[0] = h[0]
            # use A_hi[1] to represent coefficient for M2 in row 0? We keep tridiagonal,
            # so we fold by expressing via interior rows. A common stable shortcut:
            # Convert to near-tridiagonal by merging with row 1/row n-1 (standard practice).
            # For simplicity, we use a known compact setup:
            # Promote to a “modified” tridiagonal by replacing not-a-knot with equivalent
            # diagonal tweaks:
            # We'll use the equivalent popular implementation:
            pass

        # To avoid a long derivation here, we’ll use a compact standard recipe:
        # Replace not-a-knot with the de Boor “augmented” first/last interior row.
        # Formulas:
        # Row 0: A_diag[0]=h[1]; A_hi[0]=-(h[0]+h[1]); rhs[0]=0;  and add a virtual M2 via row 1 merge.
        # Row n: symmetric. This is fiddly to implement by hand without a small helper.
        #
        # => To keep this function clean and reliable, we’ll implement not-a-knot
        #     by calling a tiny helper that builds an (n+1)x(n+1) dense system
        #     and solves it with Thomas after band extraction.

        # Build dense then reduce to band (simple/robust for small n):

        N = n + 1
        A = [[0.0] * (N) for _ in range(N)]
        b = [0.0] * N

        # interior second-derivative continuity rows:
        for i in range(1, n):
            A[i][i - 1] = h[i - 1]
            A[i][i] = 2 * (h[i - 1] + h[i])
            A[i][i + 1] = h[i]
            b[i] = 6 * (d[i] - d[i - 1])

        # not-a-knot constraints at x1 and x_{n-1}:
        # h1*M0 - (h0 + h1)*M1 + h0*M2 = 0
        A[0][0] = h[1]
        A[0][1] = -(h[0] + h[1])
        if n >= 2:
            A[0][2] = h[0]
        b[0] = 0.0

        # h_{n-2}*M_{n-2} - (h_{n-2} + h_{n-1})*M_{n-1} + h_{n-1}*Mn = 0
        A[n][n - 2] = h[n - 2] if n >= 2 else 0.0
        A[n][n - 1] = -(h[n - 2] + h[n - 1]) if n >= 2 else -h[n - 1]
        A[n][n] = h[n - 1]
        b[n] = 0.0

        # Solve dense (Gaussian elimination). For n up to a few thousand this is fine.
        # If you prefer strictly tridiagonal Thomas, stick to "natural" or "clamped".
        _dense_gauss_solve(A, b)
        M = b

        return CubicSplineC2(x, y, M, bc="not-a-knot")

    else:
        raise ValueError("bc must be 'natural', 'clamped', or 'not-a-knot'.")

    # Solve tridiagonal system via Thomas algorithm
    M = _solve_tridiagonal(A_lo, A_diag, A_hi, rhs)
    return CubicSplineC2(x, y, M, bc=bc, m0=slope_start, mn=slope_end)


def _solve_tridiagonal(a, b, c, d):
    """
    Thomas algorithm for tridiagonal system.
    a[1..n] subdiag, b[0..n] diag, c[0..n-1] superdiag, d[0..n] rhs
    Returns solution x with length n+1.
    """
    n = len(b) - 1
    cp = c[:]  # modified superdiag
    dp = d[:]  # modified rhs
    bp = b[:]  # modified diag

    # forward sweep
    for i in range(1, n + 1):
        w = a[i] / bp[i - 1]
        bp[i] -= w * cp[i - 1]
        dp[i] -= w * dp[i - 1]

    # back substitution
    x = [0.0] * (n + 1)
    x[n] = dp[n] / bp[n]
    for i in range(n - 1, -1, -1):
        x[i] = (dp[i] - cp[i] * x[i + 1]) / bp[i]
    return x


def _dense_gauss_solve(A, b):
    """In-place Gaussian elimination solve for A x = b (naive but fine for moderate N)."""
    N = len(b)
    for k in range(N):
        # pivot (no partial pivoting for brevity; add if needed)
        pivot = A[k][k]
        if pivot == 0.0:
            # find a row to swap
            for r in range(k + 1, N):
                if A[r][k] != 0.0:
                    A[k], A[r] = A[r], A[k]
                    b[k], b[r] = b[r], b[k]
                    pivot = A[k][k]
                    break
            if pivot == 0.0:
                raise ValueError("Singular matrix in Gaussian elimination.")
        inv = 1.0 / pivot
        # normalize row
        for j in range(k, N):
            A[k][j] *= inv
        b[k] *= inv
        # eliminate below
        for i in range(k + 1, N):
            factor = A[i][k]
            if factor != 0.0:
                for j in range(k, N):
                    A[i][j] -= factor * A[k][j]
                b[i] -= factor * b[k]
    # back substitution
    for i in range(N - 1, -1, -1):
        s = b[i]
        for j in range(i + 1, N):
            s -= A[i][j] * b[j]
        b[i] = s


class Command(BaseCommand):
    help = "Reshapes the range for a continuous question. Can also convert to discrete."

    def add_arguments(self, parser):
        parser.add_argument(
            "--question_id",
            type=int,
            required=True,
            help="Question ID to reshape. NOT the Post ID. Required.",
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
        parser.add_argument(
            "--rescore",
            action="store_true",
            help="Whether to rescore the question.",
        )

        # range details
        # TODO: add support for changing bound openness
        parser.add_argument(
            "--nominal_range_min",
            type=str,
            help="New range min (nominal). If not provided, keeps current value."
            " If the question is date, use YYYY-MM-DD format.",
        )
        parser.add_argument(
            "--nominal_range_max",
            type=str,
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
            help="If converting to discrete, the step size between outcomes."
            " Required if discrete is True.",
        )

        # new times
        parser.add_argument(
            "--new_scheduled_close_time",
            type=str,
            help="New scheduled close time in YYYY-MM-DD HH:MM:SS format."
            " If not provided, keeps current scheduled close time.",
        )
        parser.add_argument(
            "--new_scheduled_resolve_time",
            type=str,
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
        return new_post

    @transaction.atomic
    def make_copy_of_question(
        self, question: Question, approve_copy_post: bool
    ) -> Question:
        self.stdout.write(
            self.style.WARNING(f"Making copy of question {question.id}...")
        )
        # copy question
        new_question = clone_question(question)

        # copy post
        post = question.get_post()
        if post is None:
            raise ValueError("question has no post to copy")
        new_post = self.clone_post(post, new_question)
        if not approve_copy_post:
            new_post.curation_status = Post.CurationStatus.DRAFT
        new_post.save()

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
            spline = cubic_spline_c2(x_locs, cdf, bc="not-a-knot")

            def get_cdf_at(unscaled_location: float) -> float:
                if unscaled_location <= 0:
                    return cdf[0]
                if unscaled_location >= 1:
                    return cdf[-1]
                return spline(unscaled_location)

            if not discrete:
                # evaluate cdf at critical points
                new_cdf: list[float] = []
                for x in np.linspace(
                    new_nominal_range_min,
                    new_nominal_range_max,
                    new_inbound_outcome_count + 1,
                ):
                    location = scaled_location_to_unscaled_location(x, basis_question)
                    new_cdf.append(get_cdf_at(location))
            else:
                # evaluate pmf at critical points, ignoring mass assigned between them
                # no smoothing b/c resolution decreases
                pmf = [cdf[0]]
                for i in range(1, len(cdf)):
                    pmf.append(cdf[i] - cdf[i - 1])
                pmf.append(1 - cdf[-1])
                inbound_pmf: list[float] = []
                for x in np.linspace(
                    new_nominal_range_min,
                    new_nominal_range_max,
                    new_inbound_outcome_count,
                ):
                    index = string_location_to_bucket_index(
                        str(round(x, 10)), basis_question
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
                ip_array = np.array(inbound_pmf)
                ip_array = (
                    (1 - prob_below_lower - prob_above_upper)
                    * ip_array
                    / np.sum(ip_array)
                )
                new_pmf = [prob_below_lower] + ip_array.tolist() + [prob_above_upper]
                new_cdf = np.cumsum(new_pmf).tolist()[:-1]
            return new_cdf

        forecasts = question_to_change.user_forecasts.all()
        c = forecasts.count()
        self.stdout.write(self.style.WARNING(f"Rescaling {c} forecasts..."))
        with ModelBatchUpdater(
            model_class=Forecast,
            fields=["continuous_cdf", "distribution_input"],
            batch_size=100,
        ) as updater:
            for idx, forecast in enumerate(forecasts.iterator(chunk_size=100), 1):
                forecast.continuous_cdf = transform_cdf(forecast.continuous_cdf)
                forecast.distribution_input = None
                updater.append(forecast)

                if idx % 100 == 0:
                    self.stdout.write(
                        self.style.WARNING(f"Rescaled {idx}/{c} forecasts...")
                    )
            self.stdout.write(
                self.style.SUCCESS(f"Rescaled {idx}/{c} forecasts... DONE")
            )
        self.stdout.write(self.style.WARNING("Rebuilding aggregations..."))
        build_question_forecasts(question_to_change)
        self.stdout.write(self.style.SUCCESS("Rebuilding aggregations... DONE"))

        return question_to_change

    def handle(self, *args, **options) -> None:
        question_id = options["question_id"]
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
        rescore = options["rescore"]
        # range details
        nominal_range_min = (
            options["nominal_range_min"]
            if options["nominal_range_min"] is not None
            else question.range_min
        )
        nominal_range_max = (
            options["nominal_range_max"]
            if options["nominal_range_max"] is not None
            else question.range_max
        )
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
                    self.style.SUCCESS(f"Stored Post ID: {stored_post.id}")
                )

            # rescore
            if rescore and question.resolution is not None:
                score_question(
                    question,
                    question.resolution,
                )
                self.stdout.write(self.style.SUCCESS("Rescored question successfully!"))
