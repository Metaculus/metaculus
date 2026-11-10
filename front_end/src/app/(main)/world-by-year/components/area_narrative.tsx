"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { useWorldFormatters } from "./use_world_formatters";
import { Period, periodLabel } from "../helpers/area_section";

type Props = {
  periods: Period[];
  year: number;
  onYearChange: (year: number) => void;
};

// One block per period between forecasts crossing 50%; the block holding the
// selected year is lit, and any other block jumps the page to its start.
const AreaNarrative: FC<Props> = ({ periods, year, onYearChange }) => {
  const t = useTranslations();
  const { sentenceGap } = useWorldFormatters();

  return (
    <div className="min-w-0 flex-[1_1_520px]">
      {periods.map((period, i) => {
        const current = year >= period.from && year <= period.to;
        return (
          <div
            key={period.from}
            onClick={() => onYearChange(period.from)}
            className={cn(
              "group/period max-w-[720px] cursor-pointer transition-colors duration-[350ms] ease-[ease]",
              current ? "text-[var(--wby-fg2)]" : "text-[var(--wby-muted)]",
              i > 0 && "mt-6"
            )}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onYearChange(period.from);
              }}
              className={cn(
                "relative text-[20px] tabular-nums leading-[1.15] tracking-[-0.005em] underline decoration-transparent decoration-1 underline-offset-[.18em] [transition:color_.35s_ease,text-decoration-color_.2s_ease]",
                current
                  ? "text-[var(--wby-year)]"
                  : "text-[var(--wby-muted)] group-hover/period:text-[var(--wby-t1)] group-hover/period:decoration-[rgba(var(--wby-ink),.45)]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[18px] top-1/2 -mt-[3.5px] size-[7px] rounded-full bg-[var(--wby-fg)] transition-[opacity,transform] duration-[180ms]",
                  current ? "scale-100 opacity-100" : "scale-[.6] opacity-0"
                )}
              />
              {periodLabel(period)}
            </button>
            <p className="mb-0 mt-2 text-[17px] leading-[1.6] tracking-[-0.005em] [text-wrap:pretty]">
              {period.textKeys.map((key) => t(key)).join(sentenceGap)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AreaNarrative;
