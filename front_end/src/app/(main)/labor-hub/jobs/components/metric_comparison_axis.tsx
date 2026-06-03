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

  // Render the current job last so its dot sits on top of any clustered ones.
  const sorted = [...JOBS_DATA].sort((a, b) => {
    if (a.slug === currentSlug) return 1;
    if (b.slug === currentSlug) return -1;
    return def.valueOf(a) - def.valueOf(b);
  });

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 px-5 py-6 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
        {t(def.axisLabelKey)}
      </div>

      <div className="group/axis relative h-[120px]">
        {/* End labels */}
        <div className="absolute left-0 top-[86px] flex flex-col">
          <span className="font-jetbrains-mono text-sm font-bold tabular-nums text-blue-800 dark:text-blue-800-dark">
            {def.format(min)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
            {t("laborHubJobsMetricLower")}
          </span>
        </div>
        <div className="absolute right-0 top-[86px] flex flex-col text-right">
          <span className="font-jetbrains-mono text-sm font-bold tabular-nums text-blue-800 dark:text-blue-800-dark">
            {def.format(max)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-600-dark">
            {t("laborHubJobsMetricHigher")}
          </span>
        </div>

        {/* Axis line */}
        <div className="absolute inset-x-0 top-[74px] h-[3px] rounded bg-blue-400 dark:bg-blue-400-dark" />

        {/* Dots */}
        {sorted.map((job) => {
          const isCurrent = job.slug === currentSlug;
          const value = def.valueOf(job);
          return (
            <div
              key={job.slug}
              className={cn(
                "group/dot absolute top-[74px]",
                isCurrent ? "z-20" : "z-10 hover:z-30"
              )}
              style={{ left: `${toPct(value)}%` }}
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
                <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap text-center leading-tight">
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
              ) : (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-blue-900 px-2 py-1 text-xs font-medium text-gray-0 opacity-0 transition-opacity group-hover/dot:opacity-100 dark:bg-blue-900-dark dark:text-gray-0-dark">
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
    </div>
  );
}
