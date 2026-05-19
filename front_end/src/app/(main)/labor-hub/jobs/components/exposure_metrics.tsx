import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { type JobDefinition } from "../../data";
import {
  type ExposureLevel,
  getExposureLevel,
  normalize,
} from "../helpers/exposure_thresholds";

type MetricKey = "felten" | "mna" | "aoe";

function levelClasses(level: ExposureLevel): {
  ring: string;
  label: string;
  bar: string;
} {
  switch (level) {
    case "high":
      return {
        ring: "border-salmon-700 dark:border-salmon-700-dark",
        label: "text-salmon-800 dark:text-salmon-200-dark",
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
  if (key === "mna") return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(2);
}

type Props = {
  job: Pick<JobDefinition, "felten" | "mna" | "aoe">;
};

export async function ExposureMetrics({ job }: Props) {
  const t = await getTranslations();

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(({ key, label, tooltip, value }) => {
        const level = getExposureLevel(key, value);
        const pct = normalize(key, value) * 100;
        const cls = levelClasses(level);
        return (
          <div
            key={key}
            className="rounded-md border border-blue-300 bg-blue-100 p-4 dark:border-blue-300-dark dark:bg-blue-100-dark"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark"
                title={tooltip}
              >
                {label}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-semibold",
                  cls.ring,
                  cls.label
                )}
              >
                {ringLabel(level)}
              </span>
            </div>
            <div className="mt-3 font-geist-mono text-3xl font-bold text-blue-900 dark:text-blue-900-dark">
              {formatValue(key, value)}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-blue-200 dark:bg-blue-200-dark">
              <div
                className={cn("h-full rounded-full", cls.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
