import classNames from "classnames";
import { fromUnixTime, subWeeks } from "date-fns";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { displayValue, scaleInternalLocation } from "@/utils/charts";

import WeeklyMovement from "./weekly_movement";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
};

const CPWeeklyMovement: FC<Props> = ({ question, className }) => {
  const t = useTranslations();
  const weeklyMovement = getQuestionWeeklyMovement(question);
  const percentagePoints =
    question?.type === QuestionType.Binary ? ` ${t("percentagePoints")}` : "";

  if (!weeklyMovement) {
    return null;
  }

  const message = `${displayValue(
    Math.abs(weeklyMovement),
    question.type
  )}${percentagePoints}`.replace("%", "");

  return (
    <WeeklyMovement
      weeklyMovement={weeklyMovement}
      message={t("weeklyMovementChange", { value: message })}
      className={classNames("text-xs", className)}
      iconClassName="text-sm"
    />
  );
};

function getQuestionWeeklyMovement(
  question: QuestionWithForecasts
): number | null {
  if (
    question.type === QuestionType.MultipleChoice ||
    question.type === QuestionType.Date
  ) {
    return null;
  }
  const latestAggregation = question.aggregations.recency_weighted.latest;
  const historyAggregation = question.aggregations.recency_weighted.history;
  if (!latestAggregation) {
    return null;
  }

  const latestDate = fromUnixTime(latestAggregation.start_time);
  const latestCP = latestAggregation.centers?.[0] ?? null;

  const weekAgoDate = subWeeks(latestDate, 1);
  const weekAgoCP =
    historyAggregation.find(
      (el) => el.end_time && fromUnixTime(el.end_time) >= weekAgoDate
    )?.centers?.[0] ?? null;

  if (!latestCP || !weekAgoCP) {
    return null;
  }

  const delta = latestCP - weekAgoCP;
  if (Math.abs(delta) < 0.1) {
    return null;
  }

  return (
    scaleInternalLocation(latestCP, question.scaling) -
    scaleInternalLocation(weekAgoCP, question.scaling)
  );
}

export default CPWeeklyMovement;