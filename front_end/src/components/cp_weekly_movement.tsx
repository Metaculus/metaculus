import { faCaretUp, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { fromUnixTime, subWeeks } from "date-fns";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { displayValue, scaleInternalLocation } from "@/utils/charts";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
};

const CPWeeklyMovement: FC<Props> = ({ question, className }) => {
  const t = useTranslations();
  const weeklyMovement = getQuestionWeeklyMovement(question);

  if (!weeklyMovement) {
    return null;
  }

  const isNegative = weeklyMovement < 0;

  return (
    <div className={classNames("flex gap-1", className)}>
      <FontAwesomeIcon
        className={classNames(
          "text-sm",
          isNegative
            ? "text-salmon-600 dark:text-salmon-600-dark"
            : "text-olive-700 dark:text-olive-700-dark"
        )}
        icon={isNegative ? faCaretDown : faCaretUp}
      />
      <span
        className={classNames(
          "text-xs font-medium leading-4",
          isNegative
            ? "text-salmon-600 dark:text-salmon-600-dark"
            : "text-olive-700 dark:text-olive-700-dark"
        )}
      >
        {t("weeklyMovementChange", {
          value: displayValue(Math.abs(weeklyMovement), question.type),
        })}
      </span>
    </div>
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
    historyAggregation.find((el) => fromUnixTime(el.start_time) >= weekAgoDate)
      ?.centers?.[0] ?? null;

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
