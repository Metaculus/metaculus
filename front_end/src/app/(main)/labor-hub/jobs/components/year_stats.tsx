import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { type WallYear } from "../helpers/wall_types";

type Props = {
  forecasts: Record<WallYear, number | null>;
};

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

function valueClass(value: number | null): string {
  if (value == null) return "text-blue-700 dark:text-blue-700-dark";
  if (value > 0) return "text-mc-option-3 dark:text-mc-option-3-dark";
  if (value < 0) return "text-mc-option-2 dark:text-mc-option-2-dark";
  return "text-blue-700 dark:text-blue-700-dark";
}

export async function YearStats({ forecasts }: Props) {
  const t = await getTranslations();
  const years: WallYear[] = ["2027", "2030", "2035"];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {years.map((year) => {
        const value = forecasts[year];
        return (
          <div
            key={year}
            className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark sm:p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
              {t("laborHubJobsByYear", { year })}
            </div>
            <div
              className={cn(
                "mt-1 font-jetbrains-mono text-2xl font-bold leading-none sm:text-3xl",
                valueClass(value)
              )}
            >
              {formatPercent(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
