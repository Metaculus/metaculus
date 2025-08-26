"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getBinaryGaugeColors } from "@/utils/colors/binary_gauge_colors";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithNumericForecasts;
  className?: string;
};

const BinaryCompactForecastText: FC<Props> = ({ question, className }) => {
  const t = useTranslations();
  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;
  const cp = latest?.centers?.[0];

  if (question.resolution === "yes" || question.resolution === "no") {
    return (
      <span
        className={cn(
          "text-xs font-medium text-purple-800 dark:text-purple-800-dark",
          className
        )}
      >
        {t("result")}:{" "}
        <span className="font-bold">{t(question.resolution)}</span>
      </span>
    );
  }

  if (cp == null) return null;

  const pctStr = getPredictionDisplayValue(cp, {
    questionType: QuestionType.Binary,
    scaling: question.scaling,
    actual_resolve_time: null,
  });

  const percentage = Math.round(cp * 1000) / 10;
  const isInactive = question.status === QuestionStatus.CLOSED;
  const { textClass } = getBinaryGaugeColors(percentage, isInactive);

  return (
    <span className={cn("text-xs", textClass, className)}>
      <span className="font-bold tabular-nums">{pctStr}</span>
      <span className="font-normal"> {t?.("chance") ?? "chance"}</span>
    </span>
  );
};

export default BinaryCompactForecastText;
