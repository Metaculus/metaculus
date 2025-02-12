import csv
import io
import zipfile

from django.db.models import QuerySet, Q

from comments.models import Comment
from questions.models import Question, AggregateForecast, Forecast
from scoring.models import Score, ArchivedScore


def export_data_for_questions(
    questions: QuerySet[Question],
    include_user_forecasts: bool = False,
    include_comments: bool = False,
    include_scores: bool = False,
    user_ids: list[int] | None = None,
    aggregation_dict: dict[Question, dict[str, list[AggregateForecast]]] | None = None,
) -> bytes:
    # generate a zip file with up to 4 csv files:
    #     question_data
    #     forecast_data
    #     comment_data
    #     score_data
    # If user_ids is give, aggregation_dict must also be provided as this method does
    #     not recalculate aggregations
    if user_ids and not aggregation_dict:
        raise ValueError(
            "If user_ids are provided, aggregation_dict must be "
            "generated before this method"
        )

    questions = questions.prefetch_related(
        "related_posts__post", "related_posts__post__default_project"
    )
    post_ids = questions.values_list("related_posts__post__id", flat=True)
    question_ids = questions.values_list("id", flat=True)
    if not question_ids:
        return

    forecasts = (
        Forecast.objects.none()
        if not include_user_forecasts
        else (
            Forecast.objects.filter(question_id__in=question_ids)
            .select_related("question", "author")
            .order_by("question_id", "start_time")
        )
    )
    if user_ids:
        forecasts = forecasts.filter(author_id__in=user_ids)

    aggregate_forecasts = []
    if aggregation_dict is not None:
        for ad in aggregation_dict.values():
            for afs in ad.values():
                aggregate_forecasts.extend(afs)

    comments = (
        Comment.objects.none()
        if not include_comments
        else (
            Comment.objects.filter(
                on_post_id__in=post_ids,
                is_private=False,
                is_soft_deleted=False,
            )
            .prefetch_related("author")
            .distinct()
        ).order_by("on_post_id", "created_at")
    )

    scores = (
        Score.objects.none()
        if not include_scores
        else (Score.objects.filter(question_id__in=question_ids))
    )
    archived_scores = (
        ArchivedScore.objects.none()
        if not include_scores
        else (ArchivedScore.objects.filter(question_id__in=question_ids))
    )
    if user_ids:
        scores = scores.filter(Q(user_id__in=user_ids) | Q(user__isnull=True))
        archived_scores = archived_scores.filter(
            Q(user_id__in=user_ids) | Q(user__isnull=True)
        )
    all_scores = scores.union(archived_scores)

    # question_data csv file
    question_output = io.StringIO()
    question_writer = csv.writer(question_output)
    question_writer.writerow(
        [
            "Question ID",
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
    forecast_writer.writerow(
        [
            "Question ID",
            "Forecaster ID",
            "Forecaster Username",
            "Start Time",
            "End Time",
            "Forecaster Count",
            "Probability Yes",
            "Probability Yes Per Category",
            "Continuous CDF",
        ]
    )
    for forecast in forecasts:
        forecast_writer.writerow(
            [
                forecast.question.id,
                forecast.author_id,
                forecast.author.username,
                forecast.start_time,
                forecast.end_time,
                None,
                forecast.probability_yes,
                forecast.probability_yes_per_category,
                forecast.continuous_cdf,
            ]
        )
    for aggregate_forecast in aggregate_forecasts:
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
        forecast_writer.writerow(
            [
                aggregate_forecast.question.id,
                None,
                aggregate_forecast.method,
                aggregate_forecast.start_time,
                aggregate_forecast.end_time,
                aggregate_forecast.forecaster_count,
                probability_yes,
                probability_yes_per_category,
                continuous_cdf,
            ]
        )

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
    for comment in comments:
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
    for score in all_scores:
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
        if include_comments:
            zip_file.writestr("comment_data.csv", comment_output.getvalue())
        if include_scores:
            zip_file.writestr("score_data.csv", score_output.getvalue())

    # return the zip file
    return zip_buffer.getvalue()
