"use client";

import { useTranslations } from "next-intl";
import { type ReactNode } from "react";

import BaseModal from "@/components/base_modal";

import { MetricComparisonAxis } from "./metric_comparison_axis";
import {
  METRIC_ACCENT_WARM,
  METRIC_DEFS,
  type MetricKey,
} from "../helpers/metric_defs";

type Props = {
  metricKey: MetricKey | null;
  currentSlug: string;
  currentName: string;
  onClose: () => void;
};

const richTags = {
  strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
  em: (chunks: ReactNode) => <em>{chunks}</em>,
};

export function MetricOverlay({
  metricKey,
  currentSlug,
  currentName,
  onClose,
}: Props) {
  const t = useTranslations();
  const def = metricKey ? METRIC_DEFS[metricKey] : null;

  return (
    <BaseModal
      isOpen={metricKey != null}
      onClose={onClose}
      isImmersive
      withCloseButton
      className="flex w-full max-w-[720px] flex-col overflow-hidden p-0 md:max-h-[86vh] md:p-0"
    >
      {def && (
        <div className="overflow-y-auto overflow-x-hidden px-6 py-8 sm:px-9 sm:py-9">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: METRIC_ACCENT_WARM }}
          >
            {t(def.sourceKey)}
          </div>
          <h2 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-blue-900 dark:text-blue-900-dark sm:text-[28px]">
            {t(def.labelKey)}
          </h2>
          <p className="mt-2 text-[13px] font-bold text-blue-700 dark:text-blue-700-dark">
            {t.rich("laborHubJobsMetricChartHead", {
              job: () => (
                <span style={{ color: METRIC_ACCENT_WARM }}>{currentName}</span>
              ),
            })}
          </p>

          <div className="mt-3">
            <MetricComparisonAxis
              metricKey={def.key}
              currentSlug={currentSlug}
            />
          </div>

          <ul className="mt-5 flex list-none flex-col gap-3 p-0">
            {def.natureKeys.map((key) => (
              <li
                key={key}
                className="flex gap-2.5 text-sm leading-relaxed text-blue-800 dark:text-blue-800-dark"
              >
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: METRIC_ACCENT_WARM }}
                />
                <span>{t.rich(key, richTags)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-md bg-mint-200 px-4 py-3 text-[13px] leading-relaxed text-mint-900 dark:bg-mint-200-dark dark:text-mint-900-dark">
            {t(def.boundsKey)}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
