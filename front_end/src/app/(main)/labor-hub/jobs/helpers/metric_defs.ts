import { type TranslationKey } from "@/types/translations";

import { type JobDefinition } from "../../data";

export type MetricKey = "felten" | "mna" | "aoe";

export type MetricDef = {
  key: MetricKey;
  valueOf: (job: Pick<JobDefinition, "felten" | "mna" | "aoe">) => number;
  /** Display formatting — differs per metric (z-score / percentage / 0–100 index). */
  format: (value: number) => string;
  labelKey: TranslationKey;
  /** Short tile tooltip body (reused from the exposure tiles). */
  tooltipKey: TranslationKey;
  sourceKey: TranslationKey;
  axisLabelKey: TranslationKey;
  natureKeys: [TranslationKey, TranslationKey, TranslationKey];
  boundsKey: TranslationKey;
};

export const METRIC_DEFS: Record<MetricKey, MetricDef> = {
  felten: {
    key: "felten",
    valueOf: (job) => job.felten,
    format: (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2),
    labelKey: "laborHubJobsFeltenLabel",
    tooltipKey: "laborHubJobsFeltenTooltip",
    sourceKey: "laborHubJobsFeltenSource",
    axisLabelKey: "laborHubJobsFeltenAxisLabel",
    natureKeys: [
      "laborHubJobsFeltenNature1",
      "laborHubJobsFeltenNature2",
      "laborHubJobsFeltenNature3",
    ],
    boundsKey: "laborHubJobsFeltenBounds",
  },
  mna: {
    key: "mna",
    valueOf: (job) => job.mna,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    labelKey: "laborHubJobsMnaLabel",
    tooltipKey: "laborHubJobsMnaTooltip",
    sourceKey: "laborHubJobsMnaSource",
    axisLabelKey: "laborHubJobsMnaAxisLabel",
    natureKeys: [
      "laborHubJobsMnaNature1",
      "laborHubJobsMnaNature2",
      "laborHubJobsMnaNature3",
    ],
    boundsKey: "laborHubJobsMnaBounds",
  },
  aoe: {
    key: "aoe",
    valueOf: (job) => job.aoe,
    format: (v) => v.toFixed(1),
    labelKey: "laborHubJobsAoeLabel",
    tooltipKey: "laborHubJobsAoeTooltip",
    sourceKey: "laborHubJobsAoeSource",
    axisLabelKey: "laborHubJobsAoeAxisLabel",
    natureKeys: [
      "laborHubJobsAoeNature1",
      "laborHubJobsAoeNature2",
      "laborHubJobsAoeNature3",
    ],
    boundsKey: "laborHubJobsAoeBounds",
  },
};

/** Warm accent used to highlight the current job (same in light & dark). */
export const METRIC_ACCENT_WARM = "#f87248";
