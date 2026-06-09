"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useState } from "react";

import cn from "@/utils/core/cn";

import { MetricOverlay } from "./metric_overlay";
import { type JobDefinition } from "../../data";
import {
  type ExposureLevel,
  getExposureLevel,
  normalize,
} from "../helpers/exposure_thresholds";
import { type MetricKey } from "../helpers/metric_defs";

function levelClasses(level: ExposureLevel): {
  ring: string;
  label: string;
  bar: string;
} {
  switch (level) {
    case "high":
      return {
        ring: "border-salmon-700 dark:border-salmon-700-dark",
        label: "text-salmon-800 dark:text-salmon-900-dark",
        bar: "bg-salmon-700 dark:bg-salmon-700-dark",
      };
    case "med":
      return {
        ring: "border-orange-700 dark:border-orange-700-dark",
        label: "text-orange-700 dark:text-orange-700-dark",
        bar: "bg-orange-700 dark:bg-orange-700-dark",
      };
    case "low":
      return {
        ring: "border-olive-700 dark:border-olive-700-dark",
        label: "text-olive-800 dark:text-olive-800-dark",
        bar: "bg-olive-700 dark:bg-olive-700-dark",
      };
  }
}

function formatValue(key: MetricKey, value: number): string {
  if (key === "aoe") return `${value.toFixed(1)}%`;
  if (key === "mna") return value.toFixed(3);
  return value.toFixed(2);
}

type Props = {
  job: Pick<JobDefinition, "felten" | "mna" | "aoe">;
  currentSlug: string;
};

export function ExposureMetrics({ job, currentSlug }: Props) {
  const t = useTranslations();
  const [active, setActive] = useState<MetricKey | null>(null);

  const ringLabel = (level: ExposureLevel): string =>
    level === "high"
      ? t("laborHubJobsRingHigh")
      : level === "med"
        ? t("laborHubJobsRingMed")
        : t("laborHubJobsRingLow");

  const items: Array<{
    key: MetricKey;
    label: string;
    tooltip: string;
    value: number;
  }> = [
    {
      key: "felten",
      label: t("laborHubJobsFeltenLabel"),
      tooltip: t("laborHubJobsFeltenTooltip"),
      value: job.felten,
    },
    {
      key: "mna",
      label: t("laborHubJobsMnaLabel"),
      tooltip: t("laborHubJobsMnaTooltip"),
      value: job.mna,
    },
    {
      key: "aoe",
      label: t("laborHubJobsAoeLabel"),
      tooltip: t("laborHubJobsAoeTooltip"),
      value: job.aoe,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
        {items.map(({ key, label, tooltip, value }) => {
          const level = getExposureLevel(key, value);
          const pct = normalize(key, value) * 100;
          const cls = levelClasses(level);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`${label} — ${t("laborHubJobsMetricSeeAll")}`}
              onClick={() => setActive(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(key);
                }
              }}
              className="group relative cursor-pointer rounded-md border border-blue-300 bg-blue-100 p-3 transition-colors hover:border-blue-500 hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-blue-300-dark dark:bg-blue-100-dark dark:hover:border-blue-500-dark dark:hover:bg-blue-200-dark dark:focus-visible:ring-blue-700-dark md:p-4"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark md:text-xs">
                  {label}
                </span>
                <div className="flex items-center gap-1 self-start md:gap-1.5 md:self-auto">
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold md:px-2 md:text-xs",
                      cls.ring,
                      cls.label
                    )}
                  >
                    {ringLabel(level)}
                  </span>
                  <FontAwesomeIcon
                    icon={faCircleQuestion}
                    aria-hidden
                    className="hidden text-[14px] text-blue-600 dark:text-blue-600-dark md:inline"
                  />
                </div>
              </div>
              <div className="mt-2 font-jetbrains-mono text-xl font-bold text-blue-900 dark:text-blue-900-dark md:mt-3 md:text-3xl">
                {formatValue(key, value)}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-blue-200 transition-colors group-hover:bg-blue-300 dark:bg-blue-200-dark dark:group-hover:bg-blue-300-dark md:mt-3">
                <div
                  className={cn("h-full rounded-full", cls.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Tile-wide tooltip under the whole card (pointer hover only, so it
                  doesn't linger when focus returns to the tile after the overlay
                  closes). */}
              <div className="pointer-events-none absolute left-0 right-0 top-full z-30 mt-2 hidden rounded-md bg-blue-900 p-3 text-left text-xs leading-snug text-gray-0 shadow-lg can-hover:group-hover:block dark:bg-blue-900-dark dark:text-gray-0-dark">
                <span
                  aria-hidden
                  className="absolute -top-1 left-6 h-2 w-2 rotate-45 bg-blue-900 dark:bg-blue-900-dark"
                />
                <span className="block">{tooltip}</span>
                <span className="mt-1.5 block opacity-60">
                  {t("laborHubJobsMetricSeeAll")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MetricOverlay
        metricKey={active}
        currentSlug={currentSlug}
        onClose={() => setActive(null)}
      />
    </>
  );
}
