"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import Tooltip from "@/components/ui/tooltip";
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
  if (key === "mna") return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(2);
}

type Props = {
  job: Pick<JobDefinition, "felten" | "mna" | "aoe">;
};

export function ExposureMetrics({ job }: Props) {
  const t = useTranslations();

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
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {items.map(({ key, label, tooltip, value }) => {
        const level = getExposureLevel(key, value);
        const pct = normalize(key, value) * 100;
        const cls = levelClasses(level);
        return (
          <div
            key={key}
            className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark md:p-4"
          >
            <div className="flex items-center justify-between gap-1 md:gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark md:text-xs">
                {label}
              </span>
              <div className="flex items-center gap-1 md:gap-1.5">
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold md:px-2 md:text-xs",
                    cls.ring,
                    cls.label
                  )}
                >
                  {ringLabel(level)}
                </span>
                <Tooltip
                  tooltipContent={tooltip}
                  showDelayMs={150}
                  placement="top"
                >
                  <button
                    type="button"
                    aria-label={tooltip}
                    className="hidden h-4 w-4 cursor-help items-center justify-center rounded-full text-blue-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 dark:text-blue-600-dark dark:focus-visible:ring-blue-700-dark md:inline-flex"
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="text-[14px]"
                    />
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="mt-2 font-jetbrains-mono text-xl font-bold text-blue-900 dark:text-blue-900-dark md:mt-3 md:text-3xl">
              {formatValue(key, value)}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-blue-200 dark:bg-blue-200-dark md:mt-3">
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
