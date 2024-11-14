import csv
import re
from io import StringIO
import numpy as np
import io
import zipfile

from django.db.models import QuerySet

from questions.models import Question, AggregateForecast, Forecast
from comments.models import Comment
from utils.the_math.formulas import unscaled_location_to_string_location


def export_data_for_questions(questions: QuerySet[Question]):
    # generate a zip file with three csv files: question_data, forecast_data,
    # and comment_data

    questions = questions.prefetch_related(
        "related_posts__post", "related_posts__post__default_project"
    )
    post_ids = questions.values_list("related_posts__post__id", flat=True)
    question_ids = questions.values_list("id", flat=True)
    if not question_ids:
        return

    forecasts = (
        Forecast.objects.filter(question_id__in=question_ids)
        .select_related("question", "author")
        .order_by("question_id", "start_time")
    )
    aggregate_forecasts = (
        AggregateForecast.objects.filter(question_id__in=question_ids)
        .select_related("question")
        .order_by("question_id", "start_time")
    )

    comments = (
        Comment.objects.filter(on_post_id__in=post_ids)
        .prefetch_related("author")
        .distinct()
    ).order_by("on_post_id", "created_at")

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

    # create a zip file with both csv files
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        zip_file.writestr("question_data.csv", question_output.getvalue())
        zip_file.writestr("forecast_data.csv", forecast_output.getvalue())
        zip_file.writestr("comment_data.csv", comment_output.getvalue())

    # return the zip file
    return zip_buffer.getvalue()


def _get_row_headers(question: Question) -> list[str]:
    row_headers = [
        "question",
        "forecaster",
        "prediction_start_time",
        "prediction_end_time",
    ]
    match question.type:
        case "binary":
            row_headers.append("prediction")
            row_headers.append("aggregate_q1")
            row_headers.append("aggregate_q3")
        case "multiple_choice":
            options = question.options  # type: ignore
            stripped_labels = [re.sub(r"[\s-]+", "_", o) for o in options]
            option_labels = ["prediction_" + label for label in stripped_labels]
            row_headers.extend(option_labels)
            q1_labels = ["aggregate_q1_" + label for label in stripped_labels]
            row_headers.extend(q1_labels)
            q3_labels = ["aggregate_q3_" + label for label in stripped_labels]
            row_headers.extend(q3_labels)
        case _:
            row_headers.extend(
                [
                    "q1",
                    "median",
                    "q3",
                    "q1_unformatted",
                    "median_unformatted",
                    "q3_unformatted",
                    "probability_mass_below_lower_bound",
                    "probability_mass_above_upper_bound",
                ]
            )
            cdf_headers = [
                "cdf_at_" + str(round(loc, 3)) for loc in np.linspace(0, 1, 201)
            ]
            row_headers.extend(cdf_headers)
    return row_headers


def build_csv(
    aggregation_dict: dict[Question, dict[str, list[AggregateForecast | Forecast]]],
) -> str:
    if not aggregation_dict:
        return ""
    output = StringIO()
    writer = csv.writer(output)
    question = list(aggregation_dict.keys())[0]
    writer.writerow(_get_row_headers(question))

    for question, aggregations in aggregation_dict.items():
        for method, forecasts in aggregations.items():
            for forecast in forecasts:
                new_row = [
                    question.title,
                    method,
                    forecast.start_time,
                    forecast.end_time,
                ]
                match question.type:
                    case "binary":
                        new_row.extend(
                            [
                                np.round(forecast.get_prediction_values()[1], 7),
                                np.round(forecast.interval_lower_bounds[1], 7),
                                np.round(forecast.interval_upper_bounds[1], 7),
                            ]
                        )
                    case "multiple_choice":
                        new_row.extend(np.round(forecast.get_prediction_values(), 7))
                        new_row.extend(np.round(forecast.interval_lower_bounds, 7))
                        new_row.extend(np.round(forecast.interval_upper_bounds, 7))
                    case _:
                        q1 = forecast.interval_lower_bounds[0]
                        median = forecast.centers[0]
                        q3 = forecast.interval_upper_bounds[0]
                        cdf = forecast.forecast_values
                        new_row.extend(
                            [
                                unscaled_location_to_string_location(q1, question),
                                unscaled_location_to_string_location(median, question),
                                unscaled_location_to_string_location(q3, question),
                                np.round(q1, 7),
                                np.round(median, 7),
                                np.round(q3, 7),
                                np.round(cdf[0], 7),
                                np.round(1 - cdf[-1], 7),
                            ]
                        )
                        new_row.extend(np.round(cdf, 7))
                writer.writerow(new_row)

    output.seek(0)
    return output.getvalue()
