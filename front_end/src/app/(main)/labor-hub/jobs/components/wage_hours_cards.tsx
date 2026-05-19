import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { type WageHoursValues } from "../helpers/fetch_wage_and_hours";

type Props = {
  values: WageHoursValues;
};

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function formatHours(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

function valueClass(value: number | null): string {
  if (value == null) return "text-blue-700 dark:text-blue-700-dark";
  if (value > 0) return "text-mc-option-3 dark:text-mc-option-3-dark";
  if (value < 0) return "text-mc-option-2 dark:text-mc-option-2-dark";
  return "text-blue-700 dark:text-blue-700-dark";
}

export async function WageHoursCards({ values }: Props) {
  const t = await getTranslations();
  const { wage2035, hours2035, hours2025 } = values;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-1 flex-col rounded-md border border-blue-300 bg-blue-100 p-4 dark:border-blue-300-dark dark:bg-blue-100-dark">
        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsWagesTitle")}
        </div>
        <div
          className={cn(
            "mt-2 font-geist-mono text-3xl font-bold leading-none",
            valueClass(wage2035)
          )}
        >
          {formatPercent(wage2035)}
        </div>
        <div className="mt-1 text-xs text-blue-700 dark:text-blue-700-dark">
          {wage2035 == null
            ? t("laborHubJobsWagesUnavailable")
            : t("laborHubJobsWagesSub")}
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-md border border-blue-300 bg-blue-100 p-4 dark:border-blue-300-dark dark:bg-blue-100-dark">
        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsHoursTitle")}
        </div>
        <div className="mt-2 font-geist-mono text-3xl font-bold leading-none text-blue-900 dark:text-blue-900-dark">
          {formatHours(hours2035)}
        </div>
        <div className="mt-1 text-xs text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsHoursEconomyWideSub", {
            from: hours2025 != null ? hours2025.toFixed(1) : "—",
          })}
        </div>
      </div>
    </div>
  );
}
