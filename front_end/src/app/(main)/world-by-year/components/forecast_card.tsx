"use client";

import { useTranslations } from "next-intl";
import { FC, useId } from "react";

import ForecastMeta from "./forecast_meta";
import { KIND_COLOR } from "./milestone_card";
import { QuestionCopy } from "../data/area_sections";
import { WorldQuestion } from "../data/questions";
import {
  DENSITY_HEIGHT,
  DENSITY_WIDTH,
  densityPaths,
} from "../helpers/area_section";
import { linearPosition } from "../helpers/forecast";

const AXIS_YEARS = [2026, 2040, 2050];

type Props = {
  question: WorldQuestion;
  copy: QuestionCopy;
  year: number;
};

const ForecastCard: FC<Props> = ({ question, copy, year }) => {
  const t = useTranslations();
  const fadeId = useId();
  const color = KIND_COLOR[question.kind];
  const yearX = linearPosition(year + 1) * DENSITY_WIDTH;
  const medianX = linearPosition(question.median) * DENSITY_WIDTH;
  const paths = densityPaths(question, yearX);

  return (
    <article className="relative flex min-w-0 flex-col gap-2.5 rounded-2xl border border-[rgba(var(--wby-ink),.12)] bg-[var(--wby-panel)] p-5">
      <div className="flex items-center gap-[7px] text-[11px] font-medium leading-[1.3] tracking-[.01em]">
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(var(--wby-ink),.1)] bg-[rgba(var(--wby-ink),.07)] py-[3px] pl-[7px] pr-[9px]">
          <i
            className="size-[7px] shrink-0 rounded-[2px]"
            style={{ background: color }}
          />
          <span style={{ color }}>
            {t(
              question.kind === "cap"
                ? "worldByYearCapability"
                : "worldByYearAdoption"
            )}
          </span>
        </span>
        {question.metaculusId && (
          <span className="min-w-0 truncate text-[var(--wby-muted)]">
            {t("worldByYearSourceMetaculus")}
          </span>
        )}
      </div>
      <h3 className="m-0 text-[20px] font-normal leading-[1.2] tracking-[-0.005em] text-[var(--wby-fg)] [text-wrap:balance]">
        {t(copy.titleKey)}
      </h3>
      <div className="mt-auto pt-2">
        <svg
          viewBox={`0 0 ${DENSITY_WIDTH} ${DENSITY_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden
          className="block h-14 w-full"
        >
          <defs>
            <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.42} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={paths.area}
            fill={`color-mix(in oklch, ${color} 6%, transparent)`}
          />
          {paths.areaToYear && (
            <path d={paths.areaToYear} fill={`url(#${fadeId})`} />
          )}
          <path
            d={paths.line}
            fill="none"
            stroke={color}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={medianX}
            x2={medianX}
            y1={0}
            y2={DENSITY_HEIGHT}
            stroke="var(--wby-fg)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={yearX}
            x2={yearX}
            y1={0}
            y2={DENSITY_HEIGHT}
            stroke="var(--wby-year)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="mt-[5px] flex justify-between text-[11px] tabular-nums text-[var(--wby-dim)]">
          {AXIS_YEARS.map((axisYear) => (
            <span key={axisYear}>{axisYear}</span>
          ))}
        </div>
      </div>
      <ForecastMeta
        question={question}
        year={year}
        className="mt-3.5 grid grid-cols-3 gap-3 border-t border-[var(--wby-line)] pt-3"
        labelClassName="text-[11px] leading-[1.3] tracking-[.01em] text-[var(--wby-muted)]"
        valueClassName="text-[15px] text-[var(--wby-fg4)]"
      />
    </article>
  );
};

export default ForecastCard;
