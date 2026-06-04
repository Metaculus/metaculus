"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import cn from "@/utils/core/cn";

import { formatSignedPercent } from "../helpers/format";
import { WALL_YEARS, type WallJob, type WallYear } from "../helpers/wall_types";

type TileSize = "top3" | "md" | "sm";

// Top 3 (by |forecast|) are equal-width across the first row; the rest form a
// lighter mosaic below — no single oversized tile.
const SIZE_BUCKETS: { size: TileSize; count: number }[] = [
  { size: "top3", count: 3 },
  { size: "md", count: 8 },
  { size: "sm", count: 4 },
];

function sizeClassNames(size: TileSize): string {
  // Mobile: uniform 1-col-of-3 grid (no size variation).
  // sm+: top row = 3 equal tiles, lighter mosaic below.
  switch (size) {
    case "top3":
      return "col-span-1 sm:col-span-4 sm:row-span-2";
    case "md":
      return "col-span-1 sm:col-span-3";
    case "sm":
      return "col-span-1 sm:col-span-2";
  }
}

function tilePercentClasses(size: TileSize): string {
  // Mobile: uniform text-[26px]; sm+: per-size.
  switch (size) {
    case "top3":
      return "text-[18px] xs:text-[24px] sm:text-[56px]";
    case "md":
      return "text-[18px] xs:text-[24px] sm:text-[40px]";
    case "sm":
      return "text-[18px] xs:text-[24px] sm:text-[30px]";
  }
}

function tileNameClasses(size: TileSize): string {
  // Mobile: uniform text-[11px]; sm+: per-size.
  switch (size) {
    case "top3":
      return "text-[11px] sm:text-[18px]";
    case "md":
      return "text-[11px] sm:text-[14px]";
    case "sm":
      return "text-[11px] sm:text-[12px]";
  }
}

function tickerFontSize(size: TileSize): string {
  switch (size) {
    case "top3":
      return "text-[12px]";
    case "md":
      return "text-[11px]";
    case "sm":
      return "text-[10px]";
  }
}

function tickerDurationSeconds(size: TileSize): number {
  switch (size) {
    case "top3":
      return 35;
    case "md":
      return 30;
    case "sm":
      return 25;
  }
}

/**
 * Deterministic negative animation-delay (seconds) per slug, so tickers that
 * happen to share the same comment never slide in lockstep — and the value is
 * stable between SSR and hydration (no mismatch).
 */
function tickerDelaySeconds(slug: string, duration: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return -(h % duration);
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
      <div className="flex flex-wrap items-center justify-center gap-0 md:justify-between md:gap-3">
        <p className="mb-1 mt-2 text-center text-sm text-blue-700 dark:text-blue-700-dark md:text-left">
          {t("laborHubJobsClickTileSubtitle")}
        </p>
        <div
          className="inline-flex items-center gap-1 rounded-full bg-blue-200 p-1 dark:bg-blue-200-dark"
          role="group"
          aria-label={t("laborHubJobsYearToggleLabel")}
        >
          {WALL_YEARS.map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={y === year}
              onClick={() => setYear(y)}
              className={cn(
                "rounded-full px-3 py-1 font-jetbrains-mono text-sm font-medium transition-colors",
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

      <div className="mt-3 grid auto-rows-[96px] grid-cols-3 gap-2 sm:auto-rows-[130px] sm:grid-cols-12 sm:gap-3 md:mt-5">
        {tiles.map(({ job, size, value }) => {
          const isPositive = value != null && value > 0;
          const isNegative = value != null && value < 0;
          const tone = isPositive
            ? "bg-mc-option-light-3 dark:bg-olive-300-dark text-olive-900 dark:text-olive-900-dark"
            : isNegative
              ? "bg-mc-option-light-2 dark:bg-salmon-100-dark text-salmon-900 dark:text-salmon-900-dark"
              : "bg-blue-300 text-blue-900 dark:bg-blue-300-dark dark:text-blue-900-dark";

          const ticker = tickers?.[job.slug];
          const tickerDuration = tickerDurationSeconds(size);
          const tickerDelay = tickerDelaySeconds(job.slug, tickerDuration);
          return (
            <Link
              key={job.slug}
              href={`/labor-hub/jobs/${job.slug}/`}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-md no-underline",
                "px-3 py-2 sm:px-5 sm:py-[18px]",
                // Mobile never shows ticker → only apply pb-9 at sm+ when ticker is present.
                ticker && "sm:pb-9 sm:pt-[18px]",
                sizeClassNames(size),
                tone
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-black opacity-0 transition-opacity duration-150 group-hover:opacity-[0.08] dark:bg-white dark:group-hover:opacity-[0.06]"
              />
              <span
                className={cn(
                  "relative font-jetbrains-mono font-bold tabular-nums leading-[0.95] tracking-[-0.03em]",
                  tilePercentClasses(size)
                )}
              >
                {formatSignedPercent(value)}
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
                <>
                  {/* Default: 1-line sliding strip with horizontal fade masks */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-1 z-10 hidden h-6 overflow-hidden transition-opacity duration-150 group-hover:opacity-0 sm:block"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)",
                      maskImage:
                        "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)",
                    }}
                  >
                    <div
                      className={cn(
                        "whitespace-nowrap font-medium leading-6 opacity-80 motion-reduce:!animate-none",
                        tickerFontSize(size)
                      )}
                      style={{
                        animation: `labor-hub-ticker-scroll ${tickerDuration}s linear ${tickerDelay}s infinite`,
                      }}
                    >
                      {ticker} &nbsp;·&nbsp; {ticker} &nbsp;·&nbsp;
                    </div>
                  </div>
                  {/* Hover: 3-line static excerpt with bottom fade */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden max-h-0 overflow-hidden bg-inherit opacity-0 transition-[max-height,opacity] duration-200 ease-out group-hover:max-h-[88px] group-hover:opacity-100 sm:block"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
                      maskImage:
                        "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
                    }}
                  >
                    <p
                      className={cn(
                        "m-0 line-clamp-3 px-5 pb-3 pt-1.5 font-medium leading-snug opacity-90",
                        tickerFontSize(size)
                      )}
                    >
                      {ticker}
                    </p>
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
