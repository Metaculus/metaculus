import csv
import re
from io import StringIO
import numpy as np

from questions.models import Question, AggregateForecast, Forecast
from utils.the_math.formulas import unscaled_location_to_string_location


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
