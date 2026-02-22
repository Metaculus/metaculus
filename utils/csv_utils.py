import csv
import datetime
import hashlib
import io
import zipfile

import numpy as np
from django.db.models import QuerySet, Q
from django.utils import timezone

from coherence.models import AggregateCoherenceLink
from comments.models import Comment, KeyFactor
from posts.models import Post
from questions.models import (
    Question,
    AggregateForecast,
    Forecast,
    QUESTION_CONTINUOUS_TYPES,
)
from questions.services.multiple_choice_handlers import get_all_options_from_history
from questions.types import AggregationMethod
from scoring.models import Score, ArchivedScore
from users.models import User
from utils.the_math.aggregations import get_aggregation_history
from utils.the_math.formulas import (
    unscaled_location_to_scaled_location,
    string_location_to_bucket_index,
)
from utils.the_math.measures import percent_point_function


def export_all_data_for_questions(
    questions: QuerySet[Question],
    aggregation_methods: list[AggregationMethod] | None = None,
    only_include_user_ids: list[int] | None = None,
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
        (only_include_user_ids is not None) or include_bots or not minimize
    ):
        raise ValueError(
            "If user_ids, include_bots, or minimize is set, "
            "aggregation_methods must also be set."
        )

    user_forecasts = Forecast.objects.filter(question__in=questions).order_by(
        "question_id", "start_time"
    )
    if only_include_user_ids:
        user_forecasts = user_forecasts.filter(user_id__in=only_include_user_ids)

    if not aggregation_methods:
        aggregate_forecasts = AggregateForecast.objects.filter(
            start_time__lte=timezone.now(), question__in=questions
        ).order_by("question_id", "start_time")
    else:
        aggregate_forecasts = []
        for question in questions:
            aggregation_dict = get_aggregation_history(
                question,
                aggregation_methods or [question.default_aggregation_method],
                only_include_user_ids=only_include_user_ids,
                minimize=minimize,
                include_stats=True,
                include_bots=(
                    include_bots
                    if include_bots is not None
                    else question.include_bots_in_aggregates
                ),
                histogram=True,
                include_future=False,
            )
            for values in aggregation_dict.values():
                aggregate_forecasts.extend(values)

    if include_comments:
        comments = Comment.objects.filter(
            is_private=False,
            is_soft_deleted=False,
            on_post__in=questions.values_list("post", flat=True),
        ).order_by("created_at")
    else:
        comments = None

    if include_scores:
        scores = Score.objects.filter(question__in=questions)
        archived_scores = ArchivedScore.objects.filter(question__in=questions)
        if only_include_user_ids:
            scores = scores.filter(
                Q(user_id__in=only_include_user_ids) | Q(user__isnull=True)
            )
            archived_scores = archived_scores.filter(
                Q(user_id__in=only_include_user_ids) | Q(user__isnull=True)
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
    include_key_factors: bool,
    only_include_user_ids: list[int] | None,
    include_bots: bool | None,
    joined_before_date: datetime.datetime | None = None,
    anonymized: bool = False,
    include_future: bool = False,
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
    if only_include_user_ids:
        user_forecasts = user_forecasts.filter(author_id__in=only_include_user_ids)
    if not (is_whitelisted or is_staff):
        user_forecasts = user_forecasts.filter(author=user)

    if is_whitelisted or is_staff:
        questions_with_revealed_cp = questions
    else:
        questions_with_revealed_cp = questions.filter(
            Q(resolution__isnull=False)
            | Q(cp_reveal_time__isnull=True)
            | Q(cp_reveal_time__lte=timezone.now())
        )
    if (
        not only_include_user_ids
        and not joined_before_date
        and (
            not aggregation_methods
            or (
                aggregation_methods == [AggregationMethod.RECENCY_WEIGHTED]
                and minimize is True
            )
        )
    ):
        aggregate_forecasts: list[AggregateForecast] = list(
            AggregateForecast.objects.filter(
                Q() if include_future else Q(start_time__lte=timezone.now()),
                question__in=questions_with_revealed_cp,
            ).order_by("question_id", "start_time")
        )
        if not include_future:
            # remove end_time from any live aggregate forecasts
            for aggregate_forecast in aggregate_forecasts:
                if (
                    aggregate_forecast.end_time
                    and aggregate_forecast.end_time > timezone.now()
                ):
                    aggregate_forecast.end_time = None
    else:
        aggregate_forecasts = []
        for question in questions_with_revealed_cp:
            aggregation_dict = get_aggregation_history(
                question,
                aggregation_methods or [question.default_aggregation_method],
                only_include_user_ids=only_include_user_ids,
                minimize=minimize,
                include_stats=True,
                include_bots=(
                    include_bots
                    if include_bots is not None
                    else question.include_bots_in_aggregates
                ),
                histogram=True,
                include_future=include_future,
                joined_before=joined_before_date,
            )
            for values in aggregation_dict.values():
                aggregate_forecasts.extend(values)

    if include_user_data and include_comments:
        comments = Comment.objects.filter(
            is_private=False,
            is_soft_deleted=False,
            on_post__in=questions.values_list("post", flat=True),
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
        elif only_include_user_ids:
            # only include user-specific scores for the given user_ids
            scores = scores.filter(
                Q(user_id__in=only_include_user_ids) | Q(user__isnull=True)
            )
            archived_scores = archived_scores.filter(
                Q(user_id__in=only_include_user_ids) | Q(user__isnull=True)
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

    if include_key_factors and question_ids:
        key_factors = (
            KeyFactor.objects.filter_active()
            .filter(
                comment__on_post__questions__id__in=question_ids,
                comment__is_soft_deleted=False,
            )
            .select_related(
                "driver",
                "base_rate",
                "news",
                "comment",
                "comment__author",
                "question",
            )
            .order_by("created_at")
        )
        aggregate_question_links = AggregateCoherenceLink.objects.filter(
            Q(question1_id__in=question_ids) | Q(question2_id__in=question_ids)
        ).select_related("question1__post", "question2__post")
    else:
        key_factors = None
        aggregate_question_links = None

    return generate_data(
        questions=questions,
        user_forecasts=user_forecasts,
        aggregate_forecasts=aggregate_forecasts,
        comments=comments,
        scores=all_scores,
        key_factors=key_factors,
        aggregate_question_links=aggregate_question_links,
        anonymized=anonymized,
    )


def export_data_for_user(user=User):
    forecasts = Forecast.objects.filter(author=user).select_related("question")
    questions = Question.objects.filter(user_forecasts__in=forecasts).distinct()
    authored_posts = Post.objects.filter(Q(author=user) | Q(coauthors=user)).distinct()
    authored_questions = Question.objects.filter(post__in=authored_posts).distinct()
    comments = Comment.objects.filter(author=user)
    scores = Score.objects.filter(user=user)

    return generate_data(
        questions=Question.objects.filter(
            id__in=questions.union(authored_questions).values_list("id")
        ),
        user_forecasts=forecasts,
        comments=comments,
        scores=scores,
    )


def generate_data(
    questions: QuerySet[Question],
    user_forecasts: QuerySet[Forecast] | list[Forecast] | None = None,
    aggregate_forecasts: (
        QuerySet[AggregateForecast] | list[AggregateForecast] | None
    ) = None,
    comments: QuerySet[Comment] | list[Comment] | None = None,
    scores: QuerySet[Score | ArchivedScore] | list[Score | ArchivedScore] | None = None,
    key_factors: QuerySet[KeyFactor] | list[KeyFactor] | None = None,
    aggregate_question_links: (
        QuerySet[AggregateCoherenceLink] | list[AggregateCoherenceLink] | None
    ) = None,
    anonymized: bool = False,
) -> bytes:
    # generate a zip file with up to 6 csv files:
    #     question_data - Always
    #     forecast_data - Always (populated by user_forecasts and aggregate_forecasts)
    #     comment_data - Only if comments given
    #     score_data - Only if scores given
    #     key_factor_data - Only if key_factors given
    #     question_link_data - Only if aggregate_question_links given
    #     README.md - Always
    username_dict = dict(User.objects.values_list("id", "username"))
    is_bot_dict = dict(User.objects.values_list("id", "is_bot"))
    questions = questions.select_related("post", "post__default_project")
    question_ids = questions.values_list("id", flat=True)
    if not question_ids:
        return
    # README md file
    readme_output = io.StringIO()
    readme_output.write(
        "This README file describes how to interpret the data in this zip file.\n"
        + "If you have any questions or comments, please contact the Metaculus team: support@metaculus.com.\n"
        + "\n"
        + "Metadata:\n"
        + f"This data was exported on {timezone.now()}\n"
        + f"Contains the data for {len(questions)} questions\n"
    )
    if user_forecasts:
        readme_output.write(
            f"Contains the data for {len(user_forecasts)} user forecasts\n"
        )
    if aggregate_forecasts:
        readme_output.write(
            f"Contains the data for {len(aggregate_forecasts)} aggregate forecasts\n"
        )
    if comments:
        readme_output.write(f"Contains the data for {len(comments)} comments\n")
    if scores:
        readme_output.write(f"Contains the data for {len(scores)} scores\n")
    if key_factors:
        readme_output.write(f"Contains the data for {len(key_factors)} key factors\n")
    if aggregate_question_links:
        readme_output.write(
            f"Contains the data for {len(aggregate_question_links)} question links\n"
        )
    if anonymized:
        readme_output.write("User IDs have been obscured\n")
    readme_output.write("\n" + "\n" + "# File: README.md\n" + "\n" + "This File\n")
    # question_data csv file
    readme_output.write(
        "\n"
        + "\n"
        + "# File: `question_data.csv`\n"
        + "\n"
        + "This file contains summary data of the questions specific to this dataset\n"
        + "\n"
        + "### columns:\n"
        + "\n"
        + "**`Question ID`** - the id of the question. This is not the value in the URL.\n"
        + "**`Question URL`** - the URL of the question.\n"
        + "**`Question Title`** - the title of the question.\n"
        + "**`Post ID`** - the id of the Post that this question is part of. This is the value in the URL.\n"
        + "**`Post Curation Status`** - the curation status of the Post.\n"
        + "**`Post Published Time`** - the time the Post was published.\n"
        + "**`Default Project`** - the name of the default project (usually a tournament or community) for the Post.\n"
        + "**`Default Project ID`** - the id of the default project for the Post.\n"
        + "**`Categories`** - a list of category names that this question belongs to.\n"
        + "**`Leaderboard Tags`** - a list of leaderboard tag names associated with this question.\n"
        + "**`Label`** - for a group question, this is the sub-question object.\n"
        + "**`Question Type`** - the type of the question. Binary, Multiple Choice, Numeric, Discrete, or Date.\n"
        + "**`MC Options (Current)`** - the current options for a multiple choice question, if applicable.\n"
        + "**`MC Options (All)`** - the options for a multiple choice question across all time, if applicable.\n"
        + "**`MC Options History`** - the history of options over time. Each entry is a isoformat time and a record of what the options were at that time.\n"
        + "**`Lower Bound`** - the lower bound of the forecasting range for a continuous question.\n"
        + "**`Open Lower Bound`** - whether the lower bound is open.\n"
        + "**`Upper Bound`** - the upper bound of the forecasting range for a continuous question.\n"
        + "**`Open Upper Bound`** - whether the upper bound is open.\n"
        + "**`Continuous Range`** - the locations where the CDF is evaluated for a continuous question.\n"
        + "**`Open Time`** - the time when the question was opened for forecasting.\n"
        + "**`CP Reveal Time`** - the time when the community prediction is revealed.\n"
        + "**`Scheduled Close Time`** - the time when forecasting ends.\n"
        + "**`Actual Close Time`** - the earlier of the scheduled close time and the time when the resolution became known.\n"
        + "**`Resolution`** - the resolution for the question.\n"
        + "**`Resolution Known Time`** - the time when the resolution became known.\n"
        + "**`Include Bots in Aggregates`** - whether bots are included in the aggregations by default.\n"
        + "**`Question Weight`** - the weight of the question in the leaderboard.\n"
    )
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
            "Categories",
            "Leaderboard Tags",
            "Label",
            "Question Type",
            "MC Options (Current)",
            "MC Options (All)",
            "MC Options History",
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
        post = question.post

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

        # Get categories and leaderboard tags
        categories = list(
            post.projects.filter(type="category").values_list("name", flat=True)
        )
        leaderboard_tags = list(
            post.projects.filter(type="leaderboard_tag").values_list("name", flat=True)
        )

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
                categories,
                leaderboard_tags,
                question.label,
                question.type,
                question.options,
                (
                    get_all_options_from_history(question.options_history)
                    if question.options_history
                    else None
                ),
                question.options_history or None,
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
    readme_output.write(
        "\n"
        + "\n"
        + "# File: `forecast_data.csv`\n"
        + "\n"
        + "This file contains the user and aggregation forecast data for the questions in this dataset.\n"
        + "\n"
        + "### columns:\n"
        + "\n"
        + "**`Question ID`** - the id of the question this forecast is for. Cross-reference with 'Question ID' in `question_data.csv`.\n"
        + (
            "**`Forecaster (Anonymized)`** - the anonymized reference to the forecaster.\n"
            if anonymized
            else (
                "**`Forecaster ID`** - the id of the forecaster.\n"
                + "**`Forecaster Username`** - the username of the forecaster or the aggregation method.\n"
            )
        )
        + "**`Is Bot`** - if user is bot.\n"
        + "**`Start Time`** - the time when the forecast was made.\n"
        + "**`End Time`** - the time when the forecast ends. If not populated, the forecast is still active. Note that this can be set in the future indicating an expiring forecast.\n"
        + "**`Forecaster Count`** - if this is an aggregate forecast, how many forecasts contribute to it.\n"
        + "**`Probability Yes`** - the probability of the binary question resolving to 'Yes'\n"
        + "**`Probability Yes Per Category`** - a list of probabilities corresponding to each option for a multiple choice question. Cross-reference 'MC Options (All)' in `question_data.csv`. Note that a Multiple Choice forecast will have None in places where the corresponding option wasn't available for forecast at the time. Note: geometric_means always display values here in pmf form.\n"
        + "**`Continuous CDF`** - the value of the CDF (cumulative distribution function) at each of the locations in the continuous range for a continuous question. Cross-reference 'Continuous Range' in `question_data.csv`.\n"
        + "**`Probability Below Lower Bound`** - the probability of the question resolving below the lower bound for a continuous question.\n"
        + "**`Probability Above Upper Bound`** - the probability of the question resolving above the upper bound for a continuous question.\n"
        + "**`5th Percentile`** - the 5th percentile of forecast for a continuous question.\n"
        + "**`25th Percentile`** - the 25th percentile of forecast for a continuous question.\n"
        + "**`Median`** - the median of forecast for a continuous question.\n"
        + "**`75th Percentile`** - the 75th percentile of forecast for a continuous question.\n"
        + "**`95th Percentile`** - the 95th percentile of forecast for a continuous question.\n"
        + "**`Probability of Resolution`** - the actual probability assigned to the Resolution of the question, if resolved. This is the value used in scoring. Cross reference 'Resolution' in `question_data.csv`.\n"
        + "**`PDF at Resolution`** - the height of the PDF (probability density function) value at the resolution for a continuous question. This is the value that will show on the continuous range in the prediction interface.\n"
    )
    forecast_output = io.StringIO()
    forecast_writer = csv.writer(forecast_output)
    headers = ["Question ID"]
    if anonymized:
        headers.extend(["Forecaster (Anonymized)"])
    else:
        headers.extend(["Forecaster ID", "Forecaster Username"])
    headers.extend(
        [
            "Is Bot",
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
                is_bot_dict.get(forecast.author_id),
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
            forecast_at_resolution = (
                pmf[resolution_index]
                if not np.isnan(pmf[resolution_index])
                else pmf[-1]
            )
            row.append(forecast_at_resolution)
            if forecast.question.type in QUESTION_CONTINUOUS_TYPES:
                # Also append PDF value
                row.append(forecast_at_resolution * (len(pmf) - 2))
            else:
                row.append(None)

        forecast_writer.writerow(row)
    for aggregate_forecast in aggregate_forecasts or []:
        if aggregate_forecast.method == "geometric_mean":
            probability_yes = None
            probability_yes_per_category = aggregate_forecast.forecast_values
            continuous_cdf = None
        elif aggregate_forecast.question.type == Question.QuestionType.BINARY:
            probability_yes = aggregate_forecast.forecast_values[1]
            probability_yes_per_category = None
            continuous_cdf = None
        elif aggregate_forecast.question.type == Question.QuestionType.MULTIPLE_CHOICE:
            probability_yes = None
            probability_yes_per_category = aggregate_forecast.forecast_values
            continuous_cdf = None
        else:  # continuous
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
                None,
                aggregate_forecast.start_time,
                aggregate_forecast.end_time,
                aggregate_forecast.forecaster_count,
                probability_yes,
                probability_yes_per_category,
                continuous_cdf,
            ]
        )
        if not continuous_cdf:
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
                        scaled_location, datetime.timezone.utc
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
            forecast_at_resolution = (
                pmf[resolution_index]
                if not np.isnan(pmf[resolution_index])
                else pmf[-1]
            )
            row.append(forecast_at_resolution)
            if aggregate_forecast.question.type in QUESTION_CONTINUOUS_TYPES:
                # Also append PDF value
                row.append(forecast_at_resolution * (len(pmf) - 2))
            else:
                row.append(None)
        forecast_writer.writerow(row)

    # comment_data csv file
    if comments is not None:
        readme_output.write(
            "\n"
            + "\n"
            + "# File: `comment_data.csv`\n"
            + "\n"
            + "This file contains the comments made on the questions in this dataset.\n"
            + "\n"
            + "### columns:\n"
            + "\n"
            + "**`Post ID`** - the id of the Post that this comment is on. Cross-reference with 'Post ID' in `question_data.csv`.\n"
            + (
                "**`Author (Anonymized)`** - the anonymized reference to the author of the comment.\n"
                if anonymized
                else (
                    "**`Author ID`** - the id of the author of the comment.\n"
                    + "**`Author Username`** - the username of the author of the comment.\n"
                )
            )
            + "**`Parent Comment ID`** - the id of the comment this is a reply to, if any.\n"
            + "**`Root Comment ID`** - the id of the top-level comment in a thread.\n"
            + "**`Created At`** - the time when the comment was created.\n"
            + "**`Comment Text`** - the text of the comment. May contain commas and special characters that don't display well in all CSV interpreters.\n"
        )
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
            row.append(hashlib.sha256(str(comment.author_id).encode()).hexdigest())
        else:
            row.extend([comment.author_id, username_dict[comment.author_id]])
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
    if scores is not None:
        readme_output.write(
            "\n"
            + "\n"
            + "# File: `score_data.csv`\n"
            + "\n"
            + "This file contains the scores for the questions in this dataset.\n"
            + "\n"
            + "### columns:\n"
            + "\n"
            + "**`Question ID`** - the id of the question this score is for. Cross-reference with 'Question ID' in `question_data.csv`.\n"
            + (
                "**`User (Anonymized)`** - the anonymized reference to the user this score is for.\n"
                if anonymized
                else (
                    "**`User ID`** - the id of the user this score is for.\n"
                    + "**`User Username`** - the username of the user this score is for.\n"
                )
            )
            + "**`Score Type`** - the type of score. E.g. 'Peer', 'Baseline', etc.\n"
            + "**`Score`** - the value of the score.\n"
            + "**`Coverage`** - the coverage of the score, if applicable.\n"
        )
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

    # key_factor_data csv file
    if key_factors is not None:
        readme_output.write(
            "\n"
            + "\n"
            + "# File: `key_factor_data.csv`\n"
            + "\n"
            + "This file contains the key factors for the questions in this dataset.\n"
            + "\n"
            + "### columns:\n"
            + "\n"
            + "**`Key Factor ID`** - the id of the key factor.\n"
            + "**`Comment ID`** - the id of the comment this key factor is attached to.\n"
            + "**`Post ID`** - the id of the Post this key factor belongs to.\n"
            + "**`Question ID`** - the id of the question this key factor is linked to (if specific to a sub-question).\n"
            + "**`Question Option`** - the multiple choice option this key factor is linked to (if applicable).\n"
            + "**`Type`** - the type of key factor: 'driver', 'base_rate', or 'news'.\n"
            + "**`Created At`** - the time when the key factor was created.\n"
            + "**`Votes Score`** - the aggregate vote score for this key factor.\n"
            + (
                "**`Author (Anonymized)`** - the anonymized reference to the author.\n"
                if anonymized
                else (
                    "**`Author ID`** - the id of the author who created this key factor.\n"
                    + "**`Author Username`** - the username of the author.\n"
                )
            )
            + "**`Driver Text`** - the text of the driver (if type is 'driver').\n"
            + "**`Driver Impact Direction`** - impact direction: 1 for increase, -1 for decrease (if type is 'driver').\n"
            + "**`Driver Certainty`** - certainty level of the driver (if type is 'driver').\n"
            + "**`Base Rate Reference Class`** - the reference class for base rate (if type is 'base_rate').\n"
            + "**`Base Rate Type`** - 'frequency' or 'trend' (if type is 'base_rate').\n"
            + "**`Base Rate Rate Numerator`** - numerator for trend rate (if type is 'base_rate' and trend).\n"
            + "**`Base Rate Rate Denominator`** - denominator for trend rate (if type is 'base_rate' and trend).\n"
            + "**`Base Rate Projected Value`** - projected value (if type is 'base_rate' and frequency).\n"
            + "**`Base Rate Projected By Year`** - projection year (if type is 'base_rate' and frequency).\n"
            + "**`Base Rate Unit`** - unit of measurement (if type is 'base_rate').\n"
            + "**`Base Rate Extrapolation`** - extrapolation type (if type is 'base_rate').\n"
            + "**`Base Rate Based On`** - what this base rate is based on (if type is 'base_rate').\n"
            + "**`Base Rate Source`** - source of the base rate (if type is 'base_rate').\n"
            + "**`News URL`** - URL of the news article (if type is 'news').\n"
            + "**`News Title`** - title of the news article (if type is 'news').\n"
            + "**`News Source`** - source of the news article (if type is 'news').\n"
            + "**`News Published At`** - publication date of the news article (if type is 'news').\n"
            + "**`News Impact Direction`** - impact direction: 1 for increase, -1 for decrease (if type is 'news').\n"
            + "**`News Certainty`** - certainty level of the news impact (if type is 'news').\n"
        )
    key_factor_output = io.StringIO()
    key_factor_writer = csv.writer(key_factor_output)
    headers = [
        "Key Factor ID",
        "Comment ID",
        "Post ID",
        "Question ID",
        "Question Option",
        "Type",
        "Created At",
        "Votes Score",
    ]
    if anonymized:
        headers.append("Author (Anonymized)")
    else:
        headers.extend(["Author ID", "Author Username"])
    headers.extend(
        [
            "Driver Text",
            "Driver Impact Direction",
            "Driver Certainty",
            "Base Rate Reference Class",
            "Base Rate Type",
            "Base Rate Rate Numerator",
            "Base Rate Rate Denominator",
            "Base Rate Projected Value",
            "Base Rate Projected By Year",
            "Base Rate Unit",
            "Base Rate Extrapolation",
            "Base Rate Based On",
            "Base Rate Source",
            "News URL",
            "News Title",
            "News Source",
            "News Published At",
            "News Impact Direction",
            "News Certainty",
        ]
    )
    key_factor_writer.writerow(headers)
    for kf in key_factors or []:
        kf_type = (
            "driver" if kf.driver_id else ("base_rate" if kf.base_rate_id else "news")
        )
        row = [
            kf.id,
            kf.comment_id,
            kf.comment.on_post_id,
            kf.question_id,
            kf.question_option or None,
            kf_type,
            kf.created_at,
            kf.votes_score,
        ]
        if anonymized:
            row.append(hashlib.sha256(str(kf.comment.author_id).encode()).hexdigest())
        else:
            row.extend([kf.comment.author_id, username_dict.get(kf.comment.author_id)])

        # Driver fields
        if kf.driver:
            row.extend(
                [kf.driver.text, kf.driver.impact_direction, kf.driver.certainty]
            )
        else:
            row.extend([None, None, None])

        # Base Rate fields
        if kf.base_rate:
            row.extend(
                [
                    kf.base_rate.reference_class,
                    kf.base_rate.type,
                    kf.base_rate.rate_numerator,
                    kf.base_rate.rate_denominator,
                    kf.base_rate.projected_value,
                    kf.base_rate.projected_by_year,
                    kf.base_rate.unit,
                    kf.base_rate.extrapolation,
                    kf.base_rate.based_on,
                    kf.base_rate.source,
                ]
            )
        else:
            row.extend([None] * 10)

        # News fields
        if kf.news:
            row.extend(
                [
                    kf.news.url,
                    kf.news.title,
                    kf.news.source,
                    kf.news.published_at,
                    kf.news.impact_direction,
                    kf.news.certainty,
                ]
            )
        else:
            row.extend([None] * 6)

        key_factor_writer.writerow(row)

    # question_link_data csv file (Aggregate Question Links)
    if aggregate_question_links is not None:
        readme_output.write(
            "\n"
            + "\n"
            + "# File: `question_link_data.csv`\n"
            + "\n"
            + "This file contains the aggregate question links (coherence links) for the questions in this dataset.\n"
            + "\n"
            + "### columns:\n"
            + "\n"
            + "**`Link ID`** - the id of the aggregate link.\n"
            + "**`Question 1 ID`** - the id of the first question in the link.\n"
            + "**`Question 1 Title`** - the title of the first question.\n"
            + "**`Question 1 Post ID`** - the post id of the first question.\n"
            + "**`Question 2 ID`** - the id of the second question in the link.\n"
            + "**`Question 2 Title`** - the title of the second question.\n"
            + "**`Question 2 Post ID`** - the post id of the second question.\n"
            + "**`Link Type`** - the type of link (e.g., 'causal').\n"
            + "**`Created At`** - the time when the link was created.\n"
        )
    question_link_output = io.StringIO()
    question_link_writer = csv.writer(question_link_output)
    question_link_writer.writerow(
        [
            "Link ID",
            "Question 1 ID",
            "Question 1 Title",
            "Question 1 Post ID",
            "Question 2 ID",
            "Question 2 Title",
            "Question 2 Post ID",
            "Link Type",
            "Created At",
        ]
    )
    for link in aggregate_question_links or []:
        q1_post_id = link.question1.post_id
        q2_post_id = link.question2.post_id
        question_link_writer.writerow(
            [
                link.id,
                link.question1_id,
                link.question1.title,
                q1_post_id,
                link.question2_id,
                link.question2.title,
                q2_post_id,
                link.type,
                link.created_at,
            ]
        )

    # create a zip file with both csv files
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        zip_file.writestr("README.md", readme_output.getvalue())
        zip_file.writestr("question_data.csv", question_output.getvalue())
        zip_file.writestr("forecast_data.csv", forecast_output.getvalue())
        if comments:
            zip_file.writestr("comment_data.csv", comment_output.getvalue())
        if scores:
            zip_file.writestr("score_data.csv", score_output.getvalue())
        if key_factors:
            zip_file.writestr("key_factor_data.csv", key_factor_output.getvalue())
        if aggregate_question_links:
            zip_file.writestr("question_link_data.csv", question_link_output.getvalue())

    # return the zip file
    return zip_buffer.getvalue()
