"use client";

import { useTranslations } from "next-intl";

import { ChangeChip } from "./change_chip";
import { useGhmSnapshot } from "./ghm_data_provider";
import { GhmValueKey } from "../config/questions";

/** One line on a card: how its forecast moved since the previous edition. */
export function CardChange({ value }: { value: GhmValueKey }) {
  const t = useTranslations();
  const snapshot = useGhmSnapshot();
  const change = snapshot?.values[value]?.change;
  const compareEdition = snapshot?.compareEdition;

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
