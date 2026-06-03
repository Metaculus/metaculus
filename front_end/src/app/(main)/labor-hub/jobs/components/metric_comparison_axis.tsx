"use client";

import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { getJobShort, JOBS_DATA } from "../../data";
import {
  METRIC_ACCENT_WARM,
  METRIC_DEFS,
  type MetricKey,
} from "../helpers/metric_defs";

type Props = {
  metricKey: MetricKey;
  currentSlug: string;
};

export function MetricComparisonAxis({ metricKey, currentSlug }: Props) {
  const t = useTranslations();
  const def = METRIC_DEFS[metricKey];

  const values = JOBS_DATA.map((j) => def.valueOf(j));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const toPct = (v: number) => ((v - min) / span) * 100;

  const currentJob = JOBS_DATA.find((j) => j.slug === currentSlug);
  const currentPct = currentJob ? toPct(def.valueOf(currentJob)) : 50;

  // Pick up to 3 non-current jobs to label by default: spread out and far from
  // the highlighted job, so they give context without crowding it.
  const alwaysLabeled = new Set<string>();
  {
    const candidates = [...JOBS_DATA]
      .filter((j) => j.slug !== currentSlug)
      .sort((a, b) => def.valueOf(a) - def.valueOf(b));
    const pickedPcts: number[] = [];
    for (const job of candidates) {
      if (alwaysLabeled.size >= 3) break;
      const pct = toPct(def.valueOf(job));
      const farFromCurrent = Math.abs(pct - currentPct) > 18;
      const farFromPicked = pickedPcts.every((p) => Math.abs(pct - p) > 16);
      if (farFromCurrent && farFromPicked) {
        alwaysLabeled.add(job.slug);
        pickedPcts.push(pct);
      }
    }
  }

  // Render the current job last so its dot sits on top of any clustered ones.
  const sorted = [...JOBS_DATA].sort((a, b) => {
    if (a.slug === currentSlug) return 1;
    if (b.slug === currentSlug) return -1;
    return def.valueOf(a) - def.valueOf(b);
  });

  // Keep edge labels from overflowing the panel.
  const labelAlignClass = (pct: number) =>
    pct < 12
      ? "left-0 translate-x-0 text-left"
      : pct > 88
        ? "right-0 translate-x-0 text-right"
        : "left-1/2 -translate-x-1/2 text-center";

  const byValueDesc = [...JOBS_DATA].sort(
    (a, b) => def.valueOf(b) - def.valueOf(a)
  );

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 px-5 py-4 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <div className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
        {t(def.axisLabelKey)}
      </div>

      {/* Desktop: horizontal comparison axis */}
      <div className="group/axis relative hidden h-[92px] md:block">
        {/* End labels */}
        <div className="absolute left-0 top-[62px] flex flex-col">
          <span className="font-jetbrains-mono text-sm font-bold tabular-nums text-blue-800 dark:text-blue-800-dark">
            {def.format(min)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
            {t("laborHubJobsMetricLower")}
          </span>
        </div>
        <div className="absolute right-0 top-[62px] flex flex-col text-right">
          <span className="font-jetbrains-mono text-sm font-bold tabular-nums text-blue-800 dark:text-blue-800-dark">
            {def.format(max)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
            {t("laborHubJobsMetricHigher")}
          </span>
        </div>

        {/* Axis line */}
        <div className="absolute inset-x-0 top-[50px] h-[3px] rounded bg-blue-400 dark:bg-blue-400-dark" />

        {/* Dots */}
        {sorted.map((job) => {
          const isCurrent = job.slug === currentSlug;
          const value = def.valueOf(job);
          const pct = toPct(value);
          const align = labelAlignClass(pct);
          return (
            <div
              key={job.slug}
              className={cn(
                "group/dot absolute top-[50px]",
                isCurrent ? "z-20" : "z-10 hover:z-30"
              )}
              style={{ left: `${pct}%` }}
            >
              {/* Enlarged invisible hit-area */}
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 h-16 w-9 -translate-x-1/2 -translate-y-1/2"
              />

              {/* Visible mark */}
              <span
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-gray-0 transition-transform dark:ring-gray-0-dark",
                  isCurrent
                    ? "h-5 w-5"
                    : "h-3.5 w-3.5 bg-blue-500 group-hover/dot:scale-125 group-hover/axis:bg-blue-600 dark:bg-blue-500-dark dark:group-hover/axis:bg-blue-600-dark"
                )}
                style={
                  isCurrent
                    ? {
                        backgroundColor: METRIC_ACCENT_WARM,
                        boxShadow: `0 0 0 6px ${METRIC_ACCENT_WARM}33`,
                      }
                    : undefined
                }
              />

              {isCurrent ? (
                <span
                  className={cn(
                    "absolute bottom-full mb-3 whitespace-nowrap leading-tight",
                    align
                  )}
                >
                  <span
                    className="block text-xs font-bold"
                    style={{ color: METRIC_ACCENT_WARM }}
                  >
                    {getJobShort(job.slug)}
                  </span>
                  <span
                    className="block font-jetbrains-mono text-xs font-bold tabular-nums"
                    style={{ color: METRIC_ACCENT_WARM }}
                  >
                    {def.format(value)}
                  </span>
                </span>
              ) : alwaysLabeled.has(job.slug) ? (
                <span
                  className={cn(
                    "absolute bottom-full mb-3 whitespace-nowrap leading-tight opacity-100 transition-opacity group-hover/axis:opacity-0 group-hover/dot:!opacity-100",
                    align
                  )}
                >
                  <span className="block text-xs font-semibold text-blue-700 dark:text-blue-700-dark">
                    {getJobShort(job.slug)}
                  </span>
                  <span className="block font-jetbrains-mono text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-700-dark">
                    {def.format(value)}
                  </span>
                </span>
              ) : (
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded bg-blue-900 px-2 py-1 text-xs font-medium text-gray-0 opacity-0 transition-opacity group-hover/dot:opacity-100 dark:bg-blue-900-dark dark:text-gray-0-dark",
                    align
                  )}
                >
                  {job.name} ·{" "}
                  <span className="font-jetbrains-mono tabular-nums">
                    {def.format(value)}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact vertical bars (all gray, current job orange) */}
      <div className="mt-2 flex flex-col gap-1.5 md:hidden">
        {byValueDesc.map((job) => {
          const isCurrent = job.slug === currentSlug;
          const value = def.valueOf(job);
          const width = Math.max(toPct(value), 3);
          return (
            <div key={job.slug} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-24 shrink-0 truncate text-[11px]",
                  isCurrent
                    ? "font-bold"
                    : "text-blue-700 dark:text-blue-700-dark"
                )}
                style={isCurrent ? { color: METRIC_ACCENT_WARM } : undefined}
              >
                {getJobShort(job.slug)}
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-200-dark">
                <div
                  className={cn(
                    "h-full rounded-full",
                    !isCurrent && "bg-blue-500 dark:bg-blue-500-dark"
                  )}
                  style={{
                    width: `${width}%`,
                    backgroundColor: isCurrent ? METRIC_ACCENT_WARM : undefined,
                  }}
                />
              </div>
              <span
                className={cn(
                  "w-12 shrink-0 text-right font-jetbrains-mono text-[11px] tabular-nums",
                  isCurrent
                    ? "font-bold"
                    : "text-blue-800 dark:text-blue-800-dark"
                )}
                style={isCurrent ? { color: METRIC_ACCENT_WARM } : undefined}
              >
                {def.format(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
