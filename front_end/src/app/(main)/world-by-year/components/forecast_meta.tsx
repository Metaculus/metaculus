"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { LongArrowIcon } from "./icons";
import { useWorldFormatters } from "./use_world_formatters";
import { WorldQuestion } from "../data/questions";
import { probabilityBy } from "../helpers/forecast";

type Props = {
  question: WorldQuestion;
  year: number;
  className?: string;
  labelClassName: string;
  valueClassName: string;
};

// Median date, odds by the year and forecaster count, shared by the statement
// deck and the forecast cards.
const ForecastMeta: FC<Props> = ({
  question,
  year,
  className,
  labelClassName,
  valueClassName,
}) => {
  const t = useTranslations();
  const { formatDate, formatCount, formatProbability } = useWorldFormatters();
  const forecasters = formatCount(question.forecasters);

  const cells = [
    {
      label: t("worldByYearMedianDate"),
      value: formatDate(question.median),
    },
    {
      label: t("worldByYearByYear", { year: String(year) }),
      value: (
        <span className="font-medium text-[var(--wby-year)]">
          {formatProbability(probabilityBy(year + 1, question))}
        </span>
      ),
    },
    {
      label: t("worldByYearForecasters"),
      value: question.metaculusId ? (
        <Link
          href={`/questions/${question.metaculusId}/`}
          aria-label={t("worldByYearOpenMetaculusQuestion", {
            count: forecasters,
            id: String(question.metaculusId),
          })}
          className="relative z-[1] text-inherit underline decoration-transparent decoration-1 underline-offset-[.18em] transition-[text-decoration-color] duration-200 hover:decoration-[rgba(var(--wby-ink),.45)]"
        >
          {forecasters}
          <LongArrowIcon
            direction="right"
            className="ml-[3px] inline size-[.8em] align-[-.05em]"
          />
        </Link>
      ) : (
        forecasters
      ),
    },
  ];

  return (
    <div className={className}>
      {cells.map((cell) => (
        <div key={cell.label}>
          <div className={cn("mb-0.5", labelClassName)}>{cell.label}</div>
          <div className={cn("tabular-nums", valueClassName)}>{cell.value}</div>
        </div>
      ))}
    </div>
  );
};

export default ForecastMeta;
