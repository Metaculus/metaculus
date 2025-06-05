import csv
import io
import zipfile
import hashlib
import datetime
import numpy as np

from django.db.models import QuerySet, Q

from comments.models import Comment
from questions.models import (
    Question,
    AggregateForecast,
    Forecast,
    QUESTION_CONTINUOUS_TYPES,
)
from questions.types import AggregationMethod
from scoring.models import Score, ArchivedScore
from users.models import User
from utils.the_math.aggregations import get_aggregation_history
from utils.the_math.measures import percent_point_function
from utils.the_math.formulas import (
    unscaled_location_to_scaled_location,
    string_location_to_bucket_index,
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
    # TODO: deprecate this - supersceded by export_data_for_questions

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

    return generate_data(
        questions=questions,
        user_forecasts=user_forecasts,
        aggregate_forecasts=aggregate_forecasts,
        comments=comments,
        scores=all_scores,
        anonymized=anonymized,
    )


def export_data_for_questions(
    user_id: int | None,
    is_staff: bool,
    is_whitelisted: bool,
    question_ids: list[int],
    aggregation_methods: list[AggregationMethod] | None,
    minimize: bool,
    include_scores: bool,
    include_user_data: bool,
    include_comments: bool,
    user_ids: list[int] | None,
    include_bots: bool | None,
    anonymized: bool,
    **kwargs,
) -> bytes:
    user = User.objects.get(id=user_id) if user_id is not None else None
    questions = Question.objects.filter(id__in=question_ids)
    if not include_user_data:
        user_forecasts = Forecast.objects.none()
    else:
        user_forecasts = Forecast.objects.filter(question__in=questions).order_by(
            "question_id", "start_time"
        )
    if user_ids:
        user_forecasts = user_forecasts.filter(author_id__in=user_ids)
    if not (is_whitelisted or is_staff):
        user_forecasts = user_forecasts.filter(author=user)

    if not aggregation_methods or (
        aggregation_methods == [AggregationMethod.RECENCY_WEIGHTED] and minimize is True
    ):
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

    if include_user_data and include_comments:
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
        if not include_user_data:
            # don't include user-specific scores
            scores = scores.filter(user__isnull=True)
            archived_scores = archived_scores.filter(user__isnull=True)
        elif user_ids:
            # only include user-specific scores for the given user_ids
            scores = scores.filter(Q(user_id__in=user_ids) | Q(user__isnull=True))
            archived_scores = archived_scores.filter(
                Q(user_id__in=user_ids) | Q(user__isnull=True)
            )
        elif not (is_whitelisted or is_staff):
            # only include user-specific scores for the logged-in user
            scores = scores.filter(
                Q(user__isnull=True) | (Q(user=user) if user else Q())
            )
            archived_scores = archived_scores.filter(
                Q(user__isnull=True) | (Q(user=user) if user else Q())
            )
        all_scores = scores.union(archived_scores)
    else:
        all_scores = None

    return generate_data(
        questions=questions,
        user_forecasts=user_forecasts,
        aggregate_forecasts=aggregate_forecasts,
        comments=comments,
        scores=all_scores,
        anonymized=anonymized,
    )


def generate_data(
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
    username_dict = dict(User.objects.values_list("id", "username"))
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
            "Lower Bound",
            "Open Lower Bound",
            "Upper Bound",
            "Open Upper Bound",
            "Continuous Range",
            "Open Time",
            "CP Reveal Time",
            "Scheduled Close Time",
            "Actual Close Time",
            "Resolution",
            "Resolution Known Time",
            "Include Bots in Aggregates",
            "Question Weight",
        ]
    )
    for question in questions:
        post = question.related_posts.first().post

        def format_value(val):
            if val is None or question.type != Question.QuestionType.DATE:
                return val
            return datetime.datetime.fromtimestamp(val, datetime.timezone.utc).strftime(
                "%Y-%m-%d"
            )

        continuous_range = None
        if question.type in QUESTION_CONTINUOUS_TYPES:
            # locations where CDF is evaluated
            continuous_range = []
            for x in np.linspace(0, 1, 201):
                val = unscaled_location_to_scaled_location(x, question)
                continuous_range.append(format_value(val))
        question_writer.writerow(
            [
                question.id,
                "https://www.metaculus.com/questions/"
                + str(post.id)
                + "/"
                + str(post.short_title.lower().replace(" ", "-"))
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
                format_value(question.range_min),
                question.open_lower_bound,
                format_value(question.range_max),
                question.open_upper_bound,
                continuous_range,
                question.open_time,
                question.cp_reveal_time,
                question.scheduled_close_time,
                question.actual_close_time,
                question.resolution,
                question.actual_resolve_time,
                question.include_bots_in_aggregates,
                question.question_weight,
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
            "Probability Below Lower Bound",
            "Probability Above Upper Bound",
            "5th Percentile",
            "25th Percentile",
            "Median",
            "75th Percentile",
            "95th Percentile",
            "Probability of Resolution",
            "PDF at Resolution",
        ]
    )
    forecast_writer.writerow(headers)
    for forecast in user_forecasts or []:
        row = [forecast.question_id]
        if anonymized:
            row.append(hashlib.sha256(str(forecast.author_id).encode()).hexdigest())
        else:
            row.extend([forecast.author_id, username_dict[forecast.author_id]])
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
        if forecast.question.type not in QUESTION_CONTINUOUS_TYPES:
            row.extend([None] * 7)
        else:
            cdf = forecast.continuous_cdf
            continuous_columns = []
            continuous_columns.append(round(cdf[0], 10))
            continuous_columns.append(round(1 - cdf[-1], 10))
            percentiles = percent_point_function(cdf, [5, 25, 50, 75, 95])
            for p in percentiles:
                scaled_location = unscaled_location_to_scaled_location(
                    p, forecast.question
                )
                if forecast.question.type == Question.QuestionType.DATE:
                    scaled_location = datetime.datetime.fromtimestamp(
                        scaled_location, datetime.timezone.utc
                    ).strftime("%Y-%m-%d")
                continuous_columns.append(scaled_location)
            row.extend(continuous_columns)
        resolution_index = string_location_to_bucket_index(
            forecast.question.resolution, forecast.question
        )
        if resolution_index is None:
            row.append(None)
        else:
            pmf = forecast.get_pmf()
            forecast_at_resolution = pmf[resolution_index]
            row.append(forecast_at_resolution)
            if forecast.question.type in QUESTION_CONTINUOUS_TYPES:
                # Also append PDF value
                row.append(forecast_at_resolution * (len(pmf) - 2))
            else:
                row.append(None)

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
        row = [aggregate_forecast.question_id]
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
        if aggregate_forecast.question.type not in QUESTION_CONTINUOUS_TYPES:
            row.extend([None] * 7)
        else:
            cdf = continuous_cdf
            continuous_columns = []
            continuous_columns.append(round(cdf[0], 10))
            continuous_columns.append(round(1 - cdf[-1], 10))
            percentiles = percent_point_function(cdf, [5, 25, 50, 75, 95])
            for p in percentiles:
                scaled_location = unscaled_location_to_scaled_location(
                    p, aggregate_forecast.question
                )
                if aggregate_forecast.question.type == Question.QuestionType.DATE:
                    scaled_location = datetime.datetime.fromtimestamp(
                        val, datetime.timezone.utc
                    ).strftime("%Y-%m-%d")
                continuous_columns.append(scaled_location)
            row.extend(continuous_columns)

        resolution_index = string_location_to_bucket_index(
            aggregate_forecast.question.resolution, aggregate_forecast.question
        )
        if resolution_index is None:
            row.append(None)
        else:
            pmf = aggregate_forecast.get_pmf()
            forecast_at_resolution = pmf[resolution_index]
            row.append(forecast_at_resolution)
            if aggregate_forecast.question.type in QUESTION_CONTINUOUS_TYPES:
                # Also append PDF value
                row.append(forecast_at_resolution * (len(pmf) - 2))
            else:
                row.append(None)
        forecast_writer.writerow(row)

    # comment_data csv file
    comment_output = io.StringIO()
    comment_writer = csv.writer(comment_output)
    headers = ["Post ID"]
    if anonymized:
        headers.extend(["Author (Anonymized)"])
    else:
        headers.extend(["Author ID", "Author Username"])
    headers.extend(
        [
            "Parent Comment ID",
            "Root Comment ID",
            "Created At",
            "Comment Text",
        ]
    )
    comment_writer.writerow(headers)
    for comment in comments or []:
        row = [comment.on_post_id]
        if anonymized:
            row.append(hashlib.sha256(str(forecast.author_id).encode()).hexdigest())
        else:
            row.extend([forecast.author_id, username_dict[forecast.author_id]])
        row.extend(
            [
                comment.parent_id,
                comment.root_id,
                comment.created_at,
                comment.text,
            ]
        )
        comment_writer.writerow(row)

    # score_data csv file
    score_output = io.StringIO()
    score_writer = csv.writer(score_output)
    headers = ["Question ID"]
    if anonymized:
        headers.extend(["User (Anonymized)"])
    else:
        headers.extend(["User ID", "User Username"])
    headers.extend(
        [
            "Score Type",
            "Score",
            "Coverage",
        ]
    )
    score_writer.writerow(headers)
    for score in scores or []:
        row = [score.question_id]
        if anonymized:
            row.append(
                hashlib.sha256(str(score.user_id).encode()).hexdigest()
                if score.user_id
                else score.aggregation_method
            )
        else:
            row.extend(
                [
                    score.user_id,
                    (
                        username_dict[score.user_id]
                        if score.user_id
                        else score.aggregation_method
                    ),
                ]
            )
        row.extend(
            [
                score.score_type,
                score.score,
                score.coverage,
            ]
        )
        score_writer.writerow(row)

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
