import csv
import io
import zipfile
import hashlib

from django.db.models import QuerySet, Q
from django.utils import timezone

from comments.models import Comment
from questions.models import Question, AggregateForecast, Forecast
from questions.types import AggregationMethod
from scoring.models import Score, ArchivedScore
from users.models import User
from utils.the_math.aggregations import get_aggregation_history


def export_specific_data_for_questions(
    questions: QuerySet[Question],
    user: User | None = None,
    aggregation_methods: list[AggregationMethod] | None = None,
    include_comments: bool = False,
    include_scores: bool = False,
    include_bots: bool = False,
    minimize: bool = True,
) -> bytes:
    # This method only returns a specific user's own data and public data - typically
    # only called by a view. Respects cp_reveal_time.

    # check input
    if not aggregation_methods and (include_bots or not minimize):
        raise ValueError(
            "If user_ids, include_bots, or minimize is set, "
            "aggregation_methods must also be set."
        )

    user_forecasts = (
        None
        if user is None
        else Forecast.objects.filter(author=user, question__in=questions).order_by(
            "question_id", "start_time"
        )
    )

    now = timezone.now()
    aggregate_forecasts: list[AggregateForecast] = []
    for question in questions:
        if question.cp_reveal_time and question.cp_reveal_time > now:
            # CP is hidden, don't return any aggregate forecasts
            continue

        if not aggregation_methods:
            aggregate_forecasts = list(
                AggregateForecast.objects.filter(question__in=questions).order_by(
                    "question_id", "start_time"
                )
            )
        else:
            aggregate_forecasts = []
            for question in questions:
                aggregation_dict = get_aggregation_history(
                    question,
                    aggregation_methods,
                    user_ids=None,
                    minimize=minimize,
                    include_stats=True,
                    include_bots=(
                        include_bots
                        if include_bots is not None
                        else question.include_bots_in_aggregates
                    ),
                    histogram=True,
                )
                for values in aggregation_dict.values():
                    aggregate_forecasts.extend(values)

    if include_comments:
        comments = Comment.objects.filter(
            Q(is_private=False) | Q(author=user),
            Q(is_soft_deleted=False) | Q(author=user),
            on_post__in=questions.values_list("related_posts__post", flat=True),
        ).order_by("created_at")
    else:
        comments = None

    if include_scores:
        scores = Score.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            question__in=questions,
        ).order_by("created_at")
        archived_scores = ArchivedScore.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            question__in=questions,
        ).order_by("created_at")
        all_scores = scores.union(archived_scores)
    else:
        all_scores = None
    return export_data_for_questions(
        questions=questions,
        user_forecasts=user_forecasts,
        aggregate_forecasts=aggregate_forecasts,
        comments=comments,
        scores=all_scores,
    )


def export_all_data_for_questions(
    questions: QuerySet[Question],
    aggregation_methods: list[AggregationMethod] | None = None,
    user_ids: list[int] | None = None,
    include_comments: bool = False,
    include_scores: bool = False,
    include_bots: bool = False,
    minimize: bool = True,
    anonymized: bool = False,
) -> bytes:
    # This method returns all data including private and should only be called by
    # admin panel or a view called by staff or whitelisted user.
    # Does not respect cp_reveal_time.

    # check input
    if not aggregation_methods and (
        (user_ids is not None) or include_bots or not minimize
    ):
        raise ValueError(
            "If user_ids, include_bots, or minimize is set, "
            "aggregation_methods must also be set."
        )

    user_forecasts = Forecast.objects.filter(question__in=questions).order_by(
        "question_id", "start_time"
    )
    if user_ids:
        user_forecasts = user_forecasts.filter(user_id__in=user_ids)

    if not aggregation_methods:
        aggregate_forecasts: QuerySet[AggregateForecast] | list[AggregateForecast] = (
            AggregateForecast.objects.filter(question__in=questions)
        ).order_by("question_id", "start_time")
    else:
        aggregate_forecasts = []
        for question in questions:
            aggregation_dict = get_aggregation_history(
                question,
                aggregation_methods,
                user_ids=user_ids,
                minimize=minimize,
                include_stats=True,
                include_bots=(
                    include_bots
                    if include_bots is not None
                    else question.include_bots_in_aggregates
                ),
                histogram=True,
            )
            for values in aggregation_dict.values():
                aggregate_forecasts.extend(values)

    if include_comments:
        comments = Comment.objects.filter(
            on_post__in=questions.values_list("related_posts__post", flat=True)
        )
        comments = Comment.objects.filter(
            is_private=False,
            is_soft_deleted=False,
            on_post__in=questions.values_list("related_posts__post", flat=True),
        ).order_by("created_at")
    else:
        comments = None

    if include_scores:
        scores = Score.objects.filter(question__in=questions)
        archived_scores = ArchivedScore.objects.filter(question__in=questions)
        if user_ids:
            scores = scores.filter(Q(user_id__in=user_ids) | Q(user__isnull=True))
            archived_scores = archived_scores.filter(
                Q(user_id__in=user_ids) | Q(user__isnull=True)
            )
        all_scores = scores.union(archived_scores)
    else:
        all_scores = None

    return export_data_for_questions(
        questions=questions,
        user_forecasts=user_forecasts,
        aggregate_forecasts=aggregate_forecasts,
        comments=comments,
        scores=all_scores,
        anonymized=anonymized,
    )


