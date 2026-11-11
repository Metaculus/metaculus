"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import cn from "@/utils/core/cn";

import { HERO_THEME_CLASSNAME } from "../components/hero_theme";
import OverviewChart from "../components/overview_chart";
import { useWorldYear } from "../components/world_year_provider";
import { medianDate } from "../helpers/forecast";
import { summarizeYear } from "../helpers/overview";

export function OverviewSection() {
  const t = useTranslations();
  const locale = useLocale();
  const { settledYear, settleCount, scrubbing } = useWorldYear();
  const summary = useMemo(() => summarizeYear(settledYear), [settledYear]);

  const { formatDate, formatPercent } = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    const percentFormatter = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
    });
    return {
      formatDate: (median: number) => dateFormatter.format(medianDate(median)),
      formatPercent: (share: number) => percentFormatter.format(share),
    };
  }, [locale]);

  // Chinese sentences run on without a space.
  const sentenceGap = locale.startsWith("zh") ? "" : " ";
  const [first, second] = summary.nextChanges;
  const outlook = first
    ? second
      ? t("worldByYearOverviewNextTwo", {
          first: t(first.changeKey),
          firstDate: formatDate(first.median),
          second: t(second.changeKey),
          secondDate: formatDate(second.median),
        })
      : t("worldByYearOverviewLastOne", {
          first: t(first.changeKey),
          firstDate: formatDate(first.median),
        })
    : t("worldByYearOverviewAllHappened");
  const paragraphs = [
    t(summary.openingKey, { year: String(settledYear) }),
    summary.briefKeys.map((key) => t(key)).join(sentenceGap),
    [
      summary.gapCount
        ? t("worldByYearOverviewGaps", { count: summary.gapCount })
        : null,
      outlook,
    ]
      .filter(Boolean)
      .join(sentenceGap),
  ];

  // While a year is still being picked the text fades back, then eases in
  // once it settles.
  const settlingClassName = cn(
    "transition-opacity duration-[220ms] ease-[ease]",
    scrubbing && "pointer-events-none opacity-30",
    settleCount > 0 &&
      "animate-[wby-settle-in_.3s_ease-out] motion-reduce:animate-none"
  );

  return (
    <section
      data-wby-section="overview"
      className={cn(
        HERO_THEME_CLASSNAME,
        "bg-[var(--wby-bg)] font-sans text-[14px] text-[var(--wby-fg3)]"
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-[var(--wby-pad)] pt-3">
        <div className="flex flex-wrap items-start gap-x-14 gap-y-8 border-b border-[var(--wby-line)] pb-32 pt-11">
          <div
            key={settleCount}
            className={cn("min-w-0 flex-[999_1_520px]", settlingClassName)}
          >
            <div className="mb-[26px] flex gap-4">
              <h2 className="m-0 font-normal">
                <span className="block text-[clamp(26px,2.6vw,34px)] leading-none tracking-[-0.015em] text-[var(--wby-fg)] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] supports-[not_(text-box-trim:trim-both)]:pt-[.02em] supports-[not_(text-box-trim:trim-both)]:leading-[.78]">
                  {t.rich("worldByYearOverviewHeading", {
                    year: () => (
                      <span className="text-[var(--wby-year)]">
                        {settledYear}
                      </span>
                    ),
                  })}
                </span>
              </h2>
            </div>
            {paragraphs.map((text, i) => (
              <p
                key={i}
                className={cn(
                  "mb-0 max-w-[720px] text-[17px] leading-[1.6] text-[var(--wby-fg2)] [text-wrap:pretty]",
                  i ? "mt-3.5" : "mt-0"
                )}
              >
                {text}
              </p>
            ))}
          </div>
          <OverviewChart
            formatPercent={formatPercent}
            settlingClassName={settlingClassName}
          />
        </div>
      </div>
    </section>
  );
}
