import { fromUnixTime, subWeeks } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { displayValue, scaleInternalLocation } from "@/utils/charts";
import cn from "@/utils/cn";
import { formatValueUnit } from "@/utils/questions";

import WeeklyMovement from "./weekly_movement";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
  checkDelta?: boolean;
  displayUnit?: boolean;
};

const CPWeeklyMovement: FC<Props> = ({
  question,
  className,
  checkDelta = true,
  displayUnit = true,
}) => {
  const t = useTranslations();
  const weeklyMovement = getQuestionWeeklyMovement(question, checkDelta);
  const percentagePoints =
    question?.type === QuestionType.Binary ? ` ${t("percentagePoints")}` : "";

  if (!weeklyMovement) {
    return null;
  }

  const message = `${displayValue({
    value: Math.abs(weeklyMovement),
    questionType: question.type,
  })}${percentagePoints}`.replace("%", "");

  return (
    <WeeklyMovement
      weeklyMovement={weeklyMovement}
      message={t("weeklyMovementChange", {
        value: formatValueUnit(
          message,
          displayUnit ? question.unit : undefined
        ),
      })}
      className={cn("text-xs", className)}
      iconClassName="text-sm"
    />
  );
};

function getQuestionWeeklyMovement(
  question: QuestionWithForecasts,
  checkDelta: boolean = true
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

  const latestCP = latestAggregation.centers?.[0] ?? null;

  const weekAgoDate = subWeeks(Date.now(), 1);

  const weekAgoCP =
    historyAggregation.find(
      (el) =>
        el.end_time &&
        fromUnixTime(el.end_time) >= fromUnixTime(weekAgoDate.getTime() / 1000)
    )?.centers?.[0] ?? null;

  if (isNil(latestCP) || isNil(weekAgoCP)) {
    return null;
  }

  const delta = latestCP - weekAgoCP;
  if (checkDelta && Math.abs(delta) < 0.1) {
    return null;
  }

  return (
    scaleInternalLocation(latestCP, question.scaling) -
    scaleInternalLocation(weekAgoCP, question.scaling)
  );
}

export default CPWeeklyMovement;
