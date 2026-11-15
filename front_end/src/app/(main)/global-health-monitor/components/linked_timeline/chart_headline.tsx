"use client";

import { GhmValueKey } from "../../config/questions";
import { ChangeChip } from "../change_chip";
import { useGhmSnapshot } from "../ghm_data_provider";

export function ChartHeadline({ valueKey }: { valueKey: GhmValueKey }) {
  const snapshot = useGhmSnapshot();
  const datum = snapshot?.values[valueKey];

  if (!datum?.display) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {datum.subtitle && (
        <span className="text-sm font-medium text-blue-700 dark:text-blue-700-dark">
          {datum.subtitle}
        </span>
      )}
      <span className="text-2xl font-bold leading-none text-blue-800 dark:text-blue-800-dark">
        {datum.display}
      </span>
      {datum.change && snapshot?.compareEdition && (
        <ChangeChip
          change={datum.change}
          sinceLabel={snapshot.compareEdition.label}
        />
      )}
    </div>
  );
}