def export_data_for_questions(
    questions: QuerySet[Question],
    user_forecasts: QuerySet[Forecast] | list[Forecast] | None = None,
    aggregate_forecasts: (
        QuerySet[AggregateForecast] | list[AggregateForecast] | None
    ) = None,
    comments: QuerySet[Comment] | list[Comment] | None = None,
    scores: QuerySet[Score | ArchivedScore] | list[Score | ArchivedScore] | None = None,
    anonymized: bool = False,
) -> bytes:
    # generate a zip file with up to 4 csv files:
    #     question_data - Always
    #     forecast_data - Always (populated by user_forecasts and aggregate_forecasts)
    #     comment_data - only if comments given
    #     score_data - only if scores given

    questions = questions.prefetch_related(
        "related_posts__post", "related_posts__post__default_project"
    )
    question_ids = questions.values_list("id", flat=True)
    if not question_ids:
        return

    # question_data csv file
    question_output = io.StringIO()
    question_writer = csv.writer(question_output)
    question_writer.writerow(
        [
            "Question ID",
            "Question URL",
            "Question Title",
            "Post ID",
            "Post Curation Status",
            "Post Published Time",
            "Default Project",
            "Default Project ID",
            "Label",
            "Question Type",
            "MC Options",
            "Scaling",
            "Open Time",
            "CP Reveal Time",
            "Scheduled Close Time",
            "Actual Close Time",
            "Resolution",
            "Resolution Known Time",
            "Include Bots in Aggregates",
        ]
    )
    for question in questions:
        post = question.related_posts.first().post
        question_writer.writerow(
            [
                question.id,
                "https://www.metaculus.com/questions/"
                + str(post.id)
                + "/"
                + str(post.url_title.lower().replace(" ", "-"))
                + "/",
                question.title,
                post.id,
                post.curation_status,
                post.published_at,
                post.default_project.name,
                post.default_project_id,
                question.label,
                question.type,
                question.options or None,
                (
                    {
                        "Range Min": question.range_min,
                        "Range Max": question.range_max,
                        "Zero Point": question.zero_point,
                        "Open Lower Bound": question.open_lower_bound,
                        "Open Upper Bound": question.open_upper_bound,
                    }
                    if question.range_min is not None
                    else None
                ),
                question.open_time,
                question.cp_reveal_time,
                question.scheduled_close_time,
                question.actual_close_time,
                question.resolution,
                question.actual_resolve_time,
                question.include_bots_in_aggregates,
            ]
        )

    # forecast_data csv file
    forecast_output = io.StringIO()
    forecast_writer = csv.writer(forecast_output)
    headers = ["Question ID"]
    if anonymized:
        headers.extend(["Forecaster (Anonymized)"])
    else:
        headers.extend(["Forecaster ID", "Forecaster Username"])
    headers.extend(
        [
            "Start Time",
            "End Time",
            "Forecaster Count",
            "Probability Yes",
            "Probability Yes Per Category",
            "Continuous CDF",
        ]
    )
    forecast_writer.writerow(headers)

    for forecast in user_forecasts or []:
        row = [forecast.question.id]
        if anonymized:
            row.append(hashlib.sha256(str(forecast.author_id).encode()).hexdigest())
        else:
            row.extend([forecast.author_id, forecast.author.username])
        row.extend(
            [
                forecast.start_time,
                forecast.end_time,
                None,
                forecast.probability_yes,
                forecast.probability_yes_per_category,
                forecast.continuous_cdf,
            ]
        )
        forecast_writer.writerow(row)
    for aggregate_forecast in aggregate_forecasts or []:
        match aggregate_forecast.question.type:
            case Question.QuestionType.BINARY:
                probability_yes = aggregate_forecast.forecast_values[1]
                probability_yes_per_category = None
                continuous_cdf = None
            case Question.QuestionType.MULTIPLE_CHOICE:
                probability_yes = None
                probability_yes_per_category = aggregate_forecast.forecast_values
                continuous_cdf = None
            case _:  # continuous
                probability_yes = None
                probability_yes_per_category = None
                continuous_cdf = aggregate_forecast.forecast_values
        row = [aggregate_forecast.question.id]
        if anonymized:
            row.append(aggregate_forecast.method)
        else:
            row.extend([None, aggregate_forecast.method])
        row.extend(
            [
                aggregate_forecast.start_time,
                aggregate_forecast.end_time,
                aggregate_forecast.forecaster_count,
                probability_yes,
                probability_yes_per_category,
                continuous_cdf,
            ]
        )
        forecast_writer.writerow(row)

    # comment_data csv file
    comment_output = io.StringIO()
    comment_writer = csv.writer(comment_output)
    comment_writer.writerow(
        [
            "Post ID",
            "Author ID",
            "Author Username",
            "Parent Comment ID",
            "Root Comment ID",
            "Created At",
            "Comment Text",
        ]
    )
    for comment in comments or []:
        comment_writer.writerow(
            [
                comment.on_post_id,
                comment.author_id,
                comment.author.username,
                comment.parent_id,
                comment.root_id,
                comment.created_at,
                comment.text,
            ]
        )

    # score_data csv file
    score_output = io.StringIO()
    score_writer = csv.writer(score_output)
    score_writer.writerow(
        [
            "Question ID",
            "User ID",
            "User Username",
            "Score Type",
            "Score",
            "Coverage",
        ]
    )
    for score in scores or []:
        score_writer.writerow(
            [
                score.question_id,
                score.user_id,
                score.user.username if score.user else score.aggregation_method,
                score.score_type,
                score.score,
                score.coverage,
            ]
        )

    # create a zip file with both csv files
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        zip_file.writestr("question_data.csv", question_output.getvalue())
        zip_file.writestr("forecast_data.csv", forecast_output.getvalue())
        if comments:
            zip_file.writestr("comment_data.csv", comment_output.getvalue())
        if scores:
            zip_file.writestr("score_data.csv", score_output.getvalue())

    # return the zip file
    return zip_buffer.getvalue()
