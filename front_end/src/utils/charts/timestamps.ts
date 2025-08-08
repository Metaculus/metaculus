import { uniq } from "lodash";

import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

export function getQuestionTimestamps(
  question: QuestionWithForecasts
): number[] {
  return uniq([
    ...question.aggregations[question.default_aggregation_method].history.map(
      (x) => x.start_time
    ),
    ...question.aggregations[question.default_aggregation_method].history.map(
      (x) => x.end_time ?? x.start_time
    ),
  ]).sort((a, b) => a - b);
}

export function getGroupQuestionsTimestamps(
  questions: QuestionWithNumericForecasts[],
  options?: {
    withUserTimestamps?: boolean;
  }
): number[] {
  const { withUserTimestamps } = options ?? {};

  if (withUserTimestamps) {
    return uniq(
      questions.reduce<number[]>(
        (acc, question) => [
          ...acc,
          ...(question.my_forecasts?.history?.map((x) => x.start_time) ?? []),
          ...(question.my_forecasts?.history?.map(
            (x) => x.end_time ?? x.start_time
          ) ?? []),
        ],
        []
      )
    ).sort((a, b) => a - b);
  }

  return uniq(
    questions.reduce<number[]>(
      (acc, question) => [
        ...acc,
        ...question.aggregations[
          question.default_aggregation_method
        ].history.map((x) => x.start_time),
        ...question.aggregations[
          question.default_aggregation_method
        ].history.map((x) => x.end_time ?? x.start_time),
        // add user timestamps to display new forecast tooltip without page refresh
        ...(question.my_forecasts?.history?.map((x) => x.start_time) ?? []),
        ...(question.my_forecasts?.history?.map(
          (x) => x.end_time ?? x.start_time
        ) ?? []),
      ],
      []
    )
  ).sort((a, b) => a - b);
}
