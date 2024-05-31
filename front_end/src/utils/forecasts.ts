import { isBefore, isWithinInterval } from "date-fns";

import {
  MultipleChoiceForecast,
  NumericForecast,
  Question,
  QuestionStatus,
} from "@/types/question";

export function getQuestionStatus(question: Question): QuestionStatus | null {
  const publishDate = new Date(question.published_at);
  const closeDate = new Date(question.closed_at);
  const resolveDate = new Date(question.resolved_at);
  const now = new Date();

  if (isBefore(now, publishDate)) {
    return QuestionStatus.Opens;
  }

  if (isWithinInterval(now, { start: publishDate, end: closeDate })) {
    return QuestionStatus.Closes;
  }

  if (isBefore(now, resolveDate)) {
    return QuestionStatus.Resolves;
  }

  return null;
}

export function getForecastPctDisplayValue(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return Number(value).toFixed(1);
}

export function getIsForecastEmpty(
  forecast: MultipleChoiceForecast | NumericForecast | null | undefined
): forecast is null {
  return (
    !forecast ||
    Object.values(forecast).some((value) => !value || !value.length)
  );
}
