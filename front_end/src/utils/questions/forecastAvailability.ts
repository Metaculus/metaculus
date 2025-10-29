import { isValid } from "date-fns";

import { ForecastAvailability, QuestionWithForecasts } from "@/types/question";

export function getGroupForecastAvailability(
  groupQuestions: QuestionWithForecasts[]
): ForecastAvailability {
  const cpRevealTimes: Array<{ raw: string; formatted: number }> = [];
  for (const q of groupQuestions) {
    if (
      !q.resolution && // always show cp when resolved or annulled
      q.cp_reveal_time
    ) {
      cpRevealTimes.push({
        raw: q.cp_reveal_time,
        formatted: new Date(q.cp_reveal_time).getTime(),
      });
    }
  }

  let closestCPRevealTime: string | null = null;
  if (cpRevealTimes.length) {
    const minDate = Math.min(...cpRevealTimes.map((t) => t.formatted));
    const candidate = cpRevealTimes.find((t) => t.formatted === minDate);
    if (candidate && isValid(new Date(candidate.raw))) {
      closestCPRevealTime = candidate.raw;
    }
  }

  return {
    isEmpty: groupQuestions.every(getIsQuestionForecastEmpty),
    cpRevealsOn:
      closestCPRevealTime && new Date(closestCPRevealTime) >= new Date()
        ? closestCPRevealTime
        : null,
  };
}

export function getQuestionForecastAvailability(
  question: QuestionWithForecasts
): ForecastAvailability {
  return {
    isEmpty: getIsQuestionForecastEmpty(question),
    cpRevealsOn:
      !question.resolution && // always show cp when resolved or annulled
      question.cp_reveal_time &&
      new Date(question.cp_reveal_time) >= new Date()
        ? question.cp_reveal_time
        : null,
  };
}

const getIsQuestionForecastEmpty = (question: QuestionWithForecasts): boolean =>
  !question.aggregations[question.default_aggregation_method].history.length &&
  !question.my_forecasts?.history.length;
