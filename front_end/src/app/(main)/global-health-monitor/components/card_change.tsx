"use client";

import { useTranslations } from "next-intl";

import { ChangeChip } from "./change_chip";
import { useGhmSnapshot } from "./ghm_data_provider";
import { ResolvedChip } from "./resolved_chip";
import { GhmValueKey } from "../config/questions";

/** One line on a card: its outcome once resolved, otherwise how it moved since the previous edition. */
export function CardChange({ value }: { value: GhmValueKey }) {
  const t = useTranslations();
  const snapshot = useGhmSnapshot();
  const datum = snapshot?.values[value];
  const change = datum?.change;
  const compareEdition = snapshot?.compareEdition;

  if (datum?.resolution) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        <ResolvedChip resolution={datum.resolution} />
        {datum.resolution.forecastWas && (
          <span>
            {t("globalHealthMonitorForecastWas", {
              value: datum.resolution.forecastWas,
            })}
          </span>
        )}
      </div>
    );
  }

  if (!change || change.direction === "steady" || !compareEdition) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
      <ChangeChip change={change} sinceLabel={compareEdition.label} />
      <span>
        {t("globalHealthMonitorSinceEdition", { date: compareEdition.label })}
      </span>
    </div>
  );
}
