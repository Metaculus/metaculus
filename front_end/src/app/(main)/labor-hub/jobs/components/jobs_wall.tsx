"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import cn from "@/utils/core/cn";

import {
  WALL_YEARS,
  type WallJob,
  type WallYear,
} from "../helpers/wall_types";

type TileSize = "xl" | "lg" | "md" | "sm";

const SIZE_BUCKETS: { size: TileSize; count: number }[] = [
  { size: "xl", count: 1 },
  { size: "lg", count: 2 },
  { size: "md", count: 8 },
  { size: "sm", count: 4 },
];

function sizeClassNames(size: TileSize): string {
  switch (size) {
    case "xl":
      return "col-span-2 row-span-2 sm:col-span-6 sm:row-span-2";
    case "lg":
      return "col-span-2 row-span-1 sm:col-span-3 sm:row-span-2";
    case "md":
      return "col-span-2 row-span-1 sm:col-span-3 sm:row-span-1";
    case "sm":
      return "col-span-1 row-span-1 sm:col-span-2 sm:row-span-1";
  }
}

function tilePercentClasses(size: TileSize): string {
  switch (size) {
    case "xl":
      return "text-5xl sm:text-7xl";
    case "lg":
      return "text-4xl sm:text-5xl";
    case "md":
      return "text-3xl sm:text-4xl";
    case "sm":
      return "text-2xl sm:text-3xl";
  }
}

function tileNameClasses(size: TileSize): string {
  switch (size) {
    case "xl":
      return "text-lg sm:text-2xl";
    case "lg":
      return "text-base sm:text-xl";
    case "md":
      return "text-sm sm:text-base";
    case "sm":
      return "text-xs sm:text-sm";
  }
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

type SizedTile = { job: WallJob; size: TileSize; value: number | null };

function assignSizes(jobs: WallJob[], year: WallYear): SizedTile[] {
  const sorted = [...jobs]
    .map((j) => ({ job: j, value: j.forecasts[year] }))
    .sort((a, b) => {
      const aMag = a.value == null ? -1 : Math.abs(a.value);
      const bMag = b.value == null ? -1 : Math.abs(b.value);
      return bMag - aMag;
    });

  const result: SizedTile[] = [];
  let i = 0;
  for (const bucket of SIZE_BUCKETS) {
    for (let k = 0; k < bucket.count && i < sorted.length; k++, i++) {
      const entry = sorted[i];
      if (!entry) break;
      result.push({ job: entry.job, size: bucket.size, value: entry.value });
    }
  }
  // Anything left over (shouldn't happen with 15 jobs) gets SM.
  while (i < sorted.length) {
    const entry = sorted[i++];
    if (!entry) break;
    result.push({ job: entry.job, size: "sm", value: entry.value });
  }
  return result;
}

type Props = {
  jobs: WallJob[];
  tickers?: Record<string, string | null>;
};

export function JobsWall({ jobs, tickers }: Props) {
  const t = useTranslations();
  const [year, setYear] = useState<WallYear>("2035");

  const tiles = useMemo(() => assignSizes(jobs, year), [jobs, year]);

  return (
    <div>
      <style>
        {
          "@keyframes labor-hub-ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }"
        }
      </style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsClickTileSubtitle")}
        </p>
        <div
          className="inline-flex items-center gap-1 rounded-full bg-blue-200 p-1 dark:bg-blue-200-dark"
          role="tablist"
          aria-label={t("laborHubJobsYearToggleLabel")}
        >
          {WALL_YEARS.map((y) => (
            <button
              key={y}
              role="tab"
              type="button"
              aria-selected={y === year}
              onClick={() => setYear(y)}
              className={cn(
                "rounded-full px-3 py-1 font-geist-mono text-sm font-medium transition-colors",
                y === year
                  ? "bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark"
                  : "text-blue-700 hover:text-blue-900 dark:text-blue-700-dark dark:hover:text-blue-900-dark"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid auto-rows-[112px] grid-cols-4 gap-2 sm:auto-rows-[120px] sm:grid-cols-12 sm:gap-3">
        {tiles.map(({ job, size, value }) => {
          const isPositive = value != null && value > 0;
          const isNegative = value != null && value < 0;
          const tone = isPositive
            ? "bg-mc-option-light-3 dark:bg-olive-300-dark text-olive-900 dark:text-olive-900-dark"
            : isNegative
              ? "bg-mc-option-light-2 dark:bg-salmon-100-dark text-salmon-800 dark:text-salmon-200-dark"
              : "bg-blue-200 text-blue-900 dark:bg-blue-200-dark dark:text-blue-900-dark";

          const ticker = tickers?.[job.slug];
          return (
            <Link
              key={job.slug}
              href={`/labor-hub/jobs/${job.slug}/`}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-lg p-3 sm:p-4",
                "transition-shadow hover:shadow-sm",
                sizeClassNames(size),
                tone
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-[0.08] dark:bg-white dark:group-hover:opacity-[0.06]"
              />
              <span
                className={cn(
                  "relative font-geist-mono font-extrabold leading-none tracking-tight",
                  tilePercentClasses(size)
                )}
              >
                {formatPercent(value)}
              </span>
              <span
                className={cn(
                  "relative font-semibold leading-tight",
                  tileNameClasses(size)
                )}
              >
                {job.name}
              </span>
              {ticker && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden">
                  <div className="relative h-5 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">
                    <div
                      className="whitespace-nowrap text-[11px] font-medium leading-5 will-change-transform motion-reduce:!animate-none"
                      style={{
                        animation:
                          "labor-hub-ticker-scroll 60s linear infinite",
                      }}
                    >
                      {ticker} &nbsp;·&nbsp; {ticker} &nbsp;·&nbsp;
                    </div>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
